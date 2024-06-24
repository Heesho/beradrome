// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "contracts/interfaces/IGauge.sol";
import "contracts/interfaces/IBribe.sol";
import "contracts/interfaces/IVoter.sol";

interface IWBERA {
    function deposit() external payable;
}

contract BentoPlugin is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    address public constant WBERA = 0x7507c1dc16935B82698e4C63f2746A2fCf994dF8;
    uint256 public constant AMOUNT = 1e16;
    uint256 public constant X_MAX = 256;
    uint256 public constant Y_MAX = 256;

    /*----------  STATE VARIABLES  --------------------------------------*/

    IERC20Metadata private immutable underlying;
    address private immutable OTOKEN;
    address private immutable voter;
    address private gauge;
    address private bribe;
    string private  protocol;
    address[] private tokensInUnderlying;
    address[] private bribeTokens;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    string public symbol;
    address public treasury;

    struct Tile {
        uint256 color;
        address account;
    }

    string[] public colors;
    uint256 public totalPlaced;
    mapping(address => uint256) public account_Placed;
    Tile[X_MAX][Y_MAX] public tiles;

    /*----------  ERRORS ------------------------------------------------*/

    error Plugin__InvalidColor();
    error Plugin__InvalidInput();
    error Plugin__InvalidZeroInput();
    error Plugin__NotAuthorizedVoter();

    /*----------  EVENTS ------------------------------------------------*/

    event Plugin__Placed(address indexed account, address indexed prevAccount, uint256 x, uint256 y, uint256 color);
    event Plugin__Deposited(address indexed account, uint256 amount);
    event Plugin__Withdrawn(address indexed account, uint256 amount);
    event Plugin__ClaimedAnDistributed();

    /*----------  MODIFIERS  --------------------------------------------*/

    modifier nonZeroInput(uint256 _amount) {
        if (_amount == 0) revert Plugin__InvalidZeroInput();
        _;
    }

    modifier onlyVoter() {
        if (msg.sender != voter) revert Plugin__NotAuthorizedVoter();
        _;
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _underlying,                    // WBERA
        address _voter, 
        address[] memory _tokensInUnderlying,   // [WBERA]
        address[] memory _bribeTokens,          // [WBERA]
        string memory _protocol                 // "BentoBera"
    ) {
        underlying = IERC20Metadata(_underlying);
        voter = _voter;
        tokensInUnderlying = _tokensInUnderlying;
        bribeTokens = _bribeTokens;
        protocol = _protocol;
        OTOKEN = IVoter(_voter).OTOKEN();
    }

    function claimAndDistribute() 
        public 
    {
        uint256 duration = IBribe(bribe).DURATION();
        uint256 balance = address(this).balance;
        if (balance > duration) {
            IWBERA(WBERA).deposit{value: balance}();
            IERC20(WBERA).safeApprove(bribe, 0);
            IERC20(WBERA).safeApprove(bribe, balance);
            IBribe(bribe).notifyRewardAmount(WBERA, balance);
        }
    }

    function placeFor(address account, uint256[] calldata x, uint256[] calldata y, uint256 color) 
        public
        payable
    {
        if (color >= colors.length) revert Plugin__InvalidColor();
        if (x.length == 0) revert Plugin__InvalidInput();
        if (x.length != y.length) revert Plugin__InvalidInput();
        for (uint256 i = 0; i < x.length; i++) {
            if (x[i] > X_MAX || y[i] > Y_MAX) revert Plugin__InvalidInput();
            address prevAccount = tiles[x[i]][y[i]].account;
            tiles[x[i]][y[i]].color = color;
            tiles[x[i]][y[i]].account = account;
            if (prevAccount != address(0)) {
                IGauge(gauge)._withdraw(prevAccount, AMOUNT);
            }
            emit Plugin__Placed(account, prevAccount, x[i], y[i], color);
        }
        uint256 amount = AMOUNT * x.length;
        totalPlaced += amount;
        account_Placed[account] += amount;
        IGauge(gauge)._deposit(account, amount);
    }

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    function setGauge(address _gauge) external onlyVoter {
        gauge = _gauge;
    }

    function setBribe(address _bribe) external onlyVoter {
        bribe = _bribe;
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function getUnderlyingName() public view virtual returns (string memory) {
        return underlying.name();
    }

    function getUnderlyingSymbol() public view virtual returns (string memory) {
        return underlying.symbol();
    }

    function getUnderlyingAddress() public view virtual returns (address) {
        return address(underlying);
    }

    function getUnderlyingDecimals() public view virtual returns (uint8) {
        return underlying.decimals();
    }

    function getProtocol() public view virtual returns (string memory) {
        return protocol;
    }

    function getVoter() public view returns (address) {
        return voter;
    }

    function getGauge() public view returns (address) {
        return gauge;
    }

    function getBribe() public view returns (address) {
        return bribe;
    }

    function getTokensInUnderlying() public view virtual returns (address[] memory) {
        return tokensInUnderlying;
    }

    function getBribeTokens() public view returns (address[] memory) {
        return bribeTokens;
    }

}