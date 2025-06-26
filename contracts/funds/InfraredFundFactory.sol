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

interface IInfrared {
    function claimExternalVaultRewards(address _asset, address user) external;
}

contract InfraredFund is Fund, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    address public constant INFRARED = 0xb71b3DaEA39012Fb0f2B14D2a9C86da9292fC126;

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
        IBerachainRewardVault(berachainRewardVault).setOperator(INFRARED);
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
        IInfrared(INFRARED).claimExternalVaultRewards(asset, address(this));
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

contract InfraredFundFactory is Ownable {

    /*----------  CONSTANTS  --------------------------------------------*/

    address public constant IBGT = 0xac03CABA51e17c86c921E1f6CBFBdC91F8BB2E6b;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public governance;
    address public rewardAuction;
    address public auctionFactory;

    address public lastFund;

    /*----------  ERRORS ------------------------------------------------*/

    error InfraredFundFactory__InvalidGovernance();

    /*----------  EVENTS  -----------------------------------------------*/

    event InfraredFundFactory__CreateFund(address fund);
    event InfraredFundFactory__SetGovernance(address governance);
    event InfraredFundFactory__SetRewardAuction(address rewardAuction);
    event InfraredFundFactory__SetAuctionFactory(address auctionFactory);

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _governance,
        address _rewardAuction,
        address _auctionFactory
    ) {
        if (_governance == address(0)) revert InfraredFundFactory__InvalidGovernance();
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
        _rewardTokens[0] = IBGT;
        address fund = address(new InfraredFund(_protocol, _name, _voter, _asset, _rewardTokens, _berachainRewardVault));
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
        InfraredFund(fund).setRewardAuction(rewardAuction);
        InfraredFund(fund).setAssetAuction(assetAuction);
        InfraredFund(fund).transferOwnership(governance);
        emit InfraredFundFactory__CreateFund(fund);
        return fund;
    }

    /*---------- RESTRICTED FUNCTIONS  ----------------------------------*/

    function setGovernance(address _governance) external onlyOwner {
        if (_governance == address(0)) revert InfraredFundFactory__InvalidGovernance();
        governance = _governance;
        emit InfraredFundFactory__SetGovernance(_governance);
    }

    function setRewardAuction(address _rewardAuction) external onlyOwner {
        rewardAuction = _rewardAuction;
        emit InfraredFundFactory__SetRewardAuction(_rewardAuction);
    }

    function setAuctionFactory(address _auctionFactory) external onlyOwner {
        auctionFactory = _auctionFactory;
        emit InfraredFundFactory__SetAuctionFactory(_auctionFactory);
    }

}