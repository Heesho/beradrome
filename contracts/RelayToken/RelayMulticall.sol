// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IRelayFactory {
    function getRelayByIndex(uint256 index) external view returns (address relayToken, address relayRewarder, address relayDistro, address relayFeeFlow);
    function getRelayByToken(address relayToken) external view returns (address relayRewarder, address relayDistro, address relayFeeFlow);
}

interface IRelayToken {
    function uri() external view returns (string memory);
    function description() external view returns (string memory);
    function owner() external view returns (address);
    function delegate() external view returns (address);
    function getVote() external view returns (address[] memory plugins, uint256[] memory weights);
    function getPlugins() external view returns (address[] memory plugins);
    function mint(address account, uint256 amount) external;
}

interface IRelayFeeFlow {
    function paymentToken() external view returns (address);
    function getPrice() external view returns (uint256);
}

interface IRelayRewarder {
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function getRewardForDuration(address rewardToken) external view returns (uint256);
    function earned(address account, address rewardToken) external view returns (uint256);
}

interface IVTOKENRewarder {
    function earned(address relayToken, address rewardToken) external view returns (uint256);
    function getRewardTokens() external view returns (address[] memory);
}

interface IVoter {
    function bribes(address plugin) external view returns (address bribe);
    function lastVoted(address account) external view returns (uint256);
    function vote(address[] calldata _plugins, uint256[] calldata _weights) external;
}

interface IBribe {
    function earned(address relayToken, address rewardToken) external view returns (uint256);
    function getRewardTokens() external view returns (address[] memory);
}

contract RelayMulticall {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 public constant DURATION = 7 days;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable relayFactory;
    address public immutable oToken;
    address public immutable vToken;
    address public immutable vTokenRewarder;
    address public immutable voter;

    struct Relay {
        address relayToken;
        address relayRewarder;
        address relayDistro;
        address relayFeeFlow;

        string name;
        string symbol;
        string uri;
        string description;

        address owner;
        address delegate;
        address rewardToken;

        uint256 votingPower;
        uint256 votingPercent;

        address[] plugins;
        uint256[] weights;

        uint8 rewardTokenDecimals;
        uint256 rewardPerToken;

        uint256 accountOTokenBalance;
        uint256 accountRelayTokenBalance;
        uint256 accountRelayTokenStaked;
        uint256 accountEarned;
    }

    struct Reward {
        address rewardToken;
        uint256 amount;
    }


    struct Auction {
        address relayToken;
        address relayRewarder;
        address relayDistro;
        address relayFeeFlow;

        address paymentToken;
        uint256 cost;

        Reward[][] rewards;
    }


    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(address _relayFactory, address _oToken, address _vToken, address _vTokenRewarder, address _voter) {
        relayFactory = _relayFactory;
        oToken = _oToken;
        vToken = _vToken;
        vTokenRewarder = _vTokenRewarder;
        voter = _voter;
    }

    function mint(address relayToken, uint256 amount) public {
        IERC20(oToken).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(oToken).safeApprove(relayToken, 0);
        IERC20(oToken).safeApprove(relayToken, amount);
        IRelayToken(relayToken).mint(msg.sender, amount);
        bool canVote = (block.timestamp / DURATION) * DURATION > IVoter(voter).lastVoted(msg.sender);
        bool hasVote = IRelayToken(relayToken).getPlugins().length > 0;
        if (canVote && hasVote) {
            (address[] memory plugins, uint256[] memory weights) = IRelayToken(relayToken).getVote();
            IVoter(voter).vote(plugins, weights);
        }
    }

    // deposit

    // withdraw

    // mint and deposit

    // buy auction
    // claim rewards from staking IVTOKENRewarder.getReward()
    // loop through bribes and claim rewards IBribe.getReward()
    // transfer rewards to fee flow
    // call buy
    // call notify reward amount

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getRelay(address relayToken, address account) public view returns (Relay memory relay) {
        relay.relayToken = relayToken;
        (relay.relayRewarder, relay.relayDistro, relay.relayFeeFlow) = IRelayFactory(relayFactory).getRelayByToken(relayToken);
        
        relay.name = IERC20Metadata(relayToken).name();
        relay.symbol = IERC20Metadata(relayToken).symbol();
        relay.uri = IRelayToken(relayToken).uri();
        relay.description = IRelayToken(relayToken).description();

        relay.owner = IRelayToken(relayToken).owner();
        relay.delegate = IRelayToken(relayToken).delegate();
        relay.rewardToken = IRelayFeeFlow(relay.relayFeeFlow).paymentToken();

        relay.votingPower = IERC20(vToken).balanceOf(account);
        uint256 votingSupply = IERC20(vToken).totalSupply();
        relay.votingPercent = votingSupply == 0 ? 0 : relay.votingPower * 1e18 * 100 / votingSupply;

        (relay.plugins, relay.weights) = IRelayToken(relayToken).getVote();

        relay.rewardTokenDecimals = IERC20Metadata(relay.rewardToken).decimals();
        uint256 stakedSupply = IRelayRewarder(relay.relayRewarder).totalSupply();
        relay.rewardPerToken = stakedSupply == 0 ? 0 : IRelayRewarder(relay.relayRewarder).getRewardForDuration(relay.rewardToken) * 1e18 / stakedSupply;

        if (account != address(0)) {
            relay.accountOTokenBalance = IERC20(oToken).balanceOf(account);
            relay.accountRelayTokenBalance = IERC20(relayToken).balanceOf(account);
            relay.accountRelayTokenStaked = IRelayRewarder(relay.relayRewarder).balanceOf(account);
            relay.accountEarned = IRelayRewarder(relay.relayRewarder).earned(account, relay.rewardToken);
        }
    }

    function getAuction(address relayToken) public view returns (Auction memory auction) {
        auction.relayToken = relayToken;
        (auction.relayRewarder, auction.relayDistro, auction.relayFeeFlow) = IRelayFactory(relayFactory).getRelayByToken(relayToken);
        
        auction.paymentToken = IRelayFeeFlow(auction.relayFeeFlow).paymentToken();
        auction.cost = IRelayFeeFlow(auction.relayFeeFlow).getPrice();

        address[] memory plugins = IRelayToken(relayToken).getPlugins();
        uint256 rewardsLength = plugins.length + 1;

        auction.rewards = new Reward[][](rewardsLength);

        address[] memory stakingRewardTokens = IVTOKENRewarder(vTokenRewarder).getRewardTokens();
        Reward[] memory stakingRewards = new Reward[](stakingRewardTokens.length);
        for (uint256 i = 0; i < stakingRewardTokens.length; i++) {
            stakingRewards[i].rewardToken = stakingRewardTokens[i];
            stakingRewards[i].amount = IVTOKENRewarder(vTokenRewarder).earned(relayToken, stakingRewardTokens[i]);
        }
        auction.rewards[0] = stakingRewards;

        for (uint256 i = 0; i < plugins.length; i++) {
            address plugin = plugins[i];
            address bribe = IVoter(voter).bribes(plugin);
            address[] memory bribeRewardTokens = IBribe(bribe).getRewardTokens();
            Reward[] memory bribeRewards = new Reward[](bribeRewardTokens.length);
            for (uint256 j = 0; j < bribeRewardTokens.length; j++) {
                bribeRewards[j].rewardToken = bribeRewardTokens[j];
                bribeRewards[j].amount = IBribe(bribe).earned(relayToken, bribeRewardTokens[j]);
            }
            auction.rewards[i + 1] = bribeRewards;
        }
    }

}
