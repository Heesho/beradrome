// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "contracts/interfaces/IVoter.sol";
import "contracts/interfaces/IPlugin.sol";

interface IBGT {
    function unboostedBalanceOf(address account) external view returns (uint256);
}

interface IBerachainRewardVault {
    function rewardPerToken() external view returns (uint256);
    function earned(address account) external view returns (uint256);
}

contract VaultMulticall {

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 public constant DIVISOR = 10000;
    uint256 public constant PRECISION = 1e18;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable voter;
    address public immutable rewardVault;
    address public immutable bgt;

    struct BondingCurve {
        uint256 rewardPerToken;
        uint256 accountBGT;
        uint256 accountEarnedBGT;
    }

    struct GaugeCard {
        address gauge;
        address vault;                                              
        uint256 rewardPerToken;            
        uint256 accountEarnedBGT;     
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _voter,
        address _rewardVault,
        address _bgt
    ) {
        voter = _voter;
        rewardVault = _rewardVault;
        bgt = _bgt;
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function bondingCurveData(address account) external view returns (BondingCurve memory bondingCurve) {
        bondingCurve.rewardPerToken = IBerachainRewardVault(rewardVault).rewardPerToken();
        bondingCurve.accountBGT = IBGT(bgt).unboostedBalanceOf(account);
        bondingCurve.accountEarnedBGT = IBerachainRewardVault(rewardVault).earned(account);

        return bondingCurve;
    }

    function gaugeCardData(address plugin, address account) public view returns (GaugeCard memory gaugeCard) {
        gaugeCard.gauge = IVoter(voter).gauges(plugin);
        gaugeCard.vault = IPlugin(plugin).getRewardVault();
        gaugeCard.rewardPerToken = IBerachainRewardVault(gaugeCard.vault).rewardPerToken();
        gaugeCard.accountEarnedBGT = IBerachainRewardVault(gaugeCard.vault).earned(account);

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

