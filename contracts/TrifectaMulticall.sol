// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "contracts/interfaces/IGauge.sol";
import "contracts/interfaces/IVoter.sol";

contract TrifectaMulticall {

    /*----------  CONSTANTS  --------------------------------------------*/

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable voter;

    struct GaugeRewardCard {
        address gauge;                     
        address[] rewardTokens;            
        uint8[] rewardTokenDecimals;       
        uint256[] rewardsPerToken;          
        uint256[] accountRewardsEarned;   
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _voter
    ) {
        voter = _voter;
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function gaugeRewardData(address plugin, address account) public view returns (GaugeRewardCard memory gaugeRewardCard) {
        gaugeRewardCard.gauge = IVoter(voter).gauges(plugin);
        gaugeRewardCard.rewardTokens = IGauge(gaugeRewardCard.gauge).getRewardTokens();

        uint8[] memory _rewardTokenDecimals = new uint8[](gaugeRewardCard.rewardTokens.length);
        for (uint i = 0; i < gaugeRewardCard.rewardTokens.length; i++) {
            _rewardTokenDecimals[i] = IERC20Metadata(gaugeRewardCard.rewardTokens[i]).decimals();
        }
        gaugeRewardCard.rewardTokenDecimals = _rewardTokenDecimals;

        uint[] memory _rewardsPerToken = new uint[](gaugeRewardCard.rewardTokens.length);
        for (uint i = 0; i < gaugeRewardCard.rewardTokens.length; i++) {
            _rewardsPerToken[i] = (IGauge(gaugeRewardCard.gauge).totalSupply() == 0 ? 0 : IGauge(gaugeRewardCard.gauge).getRewardForDuration(gaugeRewardCard.rewardTokens[i]) * 1e18 / IGauge(gaugeRewardCard.gauge).totalSupply());
        }
        gaugeRewardCard.rewardsPerToken = _rewardsPerToken;

        uint[] memory _accountRewardsEarned = new uint[](gaugeRewardCard.rewardTokens.length);
        for (uint i = 0; i < gaugeRewardCard.rewardTokens.length; i++) {
            _accountRewardsEarned[i] = (account == address(0) ? 0 : IGauge(gaugeRewardCard.gauge).earned(account, gaugeRewardCard.rewardTokens[i]));
        }
        gaugeRewardCard.accountRewardsEarned = _accountRewardsEarned;

        return gaugeRewardCard;
    }

}

