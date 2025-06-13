// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

interface IPlugin {
    function getToken() external view returns (address);
    function getProtocol() external view returns (string memory);
    function getName() external view returns (string memory);
    function getAssetTokens() external view returns (address[] memory);
    function balanceOf(address account) external view returns (uint256);
}

interface IVoter {
    function plugins(uint256 index) external view returns (address);
    function gauges(address plugin) external view returns (address);
    function isAlive(address gauge) external view returns (bool);
    function totalWeight() external view returns (uint256);
    function weights(address plugin) external view returns (uint256);
}

interface IGauge {
    function totalSupply() external view returns (uint256);
    function getRewardForDuration(address token) external view returns (uint256);
    function earned(address account, address token) external view returns (uint256);
}

interface ITOKEN {
    function getOTokenPrice() external view returns (uint256);
}

contract FarmMulticall {

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public voter;
    address public TOKEN;
    
    struct GaugeCard {
        address plugin;
        address token;

        address gauge;
        bool isAlive;

        string protocol;
        string name;
        address[] assetTokens;

        uint256 priceBase;
        uint256 priceOTOKEN;
        uint256 votingWeight;
        uint256 totalSupply;
        uint256 accountTokenBalance;
        uint256 accountStakedBalance;

        address[] rewardTokens;
        uint8[] rewardTokenDecimals;
        uint256[] rewardsPerToken;
        uint256[] accountRewardsEarned;
    }

    constructor(address _voter, address _TOKEN) {
        voter = _voter;
        TOKEN = _TOKEN;
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getBasePrice() public pure returns (uint256) {
        return 1e18;
    }

    function gaugeCardData(address plugin, address account) public view returns (GaugeCard memory gaugeCard) {
        gaugeCard.plugin = plugin;
        gaugeCard.token = IPlugin(plugin).getToken();

        gaugeCard.gauge = IVoter(voter).gauges(plugin);
        gaugeCard.isAlive = IVoter(voter).isAlive(gaugeCard.gauge);
        
        gaugeCard.protocol = IPlugin(plugin).getProtocol(); 
        gaugeCard.name = IPlugin(plugin).getName();
        gaugeCard.assetTokens = IPlugin(plugin).getAssetTokens();

        gaugeCard.priceBase = getBasePrice();
        gaugeCard.priceOTOKEN = ITOKEN(TOKEN).getOTokenPrice() * (gaugeCard.priceBase) / 1e18;
        gaugeCard.votingWeight = (IVoter(voter).totalWeight() == 0 ? 0 : 100 * IVoter(voter).weights(plugin) * 1e18 / IVoter(voter).totalWeight());
        gaugeCard.totalSupply = IGauge(gaugeCard.gauge).totalSupply();

        gaugeCard.accountTokenBalance = (account == address(0) ? 0 : IERC20(gaugeCard.token).balanceOf(account));
        gaugeCard.accountStakedBalance = (account == address(0) ? 0 : IPlugin(plugin).balanceOf(account));

        uint8[] memory _rewardTokenDecimals = new uint8[](gaugeCard.rewardTokens.length);
        for (uint i = 0; i < gaugeCard.rewardTokens.length; i++) {
            _rewardTokenDecimals[i] = IERC20Metadata(gaugeCard.rewardTokens[i]).decimals();
        }
        gaugeCard.rewardTokenDecimals = _rewardTokenDecimals;

        uint[] memory _rewardsPerToken = new uint[](gaugeCard.rewardTokens.length);
        for (uint i = 0; i < gaugeCard.rewardTokens.length; i++) {
            _rewardsPerToken[i] = (IGauge(gaugeCard.gauge).totalSupply() == 0 ? 0 : IGauge(gaugeCard.gauge).getRewardForDuration(gaugeCard.rewardTokens[i])
                                * 1e18 / IGauge(gaugeCard.gauge).totalSupply());
        }
        gaugeCard.rewardsPerToken = _rewardsPerToken;

        uint[] memory _accountRewardsEarned = new uint[](gaugeCard.rewardTokens.length);
        for (uint i = 0; i < gaugeCard.rewardTokens.length; i++) {
            _accountRewardsEarned[i] = (account == address(0) ? 0 : IGauge(gaugeCard.gauge).earned(account, gaugeCard.rewardTokens[i]));
        }
        gaugeCard.accountRewardsEarned = _accountRewardsEarned;

        return gaugeCard;
    }

    function getGaugeCards(uint256 start, uint256 stop, address account) external view returns (GaugeCard[] memory) {
        GaugeCard[] memory gaugeCards = new GaugeCard[](stop - start);
        for (uint i = start; i < stop; i++) {
            gaugeCards[i] = gaugeCardData(IVoter(voter).plugins(i), account);
        }
        return gaugeCards;
    }

}