// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

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

    /*===================================================================*/
    /*===========================  SETTINGS  ============================*/

    string internal constant NAME = 'RelayToken';   // Name of RelayToken
    string internal constant SYMBOL = 'reTOKEN';    // Symbol of reTOKEN

    /*===========================  END SETTINGS  ========================*/
    /*===================================================================*/

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 public constant DIVISOR = 10000;
    uint256 public constant PRECISION = 1e18;

    /*----------  STATE VARIABLES  --------------------------------------*/

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

    uint256 public slippageTolerance = 9500;
    uint256 public baseFee = 1000;

    /*----------  ERRORS ------------------------------------------------*/

    error RelayToken__InvalidZeroInput();
    error RelayToken__InvalidZeroAddress();
    error RelayToken__NotDelegate();
    error RelayToken__InvalidVote();

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
        address _base, 
        address _token, 
        address _oToken, 
        address _vToken, 
        address _vTokenRewarder,
        address _voter,
        address _multicall
    )
        ERC20(NAME, SYMBOL) 
        ERC20Permit(NAME)
    {
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
        external
        nonZeroInput(amountBase)
    {
        uint256 fee = amountBase * baseFee / DIVISOR;
        if (fee > 0) IERC20(base).safeTransfer(treasury, fee);
        amountBase -= fee;

        IERC20(base).safeApprove(token, 0);
        IERC20(base).safeApprove(token, amountBase);
        (,,uint256 minOutput,) = IMulticall(multicall).quoteBuyIn(amountBase, slippageTolerance);
        ITOKEN(token).buy(amountBase, minOutput, block.timestamp + 1800, address(this), address(this));
    }

    function buyTokenWithMaxBase() 
        public
    {
        uint256 balance = IERC20(base).balanceOf(address(this));
        uint256 fee = balance * baseFee / DIVISOR;
        if (fee > 0) IERC20(base).safeTransfer(treasury, fee);
        balance -= fee;

        IERC20(base).safeApprove(token, 0);
        IERC20(base).safeApprove(token, balance);
        (,,uint256 minOutput,) = IMulticall(multicall).quoteBuyIn(balance, slippageTolerance);
        ITOKEN(token).buy(balance, minOutput, block.timestamp + 1800, address(this), address(this));
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
        slippageTolerance = _slippageTolerance;
    }

    function setBaseFee(uint256 _baseFee) 
        external 
        onlyOwner() 
    {
        baseFee = _baseFee;
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