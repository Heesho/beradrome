// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../Fund.sol";

interface IAuctionFactory {
    function createAuction(
        uint256 initPrice,
        bool receiverIsFund_,
        address paymentToken_,
        address paymentReceiver_,
        uint256 epochPeriod_,
        uint256 priceMultiplier_,
        uint256 minInitPrice_
    ) external returns (address);
}

interface IBerachainRewardVault {
    function stake(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function setOperator(address operator) external;
}

interface IBeraPawForge {
    function mint(address user, address rewardVault, address recipient) external returns (uint256);
}

contract BeraPawFund is Fund, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    address public constant FORGE = 0xFeedb9750d6ac77D2E52e0C9EB8fB79F9de5Cafe;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable berachainRewardVault;

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        string memory _protocol,
        string memory _name,
        address _voter,
        address _asset,
        address[] memory _rewardTokens,
        address _berachainRewardVault
    ) Fund(_protocol, _name, _voter, _asset, _rewardTokens) {
        berachainRewardVault = _berachainRewardVault;
        IBerachainRewardVault(berachainRewardVault).setOperator(FORGE);
    }

    function deposit(uint256 amount) 
        public
        override
        nonReentrant
    {
        super.deposit(amount);
        IERC20(asset).safeApprove(berachainRewardVault, 0);
        IERC20(asset).safeApprove(berachainRewardVault, amount);
        IBerachainRewardVault(berachainRewardVault).stake(amount);
    }

    function claim() 
        public
        override
        nonReentrant
    {
        IBeraPawForge(FORGE).mint(address(this), berachainRewardVault, address(this));
    }

    /*---------- RESTRICTED FUNCTIONS  ----------------------------------*/

    function withdraw() 
        public
        override
    {
        IBerachainRewardVault(berachainRewardVault).withdraw(tvl);
        super.withdraw();
    }

}

contract BerapawFundFactory is Ownable {

    /*----------  CONSTANTS  --------------------------------------------*/

    address public constant LBGT = 0xBaadCC2962417C01Af99fb2B7C75706B9bd6Babe;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public governance;
    address public rewardAuction;
    address public auctionFactory;

    address public lastFund;

    /*----------  ERRORS ------------------------------------------------*/

    error BerapawFundFactory__InvalidGovernance();

    /*----------  EVENTS  -----------------------------------------------*/

    event BerapawFundFactory__CreateFund(address fund);
    event BerapawFundFactory__SetGovernance(address governance);
    event BerapawFundFactory__SetRewardAuction(address rewardAuction);
    event BerapawFundFactory__SetAuctionFactory(address auctionFactory);

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _governance,
        address _rewardAuction,
        address _auctionFactory
    ) {
        if (_governance == address(0)) revert BerapawFundFactory__InvalidGovernance();
        governance = _governance;
        rewardAuction = _rewardAuction;
        auctionFactory = _auctionFactory;
    }

    function createFund(
        string memory _protocol,
        string memory _name,
        address _voter,
        address _asset,
        address _berachainRewardVault,
        uint256 _initPrice,
        uint256 _epochPeriod,
        uint256 _priceMultiplier,
        uint256 _minInitPrice
    ) external returns (address) {
        address[] memory _rewardTokens = new address[](1);
        _rewardTokens[0] = LBGT;
        address fund = address(new BeraPawFund(_protocol, _name, _voter, _asset, _rewardTokens, _berachainRewardVault));
        lastFund = fund;
        address assetAuction = IAuctionFactory(auctionFactory).createAuction(
            _initPrice,
            true,
            _asset,
            fund,
            _epochPeriod,
            _priceMultiplier,
            _minInitPrice
        );
        BeraPawFund(fund).setRewardAuction(rewardAuction);
        BeraPawFund(fund).setAssetAuction(assetAuction);
        BeraPawFund(fund).transferOwnership(governance);
        emit BerapawFundFactory__CreateFund(fund);
        return fund;
    }

    /*---------- RESTRICTED FUNCTIONS  ----------------------------------*/

    function setGovernance(address _governance) external onlyOwner {
        if (_governance == address(0)) revert BerapawFundFactory__InvalidGovernance();
        governance = _governance;
        emit BerapawFundFactory__SetGovernance(_governance);
    }

    function setRewardAuction(address _rewardAuction) external onlyOwner {
        rewardAuction = _rewardAuction;
        emit BerapawFundFactory__SetRewardAuction(_rewardAuction);
    }

    function setAuctionFactory(address _auctionFactory) external onlyOwner {
        auctionFactory = _auctionFactory;
        emit BerapawFundFactory__SetAuctionFactory(_auctionFactory);
    }

}