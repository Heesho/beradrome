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

interface IRelayFactory {
    function protocol() external view returns (address);
    function developer() external view returns (address);
    function oToken() external view returns (address);
    function vToken() external view returns (address);
    function vTokenRewarder() external view returns (address);
    function voter() external view returns (address);
    function mintFee() external view returns (uint256);
}

contract RelayToken is ERC20, ERC20Permit, ERC20Votes, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 public constant DIVISOR = 10000;

    address public constant BGT = 0xbDa130737BDd9618301681329bF2e46A016ff9Ad;
    address public constant WBERA = 0x7507c1dc16935B82698e4C63f2746A2fCf994dF8;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable relayFactory;
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

    error RelayToken__InvalidInput();
    error RelayToken__InvalidZeroInput();
    error RelayToken__InvalidZeroAddress();
    error RelayToken__NotDelegate();
    error RelayToken__InvalidVote();
    error RelayToken__NotAuthorized();

    /*----------  EVENTS ------------------------------------------------*/

    event RelayToken__Mint(address indexed minter, address indexed account, uint256 amount, uint256 fee);
    event RelayToken__Vote(address[] plugins, uint256[] weights);
    event RelayToken__ClaimBribes(address[] bribes);
    event RelayToken__TransferToFeeFlow(address token);
    event RelayToken__ClaimRewards();
    event RelayToken__SetVotes(address[] plugins, uint256[] weights);
    event RelayToken__SetDelegate(address delegate);
    event RelayToken__SetFeeFlow(address feeFlow);
    event RelayToken__SetUri(string uri);
    event RelayToken__SetDescription(string description);
    event RelayToken__SetTreasury(address treasury);

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
        if (msg.sender != owner() && msg.sender != delegate) revert RelayToken__NotDelegate();
        _;
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _relayFactory,
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

        relayFactory = _relayFactory;
        oToken = IRelayFactory(relayFactory).oToken();
        vToken = IRelayFactory(relayFactory).vToken();
        vTokenRewarder = IRelayFactory(relayFactory).vTokenRewarder();

        delegate = _owner;
        feeFlow = _owner;
        treasury = _owner;
    }

    function mint(address account, uint256 amount) 
        external
        nonReentrant
        nonZeroInput(amount)
    {
        uint256 fee = amount * IRelayFactory(relayFactory).mintFee() / DIVISOR;
        amount -= fee;
        _mint(account, amount);
        IERC20(oToken).safeTransferFrom(msg.sender, address(this), amount);

        IERC20(oToken).safeTransferFrom(msg.sender, treasury, fee / 3);
        IERC20(oToken).safeTransferFrom(msg.sender, IRelayFactory(relayFactory).protocol(), fee / 3);
        IERC20(oToken).safeTransferFrom(msg.sender, IRelayFactory(relayFactory).developer(), fee / 3);
        
        IERC20(oToken).safeApprove(vToken, 0);
        IERC20(oToken).safeApprove(vToken, amount);
        IVTOKEN(vToken).burnFor(address(this), amount);
        emit RelayToken__Mint(msg.sender, account, amount, fee);
    }

    function vote()
        external
    {
        address voter = IRelayFactory(relayFactory).voter();
        IVoter(voter).vote(plugins, weights);
        emit RelayToken__Vote(plugins, weights);
    }

    function claimRewards() 
        external
    {
        IVTOKENRewarder(vTokenRewarder).getReward(address(this));
        emit RelayToken__ClaimRewards();
    }

    function claimBribes(address[] calldata bribes) 
        external
    {
        address voter = IRelayFactory(relayFactory).voter();
        IVoter(voter).claimBribes(bribes);
        emit RelayToken__ClaimBribes(bribes);
    }
    
    function transferToFeeFlow(address[] calldata tokens) 
        external
    {
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] != BGT) {
                IERC20(tokens[i]).safeTransfer(feeFlow, IERC20(tokens[i]).balanceOf(address(this)));
                emit RelayToken__TransferToFeeFlow(tokens[i]);
            } else {
                uint256 balance = IBGT(BGT).unboostedBalanceOf(address(this));
                IBGT(BGT).redeem(address(this), balance);
                IWBERA(WBERA).deposit{value: balance}();
                IERC20(WBERA).safeTransfer(feeFlow, IERC20(WBERA).balanceOf(address(this)));
                emit RelayToken__TransferToFeeFlow(WBERA);
            }
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
        emit RelayToken__SetVotes(_plugins, _weights);
    }

    function setDelegate(address _delegate) 
        external 
        onlyDelegate() 
        nonZeroAddress(_delegate) 
    {
        delegate = _delegate;
        emit RelayToken__SetDelegate(_delegate);
    }

    function setFeeFlow(address _feeFlow) 
        external 
        nonZeroAddress(_feeFlow) 
    {
        if (msg.sender != relayFactory) revert RelayToken__NotAuthorized();
        feeFlow = _feeFlow;
        emit RelayToken__SetFeeFlow(_feeFlow);
    }

    function setUri(string calldata _uri) 
        external 
        onlyOwner() 
    {
        if (bytes(_uri).length == 0) revert RelayToken__InvalidInput();
        uri = _uri;
        emit RelayToken__SetUri(_uri);
    }

    function setDescription(string calldata _description) 
        external 
        onlyOwner() 
    {
        if (bytes(_description).length == 0) revert RelayToken__InvalidInput();
        if (bytes(_description).length > 256) revert RelayToken__InvalidInput();
        description = _description;
        emit RelayToken__SetDescription(_description);
    }

    function setTreasury(address _treasury) 
        external 
        onlyOwner() 
        nonZeroAddress(_treasury) 
    {
        treasury = _treasury;
        emit RelayToken__SetTreasury(_treasury);
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

contract RelayTokenFactory {

    address public relayFactory;
    address public lastRelayToken;

    error RelayTokenFactory__Unathorized();
    error RelayTokenFactory__InvalidZeroAddress();

    event RelayTokenFactory__RelayFactorySet(address indexed account);
    event RelayTokenFactory__RelayTokenCreated(address indexed relayToken);

    modifier onlyRelayFactory() {
        if (msg.sender != relayFactory) revert RelayTokenFactory__Unathorized();
        _;
    }

    constructor(address _relayFactory) {
        relayFactory = _relayFactory;
    }

    function setRelayFactory(address _relayFactory) external onlyRelayFactory {
        if (_relayFactory == address(0)) revert RelayTokenFactory__InvalidZeroAddress();
        relayFactory = _relayFactory;
        emit RelayTokenFactory__RelayFactorySet(_relayFactory);
    }

    function createRelayToken(address owner, string calldata name, string calldata symbol, string calldata uri, string calldata description) external onlyRelayFactory returns (address) {
        RelayToken relayToken = new RelayToken(relayFactory, owner, name, symbol, uri, description);
        relayToken.transferOwnership(owner);
        lastRelayToken = address(relayToken);
        emit RelayTokenFactory__RelayTokenCreated(lastRelayToken);
        return lastRelayToken;
    }
}