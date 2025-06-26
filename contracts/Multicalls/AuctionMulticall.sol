// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

interface IVoter {
    function totalWeight() external view returns (uint256);
    function weights(address plugin) external view returns (uint256);
    function gauges(address plugin) external view returns (address);
    function bribes(address plugin) external view returns (address);
    function isAlive(address gauge) external view returns (bool);
    function plugins(uint256 index) external view returns (address);
    function getPlugins() external view returns (address[] memory);
}

interface IFund {
    function getProtocol() external view returns (string memory);
    function getName() external view returns (string memory);
    function asset() external view returns (address);
    function getRewardAuction() external view returns (address);
    function getAssetAuction() external view returns (address);
    function getTreasury() external view returns (address);
    function getRewardTokens() external view returns (address[] memory);
    function getInitialized() external view returns (bool);
    function getTvl() external view returns (uint256);
}

interface IAuction {
    struct Slot0 {
        uint8 locked; 
        uint16 epochId; 
        uint192 initPrice;
        uint40 startTime;
    }
    function epochPeriod() external view returns (uint256);
    function priceMultiplier() external view returns (uint256);
    function minInitPrice() external view returns (uint256);
    function getSlot0() external view returns (Slot0 memory);
    function getPrice() external view returns (uint256);
}

interface IGauge {
    function earned(address account, address token) external view returns (uint256);
}

contract AuctionMulticall {

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable voter;
    address public immutable TOKEN;
    address public immutable OTOKEN;
    address public immutable auction;

    struct AuctionCard {
        string protocol;
        string name;

        address plugin;
        address asset;
        address gauge;
        address bribe;
        address assetAuction;
        address rewardAuction;
        address[] rewardTokens;

        bool isAlive;       
        bool isInitialized;
        uint8 assetDecimals;

        uint256 tvl;
        uint256 votingWeight;
        uint256 auctionEpochDuration;
        uint256 auctionPriceMultiplier;
        uint256 auctionMinInitPrice;
        uint256 auctionEpoch;
        uint256 auctionInitPrice;
        uint256 auctionStartTime;
        uint256 auctionPrice;
        uint256 offeredOTOKEN;
        uint256 accountBalance;
    }

    struct RewardAuction {
        address[] assets;
        uint256[] amounts;
        uint256 auctionEpochDuration;
        uint256 auctionPriceMultiplier;
        uint256 auctionMinInitPrice;
        uint256 auctionEpoch;
        uint256 auctionInitPrice;
        uint256 auctionStartTime;
        uint256 auctionPrice;
        uint256 accountBalance;
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _voter,
        address _TOKEN,
        address _OTOKEN,
        address _auction
    ) {
        voter = _voter;
        TOKEN = _TOKEN;
        OTOKEN = _OTOKEN;
        auction = _auction;
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function auctionCardData(address fund, address account) public view returns (AuctionCard memory auctionCard) {
        auctionCard.protocol = IFund(fund).getProtocol();
        auctionCard.name = IFund(fund).getName();
        auctionCard.plugin = fund;
        auctionCard.asset = IFund(fund).asset();
        auctionCard.gauge = IVoter(voter).gauges(fund);
        auctionCard.bribe = IVoter(voter).bribes(fund);
        auctionCard.assetAuction = IFund(fund).getAssetAuction();
        auctionCard.rewardAuction = IFund(fund).getRewardAuction();
        auctionCard.rewardTokens = IFund(fund).getRewardTokens();
        
        auctionCard.isAlive = IVoter(voter).isAlive(auctionCard.gauge);
        auctionCard.isInitialized = IFund(fund).getInitialized();
        auctionCard.assetDecimals = IERC20Metadata(auctionCard.asset).decimals();
        auctionCard.tvl = IFund(fund).getTvl();
        auctionCard.votingWeight = (IVoter(voter).totalWeight() == 0 ? 0 : 100 * IVoter(voter).weights(fund) * 1e18 / IVoter(voter).totalWeight());

        auctionCard.auctionEpochDuration = IAuction(auctionCard.assetAuction).epochPeriod();
        auctionCard.auctionPriceMultiplier = IAuction(auctionCard.assetAuction).priceMultiplier();
        auctionCard.auctionMinInitPrice = IAuction(auctionCard.assetAuction).minInitPrice();
        IAuction.Slot0 memory slot0 = IAuction(auctionCard.assetAuction).getSlot0();
        auctionCard.auctionEpoch = slot0.epochId;
        auctionCard.auctionInitPrice = slot0.initPrice;
        auctionCard.auctionStartTime = slot0.startTime;
        auctionCard.auctionPrice = IAuction(auctionCard.assetAuction).getPrice();
        auctionCard.offeredOTOKEN = IERC20(OTOKEN).balanceOf(auctionCard.assetAuction) 
            + IERC20(OTOKEN).balanceOf(auctionCard.plugin) 
            + IGauge(auctionCard.gauge).earned(auctionCard.plugin, OTOKEN);

        auctionCard.accountBalance = (account == address(0) ? 0 : IERC20(auctionCard.asset).balanceOf(account));

        return auctionCard;
    }

    function getAuctionCards(uint256 start, uint256 stop, address account) external view returns (AuctionCard[] memory) {
        AuctionCard[] memory auctionCards = new AuctionCard[](stop - start);
        for (uint i = start; i < stop; i++) {
            auctionCards[i] = auctionCardData(IVoter(voter).plugins(i), account);
        }
        return auctionCards;
    }

    function rewardAuctionData(address account) public view returns (RewardAuction memory rewardAuction) {
        address[] memory plugins = IVoter(voter).getPlugins();
        uint256 assetsLength = 0;
        for (uint i = 0; i < plugins.length; i++) {
            assetsLength += IFund(plugins[i]).getRewardTokens().length;
        }
        rewardAuction.assets = new address[](assetsLength);
        rewardAuction.amounts = new uint256[](assetsLength);
        uint256 index = 0;
        for (uint i = 0; i < plugins.length; i++) {
            address[] memory rewardTokens = IFund(plugins[i]).getRewardTokens();
            for (uint j = 0; j < rewardTokens.length; j++) {
                rewardAuction.assets[index] = rewardTokens[j];
                rewardAuction.amounts[index] = IERC20(rewardTokens[j]).balanceOf(auction);
                index++;
            }
        }
        rewardAuction.auctionEpochDuration = IAuction(auction).epochPeriod();
        rewardAuction.auctionPriceMultiplier = IAuction(auction).priceMultiplier();
        rewardAuction.auctionMinInitPrice = IAuction(auction).minInitPrice();
        IAuction.Slot0 memory slot0 = IAuction(auction).getSlot0();
        rewardAuction.auctionEpoch = slot0.epochId;
        rewardAuction.auctionInitPrice = slot0.initPrice;
        rewardAuction.auctionStartTime = slot0.startTime;
        rewardAuction.auctionPrice = IAuction(auction).getPrice();
        rewardAuction.accountBalance = (account == address(0) ? 0 : IERC20(TOKEN).balanceOf(account));

        return rewardAuction;
    }

}