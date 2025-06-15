// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
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

contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol)
        ERC20(name, symbol)
    {}

    function mint(address _to, uint256 _amount) public {
        _mint(_to, _amount);
    }
}

contract MockFund is Fund, ReentrancyGuard {
    using SafeERC20 for IERC20;

    event MockFund__Claim(address rewardToken, uint256 amount);

    constructor(
        string memory _protocol,
        string memory _name,
        address _voter, 
        address _asset, 
        address[] memory _rewardTokens
    ) Fund(_protocol, _name, _voter, _asset, _rewardTokens) {}

    function deposit(uint256 amount) public override nonReentrant {
        super.deposit(amount);
    }

    function claim() public override nonReentrant {
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            MockERC20(rewardTokens[i]).mint(address(this), 10 ether);
            emit MockFund__Claim(rewardTokens[i], 10 ether);
        }
    }

}

contract MockFundFactory is Ownable {

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public governance;
    address public treasury;
    address public rewardAuction;
    address public auctionFactory;

    address public lastFund;

    /*----------  ERRORS  -----------------------------------------------*/

    error MockFundFactory__InvalidGovernance();

    /*----------  EVENTS  -----------------------------------------------*/

    event MockFundFactory__CreateFund(address fund);
    event MockFundFactory__SetGovernance(address governance);
    event MockFundFactory__SetTreasury(address treasury);
    event MockFundFactory__SetRewardAuction(address rewardAuction);
    event MockFundFactory__SetAuctionFactory(address auctionFactory);

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _governance,
        address _treasury,
        address _rewardAuction,
        address _auctionFactory
    ) {
        if (_governance == address(0)) revert MockFundFactory__InvalidGovernance();
        governance = _governance;
        treasury = _treasury;
        rewardAuction = _rewardAuction;
        auctionFactory = _auctionFactory;
    }
    
    function createFund(
        string memory _protocol,
        string memory _name,
        address _voter,
        address _asset,
        address[] memory _rewardTokens,
        uint256 _initPrice,
        uint256 _epochPeriod,
        uint256 _priceMultiplier,
        uint256 _minInitPrice
    ) external returns (address) {
        address fund = address(new MockFund(_protocol, _name, _voter, _asset, _rewardTokens));
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
        MockFund(fund).setTreasury(treasury);
        MockFund(fund).setRewardAuction(rewardAuction);
        MockFund(fund).setAssetAuction(assetAuction);
        MockFund(fund).transferOwnership(governance);
        emit MockFundFactory__CreateFund(fund);
        return fund;
    }

    /*---------- RESTRICTED FUNCTIONS  --------------------------------*/

    function setGovernance(address _governance) external onlyOwner {
        if (_governance == address(0)) revert MockFundFactory__InvalidGovernance();
        governance = _governance;
        emit MockFundFactory__SetGovernance(_governance);
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
        emit MockFundFactory__SetTreasury(_treasury);
    }

    function setRewardAuction(address _rewardAuction) external onlyOwner {
        rewardAuction = _rewardAuction;
        emit MockFundFactory__SetRewardAuction(_rewardAuction);
    }

    function setAuctionFactory(address _auctionFactory) external onlyOwner {
        auctionFactory = _auctionFactory;
        emit MockFundFactory__SetAuctionFactory(_auctionFactory);
    }

}