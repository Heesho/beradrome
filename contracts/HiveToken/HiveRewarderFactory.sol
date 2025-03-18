// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

interface IBerachainRewardVaultFactory {
    function createRewardVault(address _vaultToken) external returns (address);
}

interface IRewardVault {
    function delegateStake(address account, uint256 amount) external;
    function delegateWithdraw(address account, uint256 amount) external;
}

contract VaultToken is ERC20, Ownable {
    constructor() ERC20("Hive Vault Token", "HVT") {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}

contract HiveRewarder is ReentrancyGuard, Ownable {
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

    address public immutable hiveFactory;          // address of hive factory contract
    address public immutable hiveToken;            // address of hive token contract

    address public immutable vaultToken;  // staking token address for Berachain Rewards Vault Delegate Stake
    address public immutable rewardVault;   // reward vault address for Berachain Rewards Vault Delegate Stake

    mapping(address => Reward) public rewardData;   // reward token -> reward data
    mapping(address => bool) public isRewardToken;  // reward token -> true if reward token
    address[] public rewardTokens;                  // array of reward tokens

    mapping(address => mapping(address => uint256)) public userRewardPerTokenPaid;  // user -> reward token -> reward per virtual token paid
    mapping(address => mapping(address => uint256)) public rewards;                 // user -> reward token -> reward amount

    uint256 private _totalSupply;                   // total supply of virtual tokens
    mapping(address => uint256) private _balances;  // user -> virtual token balance

    /*----------  ERRORS ------------------------------------------------*/

    error HiveRewarder__NotAuthorizedUser();
    error HiveRewarder__NotRewardToken();
    error HiveRewarder__RewardTokenAlreadyAdded();
    error HiveRewarder__InvalidZeroInput();
    error HiveRewarder__NotAdmin();

    /*----------  EVENTS ------------------------------------------------*/

    event HiveRewarder__RewardAdded(address indexed rewardToken);
    event HiveRewarder__RewardNotified(address indexed rewardToken, uint256 reward);
    event HiveRewarder__Deposited(address indexed user, uint256 amount);
    event HiveRewarder__Withdrawn(address indexed user, uint256 amount);
    event HiveRewarder__RewardPaid(address indexed user, address indexed rewardsToken, uint256 reward);

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
        if (_amount == 0) revert HiveRewarder__InvalidZeroInput();
        _;
    }

    modifier onlyAdmin() {
        if (msg.sender != hiveFactory && msg.sender != owner()) revert HiveRewarder__NotAdmin();
        _;
    }
    
    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(address _hiveFactory, address _hiveToken, address _vaultFactory) {
        hiveFactory = _hiveFactory;
        hiveToken = _hiveToken;
        vaultToken = address(new VaultToken());
        rewardVault = IBerachainRewardVaultFactory(_vaultFactory).createRewardVault(vaultToken);
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
                emit HiveRewarder__RewardPaid(account, _rewardsToken, reward);
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
        if (!isRewardToken[_rewardsToken]) revert HiveRewarder__NotRewardToken();

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
        emit HiveRewarder__RewardNotified(_rewardsToken, reward);
    }

    function deposit(address account, uint256 amount) 
        external 
        nonZeroInput(amount)
        updateReward(account)
    {
        _totalSupply = _totalSupply + amount;
        _balances[account] = _balances[account] + amount;
        emit HiveRewarder__Deposited(account, amount);
        IERC20(hiveToken).safeTransferFrom(msg.sender, address(this), amount);

        // Berachain Rewards Vault Delegate Stake
        VaultToken(vaultToken).mint(address(this), amount);
        IERC20(vaultToken).safeApprove(rewardVault, 0);
        IERC20(vaultToken).safeApprove(rewardVault, amount);
        IRewardVault(rewardVault).delegateStake(account, amount);
    }

    function withdraw(address account, uint256 amount) 
        external 
        nonZeroInput(amount)
        updateReward(msg.sender) 
    {
        _totalSupply = _totalSupply - amount;
        _balances[msg.sender] = _balances[msg.sender] - amount;
        emit HiveRewarder__Withdrawn(msg.sender, amount);
        IERC20(hiveToken).safeTransfer(account, amount);
        // Berachain Rewards Vault Delegate Stake
        IRewardVault(rewardVault).delegateWithdraw(msg.sender, amount);
        VaultToken(vaultToken).burn(address(this), amount);
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    /**
     * @notice Adds a reward token for distribution. Only voter contract can call this function.
     * @param _rewardsToken the reward token to add
     */
    function addReward(address _rewardsToken) 
        external 
        onlyAdmin()
    {
        if (isRewardToken[_rewardsToken]) revert HiveRewarder__RewardTokenAlreadyAdded();
        rewardTokens.push(_rewardsToken);
        isRewardToken[_rewardsToken] = true;
        emit HiveRewarder__RewardAdded(_rewardsToken);
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

contract HiveRewarderFactory {
    
    address public hiveFactory;
    address public vaultRewarderFactory;
    address public lastHiveRewarder;

    error HiveRewarderFactory__Unathorized();
    error HiveRewarderFactory__InvalidZeroAddress();

    event HiveRewarderFactory__HiveFactorySet(address indexed account);
    event HiveRewarderFactory__HiveRewarderCreated(address indexed hiveRewarder);

    modifier onlyHiveFactory() {
        if (msg.sender != hiveFactory) revert HiveRewarderFactory__Unathorized();
        _;
    }

    constructor(address _hiveFactory, address _vaultRewarderFactory) {
        hiveFactory = _hiveFactory;
        vaultRewarderFactory = _vaultRewarderFactory;
    }

    function createHiveRewarder(address owner, address hiveToken) external onlyHiveFactory returns (address) {
        HiveRewarder hiveRewarder = new HiveRewarder(hiveFactory, hiveToken, vaultRewarderFactory);
        hiveRewarder.transferOwnership(owner);
        lastHiveRewarder = address(hiveRewarder);
        emit HiveRewarderFactory__HiveRewarderCreated(lastHiveRewarder);
        return lastHiveRewarder;
    }
}