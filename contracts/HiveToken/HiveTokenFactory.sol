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
    function burnFor(address account, uint256 amount) external;
}

interface IBGT {
    function unboostedBalanceOf(address account) external view returns (uint256);
    function redeem(address receiver, uint256 amount) external;
}

interface IWBERA {
    function deposit() external payable;
}

interface IHiveFactory {
    function protocol() external view returns (address);
    function oToken() external view returns (address);
    function vToken() external view returns (address);
    function vTokenRewarder() external view returns (address);
    function voter() external view returns (address);
    function mintFee() external view returns (uint256);
}

contract HiveToken is ERC20, ERC20Permit, ERC20Votes, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 public constant DIVISOR = 10000;

    address public constant BGT = 0xbDa130737BDd9618301681329bF2e46A016ff9Ad;
    address public constant WBERA = 0x7507c1dc16935B82698e4C63f2746A2fCf994dF8;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable hiveFactory;
    address public immutable oToken;
    address public immutable vToken;
    address public immutable vTokenRewarder;

    address public delegate;
    address public feeFlow;
    address public treasury;

    address[] public plugins;
    uint256[] public weights;

    string public uri;
    string public description;

    /*----------  ERRORS ------------------------------------------------*/

    error HiveToken__InvalidInput();
    error HiveToken__InvalidZeroInput();
    error HiveToken__InvalidZeroAddress();
    error HiveToken__NotDelegate();
    error HiveToken__InvalidVote();
    error HiveToken__NotAuthorized();

    /*----------  EVENTS ------------------------------------------------*/

    event HiveToken__Mint(address indexed minter, address indexed account, uint256 amount, uint256 fee);
    event HiveToken__Vote(address[] plugins, uint256[] weights);
    event HiveToken__ClaimBribes(address[] bribes);
    event HiveToken__TransferToFeeFlow(address token);
    event HiveToken__ClaimRewards();
    event HiveToken__SetVotes(address[] plugins, uint256[] weights);
    event HiveToken__SetDelegate(address delegate);
    event HiveToken__SetFeeFlow(address feeFlow);
    event HiveToken__SetUri(string uri);
    event HiveToken__SetDescription(string description);
    event HiveToken__SetTreasury(address treasury);

    /*----------  MODIFIERS  --------------------------------------------*/

    modifier nonZeroInput(uint256 _amount) {
        if (_amount == 0) revert HiveToken__InvalidZeroInput();
        _;
    }

    modifier nonZeroAddress(address _account) {
        if (_account == address(0)) revert HiveToken__InvalidZeroAddress();
        _;
    }

    modifier onlyDelegate() {
        if (msg.sender != owner() && msg.sender != delegate) revert HiveToken__NotDelegate();
        _;
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _hiveFactory,
        address _owner,
        string memory _name,
        string memory _symbol,
        string memory _uri,
        string memory _description
    )
        ERC20(_name, _symbol)
        ERC20Permit(_name)
    {
        uri = _uri;
        description = _description;

        hiveFactory = _hiveFactory;
        oToken = IHiveFactory(hiveFactory).oToken();
        vToken = IHiveFactory(hiveFactory).vToken();
        vTokenRewarder = IHiveFactory(hiveFactory).vTokenRewarder();

        delegate = _owner;
        feeFlow = _owner;
        treasury = _owner;
    }

    function mint(address account, uint256 amount) 
        external
        nonReentrant
        nonZeroInput(amount)
    {
        uint256 fee = amount * IHiveFactory(hiveFactory).mintFee() / DIVISOR;
        amount -= fee;
        _mint(account, amount);
        IERC20(oToken).safeTransferFrom(msg.sender, address(this), amount);

        IERC20(oToken).safeTransferFrom(msg.sender, treasury, fee * 10 / 100);
        IERC20(oToken).safeTransferFrom(msg.sender, IHiveFactory(hiveFactory).protocol(), fee * 90 / 100);
        
        IERC20(oToken).safeApprove(vToken, 0);
        IERC20(oToken).safeApprove(vToken, amount);
        IVTOKEN(vToken).burnFor(address(this), amount);
        emit HiveToken__Mint(msg.sender, account, amount, fee);
    }

    function vote()
        external
    {
        address voter = IHiveFactory(hiveFactory).voter();
        IVoter(voter).vote(plugins, weights);
        emit HiveToken__Vote(plugins, weights);
    }

    function claimRewards() 
        external
    {
        IVTOKENRewarder(vTokenRewarder).getReward(address(this));
        emit HiveToken__ClaimRewards();
    }

    function claimBribes(address[] calldata bribes) 
        external
    {
        address voter = IHiveFactory(hiveFactory).voter();
        IVoter(voter).claimBribes(bribes);
        emit HiveToken__ClaimBribes(bribes);
    }
    
    function transferToFeeFlow(address[] calldata tokens) 
        external
    {
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] != BGT) {
                IERC20(tokens[i]).safeTransfer(feeFlow, IERC20(tokens[i]).balanceOf(address(this)));
                emit HiveToken__TransferToFeeFlow(tokens[i]);
            } else {
                uint256 balance = IBGT(BGT).unboostedBalanceOf(address(this));
                IBGT(BGT).redeem(address(this), balance);
                IWBERA(WBERA).deposit{value: balance}();
                IERC20(WBERA).safeTransfer(feeFlow, IERC20(WBERA).balanceOf(address(this)));
                emit HiveToken__TransferToFeeFlow(WBERA);
            }
        }
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    function setVotes(address[] calldata _plugins, uint256[] calldata _weights) 
        external 
        onlyDelegate() 
    {
        if (_plugins.length != _weights.length) revert HiveToken__InvalidVote();
        plugins = _plugins;
        weights = _weights;
        emit HiveToken__SetVotes(_plugins, _weights);
    }

    function setDelegate(address _delegate) 
        external 
        onlyDelegate() 
        nonZeroAddress(_delegate) 
    {
        delegate = _delegate;
        emit HiveToken__SetDelegate(_delegate);
    }

    function setFeeFlow(address _feeFlow) 
        external 
        nonZeroAddress(_feeFlow) 
    {
        if (msg.sender != hiveFactory) revert HiveToken__NotAuthorized();
        feeFlow = _feeFlow;
        emit HiveToken__SetFeeFlow(_feeFlow);
    }

    function setUri(string calldata _uri) 
        external 
        onlyOwner() 
    {
        if (bytes(_uri).length == 0) revert HiveToken__InvalidInput();
        uri = _uri;
        emit HiveToken__SetUri(_uri);
    }

    function setDescription(string calldata _description) 
        external 
        onlyOwner() 
    {
        if (bytes(_description).length == 0) revert HiveToken__InvalidInput();
        if (bytes(_description).length > 256) revert HiveToken__InvalidInput();
        description = _description;
        emit HiveToken__SetDescription(_description);
    }

    function setTreasury(address _treasury) 
        external 
        onlyOwner() 
        nonZeroAddress(_treasury) 
    {
        treasury = _treasury;
        emit HiveToken__SetTreasury(_treasury);
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

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getVote() 
        external 
        view 
        returns (address[] memory, uint256[] memory) 
    {
        return (plugins, weights);
    }

    function getPlugins() 
        external 
        view 
        returns (address[] memory) 
    {
        return plugins;
    }

    function getWeights() 
        external 
        view 
        returns (uint256[] memory) 
    {
        return weights;
    }

}

contract HiveTokenFactory {

    address public hiveFactory;
    address public lastHiveToken;

    error HiveTokenFactory__Unathorized();
    error HiveTokenFactory__InvalidZeroAddress();

    event HiveTokenFactory__HiveFactorySet(address indexed account);
    event HiveTokenFactory__HiveTokenCreated(address indexed hiveToken);

    modifier onlyHiveFactory() {
        if (msg.sender != hiveFactory) revert HiveTokenFactory__Unathorized();
        _;
    }

    constructor(address _hiveFactory) {
        hiveFactory = _hiveFactory;
    }

    function createHiveToken(address owner, string calldata name, string calldata symbol, string calldata uri, string calldata description) external onlyHiveFactory returns (address) {
        HiveToken hiveToken = new HiveToken(hiveFactory, owner, name, symbol, uri, description);
        hiveToken.transferOwnership(owner);
        lastHiveToken = address(hiveToken);
        emit HiveTokenFactory__HiveTokenCreated(lastHiveToken);
        return lastHiveToken;
    }
}