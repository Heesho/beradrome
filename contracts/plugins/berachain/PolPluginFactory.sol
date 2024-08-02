// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "contracts/interfaces/IGauge.sol";
import "contracts/interfaces/IBribe.sol";
import "contracts/interfaces/IVoter.sol";

/**
 * @title Plugin
 * @author heesho
 * 
 * Plugins are contracts that can be used to integrate a yield-bearing asset with the Voting system.
 * The idea is that when a yield-bearing asset is added to this system, users can deposit it in a Plugin
 * to earn OTOKEN rewards. The Plugin will strip the yield from the yield-bearing asset and distribute it
 * as a voting reward to VTOKEN holders that voted for the Plugin. The Plugin contract is in charge of 
 * accepting deposits/withdrawals from accounts and updating their balances in the corresponding Gauge contract
 * so that they can receive OTOKEN rewards. The Plugin is also in charge of harvesting yield from the yield-bearing
 * asset (underlying) and distributing that yield to its corresponding Bribe contract.
 * 
 * Plugin balanceOf must be equal to Gauge balanceOf for all users at all times.
 * Plugin totalSupply must be equal to Gauge totalSupply at all times.
 */
contract PolPlugin is ReentrancyGuard {
    using SafeERC20 for IERC20Metadata;

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 constant AMOUNT = 1e18;
    uint256 constant PRECISION = 1e18;
    uint256 constant DURATION = 7 days;
    uint256 constant public ABS_MAX_INIT_PRICE = type(uint192).max;

    /*----------  STATE VARIABLES  --------------------------------------*/

    IERC20Metadata private immutable underlying; // payment token
    address private immutable OTOKEN;
    address private immutable voter;
    address private gauge;
    address private bribe;
    string private  protocol;
    string private symbol;
    address[] private tokensInUnderlying;
    address[] private bribeTokens;

    uint256 public immutable priceMultiplier;
    uint256 public immutable minInitPrice;

    struct Auction {
        uint256 epochId;
        uint256 initPrice;
        uint256 startTime;
    }

    Auction internal auction;

    /*----------  ERRORS ------------------------------------------------*/

    error Plugin__InvalidZeroInput();
    error Plugin__NotAuthorizedVoter();

    /*----------  EVENTS ------------------------------------------------*/

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
        address _underlying, 
        address _voter, 
        address[] memory _tokensInUnderlying, 
        address[] memory _bribeTokens,
        string memory _protocol,
        string memory _symbol,
        uint256 _initPrice,
        uint256 _minInitPrice,
        uint256 _priceMultiplier
    ) {
        underlying = IERC20Metadata(_underlying);
        voter = _voter;
        tokensInUnderlying = _tokensInUnderlying;
        bribeTokens = _bribeTokens;
        protocol = _protocol;
        symbol = _symbol;
        OTOKEN = IVoter(_voter).OTOKEN();

        auction.initPrice = _initPrice;
        auction.startTime = block.timestamp;

        minInitPrice = _minInitPrice;
        priceMultiplier = _priceMultiplier;
    }

    function claimAndDistribute() public virtual nonReentrant {
        emit Plugin__ClaimedAnDistributed();
    }

    function buy(address assetReceiver, uint256 epochId, uint256 deadline, uint256 maxPaymentTokenAmount) external nonReentrant returns (uint256 paymentAmount) {
        // if (block.timestamp > deadline) revert Plugin__DeadlinePassed();

        Auction memory auctionCache = auction;

        // if (epochId != auctionCache.epochId) revert Plugin__EpochIdMismatch();

        paymentAmount = getPriceFromCache(auctionCache);

        // if (paymentAmount > maxPaymentTokenAmount) revert Plugin__MaxPaymentAmountExceeded();

        if (paymentAmount > 0) {
            underlying.safeTransferFrom(msg.sender, address(this), paymentAmount);
        }

        IGauge(gauge).getReward(address(this));
        uint256 balance = IERC20Metadata(OTOKEN).balanceOf(address(this));
        IERC20Metadata(OTOKEN).safeTransfer(assetReceiver, balance);

        uint256 newInitPrice = paymentAmount * priceMultiplier / PRECISION;

        if (newInitPrice > ABS_MAX_INIT_PRICE) {
            newInitPrice = ABS_MAX_INIT_PRICE;
        } else if (newInitPrice < minInitPrice) {
            newInitPrice = minInitPrice;
        }

        auctionCache.epochId++;
        auctionCache.initPrice = newInitPrice;
        auctionCache.startTime = block.timestamp;

        auction = auctionCache;

        // emit Plugin__Buy(msg.sender, assetReceiver, paymenAmount);

        return paymentAmount;
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    function setGauge(address _gauge) external onlyVoter {
        gauge = _gauge;
        initialize();
    }

    function setBribe(address _bribe) external onlyVoter {
        bribe = _bribe;
    }

    function initialize()
        internal
    {
        emit Plugin__Deposited(address(this), AMOUNT);
        IGauge(gauge)._deposit(address(this), AMOUNT);
    }

    function getPriceFromCache(Auction memory auctionCache) internal view returns (uint256) {
        uint256 timeElapsed = block.timestamp - auctionCache.startTime;

        if (timeElapsed > DURATION) {
            return 0;
        }

        return auctionCache.initPrice - (auctionCache.initPrice * timeElapsed / DURATION);
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getPrice() external view returns (uint256) {
        return getPriceFromCache(auction);
    }

    function getAuction() external view returns (Auction memory) {
        return auction;
    }

    function balanceOf(address account) public view returns (uint256) {
        if (account == address(this)) {
            return AMOUNT;
        } else {
            return 0;
        }
    }

    function totalSupply() public pure returns (uint256) {
        return AMOUNT;
    }

    function getUnderlyingName() public view virtual returns (string memory) {
        return symbol;
    }

    function getUnderlyingSymbol() public view virtual returns (string memory) {
        return symbol;
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

contract PolPluginFactory {

    string public constant PROTOCOL = 'Protocol Owned Liquidity';

    address public immutable VOTER;

    address public last_plugin;

    event Plugin__PluginCreated(address plugin);

    constructor(address _VOTER) {
        VOTER = _VOTER;
    }

    function createPlugin(
        address _paymentToken,
        address[] memory _tokensInUnderlying,
        address[] memory _bribeTokens,
        string memory _symbol,
        uint256 _initPrice,
        uint256 _minInitPrice,
        uint256 _priceMultiplier
    ) external returns (address) {

        PolPlugin lastPlugin = new PolPlugin(
            _paymentToken,
            VOTER,
            _tokensInUnderlying,
            _bribeTokens,
            PROTOCOL,
            _symbol,
            _initPrice,
            _minInitPrice,
            _priceMultiplier
        );
        last_plugin = address(lastPlugin);
        emit Plugin__PluginCreated(last_plugin);
        return last_plugin;
    }

}