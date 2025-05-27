// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IGauge {
    function _deposit(address account, uint256 amount) external;
    function getReward(address account) external;
}

interface IVoter {
    function OTOKEN() external view returns (address);
}

abstract contract Fund is Ownable {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 constant public GAUGE_DEPOSIT_AMOUNT = 1e18;

    /*----------  STATE VARIABLES  --------------------------------------*/

    string public name;
    address public immutable voter;
    address public immutable otoken;
    address public immutable asset;
    address internal gauge;
    address internal bribe;
    address internal assetAuction;
    address internal rewardAuction;
    address internal treasury;
    address[] internal rewardTokens;
    uint256 internal tvl;
    bool internal initialized;

    /*----------  ERRORS ------------------------------------------------*/

    error Fund__Initialized();
    error Fund__NotAuthorizedVoter();
    error Fund__InvalidZeroAddress();
    error Fund__TreasuryNotSet();
    error Fund__AssetAuctionNotSet();
    error Fund__RewardAuctionNotSet();
    error Fund__CannotDistributeAsset();

    /*----------  EVENTS ------------------------------------------------*/

    event Fund__Deposit(uint256 amount);
    event Fund__DistributeAssetAuction(address indexed assetAuction, address indexed rewardToken, uint256 amount);
    event Fund__DistributeRewardAuction(address indexed rewardAuction, address indexed rewardToken, uint256 amount);
    event Fund__Withdraw(uint256 amount);
    event Fund__SetName(string name);
    event Fund__SetTreasury(address indexed treasury);
    event Fund__SetAssetAuction(address indexed assetAuction);
    event Fund__SetRewardAuction(address indexed rewardAuction);
    event Fund__SetRewardTokens(address[] rewardTokens);
    event Fund__SetGauge(address indexed gauge);
    event Fund__SetBribe(address indexed bribe);

    /*----------  MODIFIERS  --------------------------------------------*/

    modifier onlyVoter() {
        if (msg.sender != voter) revert Fund__NotAuthorizedVoter();
        _;
    }

    modifier nonZeroAddress(address _address) {
        if (_address == address(0)) revert Fund__InvalidZeroAddress();
        _;
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        string memory _name,
        address _voter, 
        address _asset,
        address[] memory _rewardTokens
    ) {
        name = _name;
        voter = _voter;
        asset = _asset;
        rewardTokens = _rewardTokens;

        otoken = IVoter(voter).OTOKEN();
    }

    function initialize() external {
        if (initialized) revert Fund__Initialized();
        initialized = true;
        IGauge(gauge)._deposit(address(this), GAUGE_DEPOSIT_AMOUNT);
    }

    function deposit(uint256 amount) public virtual {
        tvl += amount;
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        emit Fund__Deposit(amount);
    }

    function claim() public virtual {}

    function distribute(address[] memory tokens) public virtual {
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == asset) revert Fund__CannotDistributeAsset();
            if (tokens[i] == otoken) {
                if (assetAuction == address(0)) revert Fund__AssetAuctionNotSet();
                IGauge(gauge).getReward(address(this));
                uint256 balance = IERC20(tokens[i]).balanceOf(address(this));
                IERC20(tokens[i]).safeTransfer(assetAuction, balance);
                emit Fund__DistributeAssetAuction(assetAuction, tokens[i], balance);
            } else {
                if (rewardAuction == address(0)) revert Fund__RewardAuctionNotSet();
                uint256 balance = IERC20(tokens[i]).balanceOf(address(this));
                IERC20(tokens[i]).safeTransfer(rewardAuction, balance);
                emit Fund__DistributeRewardAuction(rewardAuction, tokens[i], balance);
            }
        }
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    function withdraw() public virtual onlyOwner {
        if (treasury == address(0)) revert Fund__TreasuryNotSet();
        uint256 balance = IERC20(asset).balanceOf(address(this));
        if (balance > 0) {
            tvl = 0;
            IERC20(asset).safeTransfer(treasury, balance);
            emit Fund__Withdraw(balance);
        }
    }

    function setName(string memory _name) external onlyOwner {
        name = _name;
        emit Fund__SetName(_name);
    }

    function setTreasury(address _treasury) external onlyOwner nonZeroAddress(_treasury) {
        treasury = _treasury;
        emit Fund__SetTreasury(_treasury);
    }

    function setAssetAuction(address _assetAuction) external onlyOwner nonZeroAddress(_assetAuction) {
        assetAuction = _assetAuction;
        emit Fund__SetAssetAuction(_assetAuction);
    }

    function setRewardAuction(address _rewardAuction) external onlyOwner nonZeroAddress(_rewardAuction) {
        rewardAuction = _rewardAuction;
        emit Fund__SetRewardAuction(_rewardAuction);
    }

    function setRewardTokens(address[] memory _rewardTokens) external onlyOwner {
        rewardTokens = _rewardTokens;
        emit Fund__SetRewardTokens(_rewardTokens);
    }

    function setGauge(address _gauge) external onlyVoter nonZeroAddress(_gauge) {
        gauge = _gauge;
        emit Fund__SetGauge(_gauge);
    }

    function setBribe(address _bribe) external onlyVoter nonZeroAddress(_bribe) {
        bribe = _bribe;
        emit Fund__SetBribe(_bribe);
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getGauge() public view returns (address) {
        return gauge;
    }

    function getBribe() public view returns (address) {
        return bribe;
    }

    function getAssetAuction() public view returns (address) {
        return assetAuction;
    }

    function getRewardAuction() public view returns (address) {
        return rewardAuction;
    }

    function getTreasury() public view returns (address) {
        return treasury;
    }

    function getTvl() public view returns (uint256) {
        return tvl;
    }

    function getInitialized() public view returns (bool) {
        return initialized;
    }

    function getRewardTokens() public view returns (address[] memory) {
        return rewardTokens;
    }

}