// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

interface IVoter {
    function getPlugins() external view returns (address[] memory);
    function plugins(uint256 index) external view returns (address);
    function gauges(address plugin) external view returns (address);
    function bribes(address plugin) external view returns (address);
    function isAlive(address gauge) external view returns (bool);
    function weights(address plugin) external view returns (uint256);
    function totalWeight() external view returns (uint256);
}

interface IBribe {
    function totalSupply() external view returns (uint256);
    function getRewardForDuration(address token) external view returns (uint256);
    function left(address token) external view returns (uint256);
    function getRewardTokens() external view returns (address[] memory);
    function earned(address account, address token) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

interface IPlugin {
    function getProtocol() external view returns (string memory);
    function getName() external view returns (string memory);
}

contract VoterMulticall {

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public voter;

    struct BribeCard {
        address plugin;                 
        address bribe;                  
        bool isAlive;                   

        string protocol;                
        string name;                  

        address[] rewardTokens;          
        uint8[] rewardTokenDecimals;    
        uint256[] rewardsPerToken;      
        uint256[] accountRewardsEarned;
        uint256[] rewardsLeft; 

        uint256 voteWeight;             
        uint256 votePercent;            

        uint256 accountVote;            
    }

    constructor(address _voter) {
        voter = _voter;
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function bribeCardData(address plugin, address account) public view returns (BribeCard memory bribeCard) {
        bribeCard.plugin = plugin;
        bribeCard.bribe = IVoter(voter).bribes(plugin);
        bribeCard.isAlive = IVoter(voter).isAlive(IVoter(voter).gauges(plugin));

        bribeCard.protocol = IPlugin(plugin).getProtocol();
        bribeCard.name = IPlugin(plugin).getName();
        bribeCard.rewardTokens = IBribe(IVoter(voter).bribes(plugin)).getRewardTokens();

        uint8[] memory _rewardTokenDecimals = new uint8[](bribeCard.rewardTokens.length);
        for (uint i = 0; i < bribeCard.rewardTokens.length; i++) {
            _rewardTokenDecimals[i] = IERC20Metadata(bribeCard.rewardTokens[i]).decimals();
        }
        bribeCard.rewardTokenDecimals = _rewardTokenDecimals;

        uint[] memory _rewardsPerToken = new uint[](bribeCard.rewardTokens.length);
        for (uint i = 0; i < bribeCard.rewardTokens.length; i++) {
            _rewardsPerToken[i] = (IBribe(bribeCard.bribe).totalSupply() == 0 ? 0 : IBribe(bribeCard.bribe).getRewardForDuration(bribeCard.rewardTokens[i]) * 1e18 / IBribe(bribeCard.bribe).totalSupply());
        }
        bribeCard.rewardsPerToken = _rewardsPerToken;

        uint[] memory _accountRewardsEarned = new uint[](bribeCard.rewardTokens.length);
        for (uint i = 0; i < bribeCard.rewardTokens.length; i++) {
            _accountRewardsEarned[i] = (account == address(0) ? 0 : IBribe(IVoter(voter).bribes(plugin)).earned(account, bribeCard.rewardTokens[i]));
        }
        bribeCard.accountRewardsEarned = _accountRewardsEarned;

        uint[] memory _rewardsLeft = new uint[](bribeCard.rewardTokens.length);
        for (uint i = 0; i < bribeCard.rewardTokens.length; i++) {
            _rewardsLeft[i] = IBribe(bribeCard.bribe).left(bribeCard.rewardTokens[i]);
        }
        bribeCard.rewardsLeft = _rewardsLeft;

        bribeCard.voteWeight = IVoter(voter).weights(plugin);
        bribeCard.votePercent = (IVoter(voter).totalWeight() == 0 ? 0 : 100 * IVoter(voter).weights(plugin) * 1e18 / IVoter(voter).totalWeight());

        bribeCard.accountVote = (account == address(0) ? 0 : IBribe(bribeCard.bribe).balanceOf(account));

        return bribeCard;
    }

    function getBribeCards(uint256 start, uint256 stop, address account) external view returns (BribeCard[] memory) {
        BribeCard[] memory bribeCards = new BribeCard[](stop - start);
        for (uint i = start; i < stop; i++) {
            bribeCards[i] = bribeCardData(getPlugin(i), account);
        }
        return bribeCards;
    }

    function getPlugins() external view returns (address[] memory) {
        return IVoter(voter).getPlugins();
    }

    function getPlugin(uint256 index) public view returns (address) {
        return IVoter(voter).plugins(index);
    }

}