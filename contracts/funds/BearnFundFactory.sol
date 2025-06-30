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

interface IYBGT {
    function wrap(address stakingToken) external returns (uint256);
}

contract BearnFund is Fund, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    address public constant YBGT = 0x7e768f47dfDD5DAe874Aac233f1Bc5817137E453;

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
        IBerachainRewardVault(berachainRewardVault).setOperator(YBGT);
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
        IYBGT(YBGT).wrap(asset);
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

contract BearnFundFactory is Ownable {

    /*----------  CONSTANTS  --------------------------------------------*/

    string public constant PROTOCOL = "Bearn";
    address public constant YBGT = 0x7e768f47dfDD5DAe874Aac233f1Bc5817137E453;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public governance;
    address public rewardAuction;
    address public auctionFactory;

    address public lastFund;

    /*----------  ERRORS ------------------------------------------------*/

    error BearnFundFactory__InvalidGovernance();

    /*----------  EVENTS  -----------------------------------------------*/

    event BearnFundFactory__CreateFund(address fund);
    event BearnFundFactory__SetGovernance(address governance);
    event BearnFundFactory__SetRewardAuction(address rewardAuction);
    event BearnFundFactory__SetAuctionFactory(address auctionFactory);

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _governance,
        address _rewardAuction,
        address _auctionFactory
    ) {
        if (_governance == address(0)) revert BearnFundFactory__InvalidGovernance();
        governance = _governance;
        rewardAuction = _rewardAuction;
        auctionFactory = _auctionFactory;
    }

    function createFund(
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
        _rewardTokens[0] = YBGT;
        address fund = address(new BearnFund(PROTOCOL, _name, _voter, _asset, _rewardTokens, _berachainRewardVault));
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
        BearnFund(fund).setRewardAuction(rewardAuction);
        BearnFund(fund).setAssetAuction(assetAuction);
        BearnFund(fund).transferOwnership(governance);
        emit BearnFundFactory__CreateFund(fund);
        return fund;
    }

    /*---------- RESTRICTED FUNCTIONS  ----------------------------------*/

    function setGovernance(address _governance) external onlyOwner {
        if (_governance == address(0)) revert BeraPawFundFactory__InvalidGovernance();
        governance = _governance;
        emit BeraPawFundFactory__SetGovernance(_governance);
    }

    function setRewardAuction(address _rewardAuction) external onlyOwner {
        rewardAuction = _rewardAuction;
        emit BeraPawFundFactory__SetRewardAuction(_rewardAuction);
    }

    function setAuctionFactory(address _auctionFactory) external onlyOwner {
        auctionFactory = _auctionFactory;
        emit BeraPawFundFactory__SetAuctionFactory(_auctionFactory);
    }

}