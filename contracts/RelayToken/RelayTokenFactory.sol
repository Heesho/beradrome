// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract RelayTokenRewarder is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 public constant DURATION = 7 days;  // rewards are released over 7 days

    /*----------  STATE VARIABLES  --------------------------------------*/

    // struct to store reward data for each reward token
    struct Reward {
        uint256 periodFinish;           // timestamp when reward period ends
        uint256 rewardRate;             // reward rate per second
        uint256 lastUpdateTime;         // timestamp when reward data was last updated
        uint256 rewardPerTokenStored;   // reward per virtual token stored
    }

    mapping(address => Reward) public rewardData;   // reward token -> reward data
    mapping(address => bool) public isRewardToken;  // reward token -> true if reward token
    address[] public rewardTokens;                  // array of reward tokens
    address public immutable relayToken;            // address of relay token contract

    mapping(address => mapping(address => uint256)) public userRewardPerTokenPaid;  // user -> reward token -> reward per virtual token paid
    mapping(address => mapping(address => uint256)) public rewards;                 // user -> reward token -> reward amount

    uint256 private _totalSupply;                   // total supply of virtual tokens
    mapping(address => uint256) private _balances;  // user -> virtual token balance

    /*----------  ERRORS ------------------------------------------------*/

    error RelayToken__NotAuthorizedUser();
    error RelayToken__NotRewardToken();
    error RelayToken__RewardTokenAlreadyAdded();
    error RelayToken__InvalidZeroInput();

    /*----------  EVENTS ------------------------------------------------*/

    event RelayToken__RewardAdded(address indexed rewardToken);
    event RelayToken__RewardNotified(address indexed rewardToken, uint256 reward);
    event RelayToken__Deposited(address indexed user, uint256 amount);
    event RelayToken__Withdrawn(address indexed user, uint256 amount);
    event RelayToken__RewardPaid(address indexed user, address indexed rewardsToken, uint256 reward);

    /*----------  MODIFIERS  --------------------------------------------*/

    modifier updateReward(address account) {
        for (uint i; i < rewardTokens.length; i++) {
            address token = rewardTokens[i];
            rewardData[token].rewardPerTokenStored = rewardPerToken(token);
            rewardData[token].lastUpdateTime = lastTimeRewardApplicable(token);
            if (account != address(0)) {
                rewards[account][token] = earned(account, token);
                userRewardPerTokenPaid[account][token] = rewardData[token].rewardPerTokenStored;
            }
        }
        _;
    }

    modifier nonZeroInput(uint256 _amount) {
        if (_amount == 0) revert RelayToken__InvalidZeroInput();
        _;
    }
    
    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(address _relayToken) {
        relayToken = _relayToken;
    }

    /**
     * @notice Claim rewards accrued for an account. Claimed rewards are sent to the account.
     *         Can only be called by account or voter contract.
     * @param account The account to claim rewards for.
     */
    function getReward(address account) 
        external  
        updateReward(account) 
    {
        for (uint i; i < rewardTokens.length; i++) {
            address _rewardsToken = rewardTokens[i];
            uint256 reward = rewards[account][_rewardsToken];
            if (reward > 0) {
                rewards[account][_rewardsToken] = 0;
                emit RelayToken__RewardPaid(account, _rewardsToken, reward);
                
                IERC20(_rewardsToken).safeTransfer(account, reward);
            }
        }
    }

    /**
     * @notice Begin reward distribution to accounts with non-zero balances. Transfers tokens from msg.sender
     *         to this contract and begins accounting for distribution with new reward token rates. Only 
     *         the voter contract can call this function on existing reward tokens.
     * @param _rewardsToken the reward token to begin distribution for
     * @param reward the amount of reward tokens to distribute
     */
    function notifyRewardAmount(address _rewardsToken, uint256 reward) 
        external
        nonReentrant
        updateReward(address(0))
    {
        if (!isRewardToken[_rewardsToken]) revert RelayToken__NotRewardToken();

        IERC20(_rewardsToken).safeTransferFrom(msg.sender, address(this), reward);
        if (block.timestamp >= rewardData[_rewardsToken].periodFinish) {
            rewardData[_rewardsToken].rewardRate = reward / DURATION;
        } else {
            uint256 remaining = rewardData[_rewardsToken].periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardData[_rewardsToken].rewardRate;
            rewardData[_rewardsToken].rewardRate = (reward + leftover) / DURATION;
        }
        rewardData[_rewardsToken].lastUpdateTime = block.timestamp;
        rewardData[_rewardsToken].periodFinish = block.timestamp + DURATION;
        emit RelayToken__RewardNotified(_rewardsToken, reward);
    }

    function deposit(uint256 amount) 
        external 
        nonZeroInput(amount)
        updateReward(msg.sender)
    {
        _totalSupply = _totalSupply + amount;
        _balances[msg.sender] = _balances[msg.sender] + amount;
        emit RelayToken__Deposited(msg.sender, amount);
        IERC20(relayToken).safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 amount) 
        external 
        nonZeroInput(amount)
        updateReward(msg.sender) 
    {
        _totalSupply = _totalSupply - amount;
        _balances[msg.sender] = _balances[msg.sender] - amount;
        emit RelayToken__Withdrawn(msg.sender, amount);
        IERC20(relayToken).safeTransfer(msg.sender, amount);
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    /**
     * @notice Adds a reward token for distribution. Only voter contract can call this function.
     * @param _rewardsToken the reward token to add
     */
    function addReward(address _rewardsToken) 
        external 
        onlyOwner()
    {
        if (isRewardToken[_rewardsToken]) revert RelayToken__RewardTokenAlreadyAdded();
        rewardTokens.push(_rewardsToken);
        isRewardToken[_rewardsToken] = true;
        emit RelayToken__RewardAdded(_rewardsToken);
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function left(address rewardToken) external view returns (uint256) {
        if (block.timestamp >= rewardData[rewardToken].periodFinish) return 0;
        uint256 remaining = rewardData[rewardToken].periodFinish - block.timestamp;
        return remaining * rewardData[rewardToken].rewardRate;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function lastTimeRewardApplicable(address _rewardsToken) public view returns (uint256) {
        return Math.min(block.timestamp, rewardData[_rewardsToken].periodFinish);
    }

    function rewardPerToken(address _rewardsToken) public view returns (uint256) {
        if (_totalSupply == 0) return rewardData[_rewardsToken].rewardPerTokenStored;
        return
            rewardData[_rewardsToken].rewardPerTokenStored + ((lastTimeRewardApplicable(_rewardsToken) - rewardData[_rewardsToken].lastUpdateTime) 
            * rewardData[_rewardsToken].rewardRate * 1e18 / _totalSupply);
    }

    function earned(address account, address _rewardsToken) public view returns (uint256) {
        return 
            (_balances[account] * (rewardPerToken(_rewardsToken) - userRewardPerTokenPaid[account][_rewardsToken]) / 1e18) 
            + rewards[account][_rewardsToken];
    }

    function getRewardForDuration(address _rewardsToken) external view returns (uint256) {
        return rewardData[_rewardsToken].rewardRate * DURATION;
    }

}

interface IVoter {
    function vote(address[] calldata plugins, uint256[] calldata weights) external;
    function claimBribes(address[] memory bribes) external;
}

interface IVTOKENRewarder {
    function getReward(address account) external;
}

interface IVTOKEN {
    function deposit(uint256 amount) external;
    function burnFor(address account, uint256 amount) external;
}

interface ITOKEN {
    function getAccountCredit(address account) external view returns (uint256);
    function buy(uint256 amountBase, uint256 minToken, uint256 expireTimestamp, address toAccount, address provider) external;
    function borrow(uint256 amountBase) external;
}

interface IMulticall {
    function quoteBuyIn(uint256 input, uint256 slippageTolerance) external view returns (uint256 output, uint256 slippage, uint256 minOutput, uint256 autoMinOutput);
}

contract RelayToken is ERC20, ERC20Permit, ERC20Votes, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 public constant DIVISOR = 10000;
    uint256 public constant PRECISION = 1e18;
    uint256 public constant PROTOCOL_FEE = 1000;    // 10%
    uint256 public constant MAX_FEE = 4000;         // 40%
    uint256 public constant MAX_SLIPPAGE = 8000;    // 20% slippage

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable relayTokenFactory;
    address public immutable base;
    address public immutable token;
    address public immutable oToken;
    address public immutable vToken;
    address public immutable vTokenRewarder;

    address public voter;
    address public multicall;

    address public delegate;
    address public treasury;

    address[] public plugins;
    uint256[] public weights;

    uint256 public slippageTolerance = 9500; // 5% slippage
    uint256 public treasureyFee = 1000; // 10%

    /*----------  ERRORS ------------------------------------------------*/

    error RelayToken__InvalidZeroInput();
    error RelayToken__InvalidZeroAddress();
    error RelayToken__NotDelegate();
    error RelayToken__InvalidVote();
    error RelayToken__InvalidInput();

    /*----------  EVENTS ------------------------------------------------*/

    event RelayToken__Mint(address indexed minter, address indexed account, uint256 amount);

    /*----------  MODIFIERS  --------------------------------------------*/

    modifier nonZeroInput(uint256 _amount) {
        if (_amount == 0) revert RelayToken__InvalidZeroInput();
        _;
    }

    modifier nonZeroAddress(address _account) {
        if (_account == address(0)) revert RelayToken__InvalidZeroAddress();
        _;
    }

    modifier onlyDelegate() {
        if (msg.sender != delegate) revert RelayToken__NotDelegate();
        _;
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _relayTokenFactory,
        address _base, 
        address _token, 
        address _oToken, 
        address _vToken, 
        address _vTokenRewarder,
        address _voter,
        address _multicall,
        string memory _name,
        string memory _symbol
    )
        ERC20(_name, _symbol) 
        ERC20Permit(_name)
    {
        relayTokenFactory = _relayTokenFactory;
        base = _base;
        token = _token;
        oToken = _oToken;
        vToken = _vToken;
        vTokenRewarder = _vTokenRewarder;
        voter = _voter;
        multicall = _multicall;
        delegate = msg.sender;
        treasury = msg.sender;
    }

    function mint(address account, uint256 amount) 
        external
        nonReentrant
        nonZeroInput(amount)
    {
        _mint(account, amount);
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit RelayToken__Mint(msg.sender, account, amount);
    }

    function vote()
        external
    {
        IVoter(voter).vote(plugins, weights);
    }

    function claimBribes(address[] calldata bribes) 
        external
    {
        IVoter(voter).claimBribes(bribes);
    }
    
    function sweepTokens(address[] calldata tokens) 
        external
    {
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] != base && tokens[i] != token && tokens[i] != oToken && tokens[i] != vToken) {
                IERC20(tokens[i]).safeTransfer(treasury, IERC20(tokens[i]).balanceOf(address(this)));
            }
        }
    }

    function claimVTokenRewards() 
        public
    {
        IVTOKENRewarder(vTokenRewarder).getReward(address(this));
    }

    function burnOTokenForVToken() 
        public
    {
        uint256 balance = IERC20(oToken).balanceOf(address(this));
        if (balance > 0) {
            IERC20(oToken).safeApprove(vToken, 0);
            IERC20(oToken).safeApprove(vToken, balance);
            IVTOKEN(vToken).burnFor(address(this), balance);
        }
    }

    function stakeTokenForVToken() 
        public
    {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance > 0) {
            IERC20(token).safeApprove(vToken, 0);
            IERC20(token).safeApprove(vToken, balance);
            IVTOKEN(vToken).deposit(balance);
        }
    }

    function borrowBase() 
        public
    {
        uint256 credit = ITOKEN(token).getAccountCredit(address(this));
        if (credit > 0) {
            ITOKEN(token).borrow(credit);
        }
    }

    function buyTokenWithBase(uint256 amountBase) 
        public
        nonZeroInput(amountBase)
    {
        uint256 treasuryFeeAmount = amountBase * treasureyFee / DIVISOR;
        IERC20(base).safeTransfer(treasury, treasuryFeeAmount);
        amountBase -= treasuryFeeAmount;

        uint256 protocolFeeAmount = amountBase * PROTOCOL_FEE / DIVISOR;
        IERC20(base).safeTransfer(RelayTokenFactory(relayTokenFactory).protocol(), protocolFeeAmount);
        amountBase -= protocolFeeAmount;

        IERC20(base).safeApprove(token, 0);
        IERC20(base).safeApprove(token, amountBase);
        (,,uint256 minOutput,) = IMulticall(multicall).quoteBuyIn(amountBase, slippageTolerance);
        ITOKEN(token).buy(amountBase, minOutput, block.timestamp + 1800, address(this), address(this));
    }

    function buyTokenWithMaxBase() 
        public
    {
        uint256 balance = IERC20(base).balanceOf(address(this));
        if (balance > 0) {
            buyTokenWithBase(balance);
        }
    }

    function loop(uint256 loops) 
        external 
    {
        for (uint256 i = 0; i < loops; i++) {
            claimVTokenRewards();
            burnOTokenForVToken();
            stakeTokenForVToken();
            borrowBase();
            buyTokenWithMaxBase();
        }
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    function setVotes(address[] calldata _plugins, uint256[] calldata _weights) 
        external 
        onlyDelegate() 
    {
        if (_plugins.length != _weights.length) revert RelayToken__InvalidVote();
        plugins = _plugins;
        weights = _weights;
    }

    function setVoter(address _voter) 
        external 
        onlyOwner() 
        nonZeroAddress(_voter) 
    {
        voter = _voter;
    }

    function setMulticall(address _multicall) 
        external 
        onlyOwner() 
        nonZeroAddress(_multicall) 
    {
        multicall = _multicall;
    }

    function setDelegate(address _delegate) 
        external 
        onlyOwner() 
        nonZeroAddress(_delegate) 
    {
        delegate = _delegate;
    }

    function setTreasury(address _treasury) 
        external 
        onlyOwner() 
        nonZeroAddress(_treasury) 
    {
        treasury = _treasury;
    }

    function setSlippageTolerance(uint256 _slippageTolerance) 
        external 
        onlyOwner() 
    {
        if (_slippageTolerance < MAX_SLIPPAGE) revert RelayToken__InvalidInput();
        slippageTolerance = _slippageTolerance;
    }

    function setTreasuryFee(uint256 _treasureyFee) 
        external 
        onlyOwner() 
    {
        if (_treasureyFee > MAX_FEE) revert RelayToken__InvalidInput();
        treasureyFee = _treasureyFee;
    }

    /*----------  FUNCTION OVERRIDES  -----------------------------------*/

    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20)
    {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getVotes() 
        external 
        view 
        returns (address[] memory, uint256[] memory) 
    {
        return (plugins, weights);
    }

}

contract RelayTokenFactory is Ownable {

    address public immutable base;
    address public immutable token;
    address public immutable oToken;
    address public immutable vToken;
    address public immutable vTokenRewarder;

    address public voter;
    address public multicall;
    address public protocol;

    error RelayTokenFactory__InvalidZeroAddress();

    event RelayTokenFactory__RelayTokenCreated(string name, string symbol, address indexed relayToken, address indexed relayTokenRewarder);

    constructor(
        address _base, 
        address _token, 
        address _oToken, 
        address _vToken, 
        address _vTokenRewarder,
        address _voter,
        address _multicall
    ) {
        base = _base;
        token = _token;
        oToken = _oToken;
        vToken = _vToken;
        vTokenRewarder = _vTokenRewarder;
        voter = _voter;
        multicall = _multicall;
    }

    function createRelayToken(string calldata name, string calldata symbol) external returns (address) {
        RelayToken relayToken = new RelayToken(
            address(this),
            base,
            token,
            oToken,
            vToken,
            vTokenRewarder,
            voter,
            multicall,
            name,
            symbol
        );
        RelayTokenRewarder relayTokenRewarder = new RelayTokenRewarder(address(relayToken));
        relayToken.transferOwnership(msg.sender);
        relayTokenRewarder.transferOwnership(msg.sender);
        emit RelayTokenFactory__RelayTokenCreated(name, symbol, address(relayToken), address(relayTokenRewarder));
        return address(relayToken);
    }

    function setVoter(address _voter) external onlyOwner() {
        if (_voter == address(0)) revert RelayTokenFactory__InvalidZeroAddress();
        voter = _voter;
    }

    function setMulticall(address _multicall) external onlyOwner() {
        if (_multicall == address(0)) revert RelayTokenFactory__InvalidZeroAddress();
        multicall = _multicall;
    }

    function setProtocol(address _protocol) external onlyOwner() {
        if (_protocol == address(0)) revert RelayTokenFactory__InvalidZeroAddress();
        protocol = _protocol;
    }

}