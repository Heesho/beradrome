// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IHiveFactory {
    function getHiveByIndex(uint256 index) external view returns (address hiveToken, address hiveRewarder, address hiveDistro, address hiveFeeFlow);
    function getHiveByToken(address hiveToken) external view returns (address hiveRewarder, address hiveDistro, address hiveFeeFlow);
    function hiveIndex() external view returns (uint256);
}

interface IHiveToken {
    function uri() external view returns (string memory);
    function description() external view returns (string memory);
    function owner() external view returns (address);
    function delegate() external view returns (address);
    function getVote() external view returns (address[] memory plugins, uint256[] memory weights);
    function getPlugins() external view returns (address[] memory plugins);
    function mint(address account, uint256 amount) external;
    function transferToFeeFlow(address[] calldata tokens) external;
    function vote() external;
}

interface IHiveDistro {
    function distributeRewards(address[] calldata assets) external;
}

interface IHiveFeeFlow {
    struct Slot0 {
        uint8 locked;
        uint16 epochId;
        uint192 initPrice;
        uint40 startTime;
    }
    function paymentToken() external view returns (address);
    function getPrice() external view returns (uint256);
    function getSlot0() external view returns (Slot0 memory);
    function buy(address[] calldata assets, address assetsReceiver, uint256 epochId, uint256 deadline, uint256 maxPaymentTokenAmount) external returns(uint256 paymentAmount);
}

interface IHiveRewarder {
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function getRewardForDuration(address rewardToken) external view returns (uint256);
    function earned(address account, address rewardToken) external view returns (uint256);
    function deposit(address account, uint256 amount) external;
    function withdraw(address account, uint256 amount) external;
}

interface IVTOKENRewarder {
    function earned(address account, address rewardToken) external view returns (uint256);
    function getRewardTokens() external view returns (address[] memory);
    function getReward(address account) external;
}

interface IVoter {
    function bribes(address plugin) external view returns (address bribe);
    function lastVoted(address account) external view returns (uint256);
}

interface IBribe {
    function earned(address account, address rewardToken) external view returns (uint256);
    function getRewardTokens() external view returns (address[] memory);
    function getReward(address account) external;
}

contract HiveMulticall {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 public constant DURATION = 7 days;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable hiveFactory;
    address public immutable oToken;
    address public immutable vToken;
    address public immutable vTokenRewarder;
    address public immutable voter;

    struct Hive {
        address hiveToken;
        address hiveRewarder;
        address hiveDistro;
        address hiveFeeFlow;

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
        uint256 accountHiveTokenBalance;
        uint256 accountHiveTokenStaked;
        uint256 accountEarned;
    }

    struct Reward {
        address rewardToken;
        uint256 amount;
    }

    struct Auction {
        address hiveToken;
        address hiveRewarder;
        address hiveDistro;
        address hiveFeeFlow;

        address paymentToken;
        uint256 cost;

        Reward[][] rewards;
    }


    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(address _hiveFactory, address _oToken, address _vToken, address _vTokenRewarder, address _voter) {
        hiveFactory = _hiveFactory;
        oToken = _oToken;
        vToken = _vToken;
        vTokenRewarder = _vTokenRewarder;
        voter = _voter;
    }

    function mint(address hiveToken, uint256 amount) external {
        IERC20(oToken).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(oToken).safeApprove(hiveToken, 0);
        IERC20(oToken).safeApprove(hiveToken, amount);
        IHiveToken(hiveToken).mint(msg.sender, amount);
        vote(hiveToken);
    }

    function deposit(address hiveToken, uint256 amount) external {
        (address hiveRewarder, , ) = IHiveFactory(hiveFactory).getHiveByToken(hiveToken);
        IERC20(hiveToken).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(hiveToken).safeApprove(hiveRewarder, 0);
        IERC20(hiveToken).safeApprove(hiveRewarder, amount);
        IHiveRewarder(hiveRewarder).deposit(msg.sender, amount);
        vote(hiveToken); 
    }

    function vote(address hiveToken) public {
        bool canVote = (block.timestamp / DURATION) * DURATION > IVoter(voter).lastVoted(hiveToken);
        bool hasVote = IHiveToken(hiveToken).getPlugins().length > 0;
        if (canVote && hasVote) {
            IHiveToken(hiveToken).vote();
        }
    }

    function mintAndDeposit(address hiveToken, uint256 amount) external {
        (address hiveRewarder, , ) = IHiveFactory(hiveFactory).getHiveByToken(hiveToken);
        IERC20(oToken).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(oToken).safeApprove(hiveToken, 0);
        IERC20(oToken).safeApprove(hiveToken, amount);
        IHiveToken(hiveToken).mint(address(this), amount);
        uint256 balance = IERC20(hiveToken).balanceOf(address(this));
        IERC20(hiveToken).safeApprove(hiveRewarder, 0);
        IERC20(hiveToken).safeApprove(hiveRewarder, balance);
        IHiveRewarder(hiveRewarder).deposit(msg.sender, balance);
        vote(hiveToken);
    }

    function buyAuction(address hiveToken, uint256 deadline) external {
        (, address hiveDistro, address hiveFeeFlow) = IHiveFactory(hiveFactory).getHiveByToken(hiveToken);
        address paymentToken = IHiveFeeFlow(hiveFeeFlow).paymentToken();
        uint256 price = IHiveFeeFlow(hiveFeeFlow).getPrice();
        uint16 epochId = IHiveFeeFlow(hiveFeeFlow).getSlot0().epochId;
        address[] memory assets = getAuctionAssets(hiveToken);
        
        IVTOKENRewarder(vTokenRewarder).getReward(hiveToken);
        address[] memory plugins = IHiveToken(hiveToken).getPlugins();
        for (uint256 i = 0; i < plugins.length; i++) {
            IBribe(IVoter(voter).bribes(plugins[i])).getReward(hiveToken);
        }

        IHiveToken(hiveToken).transferToFeeFlow(assets);
        IERC20(paymentToken).safeTransferFrom(msg.sender, address(this), price);
        IERC20(paymentToken).safeApprove(hiveFeeFlow, 0);
        IERC20(paymentToken).safeApprove(hiveFeeFlow, price);
        IHiveFeeFlow(hiveFeeFlow).buy(assets, msg.sender, epochId, deadline, price);
        IHiveDistro(hiveDistro).distributeRewards(assets);
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getHive(address hiveToken, address account) public view returns (Hive memory hive) {
        hive.hiveToken = hiveToken;
        (hive.hiveRewarder, hive.hiveDistro, hive.hiveFeeFlow) = IHiveFactory(hiveFactory).getHiveByToken(hiveToken);
        
        hive.name = IERC20Metadata(hiveToken).name();
        hive.symbol = IERC20Metadata(hiveToken).symbol();
        hive.uri = IHiveToken(hiveToken).uri();
        hive.description = IHiveToken(hiveToken).description();

        hive.owner = IHiveToken(hiveToken).owner();
        hive.delegate = IHiveToken(hiveToken).delegate();
        hive.rewardToken = IHiveFeeFlow(hive.hiveFeeFlow).paymentToken();

        hive.votingPower = IERC20(vToken).balanceOf(hiveToken);
        uint256 votingSupply = IERC20(vToken).totalSupply();
        hive.votingPercent = votingSupply == 0 ? 0 : hive.votingPower * 1e18 * 100 / votingSupply;

        (hive.plugins, hive.weights) = IHiveToken(hiveToken).getVote();

        hive.rewardTokenDecimals = IERC20Metadata(hive.rewardToken).decimals();
        uint256 stakedSupply = IHiveRewarder(hive.hiveRewarder).totalSupply();
        hive.rewardPerToken = stakedSupply == 0 ? 0 : IHiveRewarder(hive.hiveRewarder).getRewardForDuration(hive.rewardToken) * 1e18 / stakedSupply;

        if (account != address(0)) {
            hive.accountOTokenBalance = IERC20(oToken).balanceOf(account);
            hive.accountHiveTokenBalance = IERC20(hiveToken).balanceOf(account);
            hive.accountHiveTokenStaked = IHiveRewarder(hive.hiveRewarder).balanceOf(account);
            hive.accountEarned = IHiveRewarder(hive.hiveRewarder).earned(account, hive.rewardToken);
        }
    }

    function getHives(uint256 start, uint256 end) public view returns (Hive[] memory hives) {
        uint256 length = end - start;
        hives = new Hive[](length);
        for (uint256 i = 0; i < length; i++) {
            (address hiveToken, , , ) = IHiveFactory(hiveFactory).getHiveByIndex(start + i);
            hives[i] = getHive(hiveToken, address(0));
        }
    }

    function getAuction(address hiveToken) public view returns (Auction memory auction) {
        auction.hiveToken = hiveToken;
        (auction.hiveRewarder, auction.hiveDistro, auction.hiveFeeFlow) = IHiveFactory(hiveFactory).getHiveByToken(hiveToken);
        
        auction.paymentToken = IHiveFeeFlow(auction.hiveFeeFlow).paymentToken();
        auction.cost = IHiveFeeFlow(auction.hiveFeeFlow).getPrice();

        address[] memory plugins = IHiveToken(hiveToken).getPlugins();
        uint256 rewardsLength = plugins.length + 1;

        auction.rewards = new Reward[][](rewardsLength);

        address[] memory stakingRewardTokens = IVTOKENRewarder(vTokenRewarder).getRewardTokens();
        Reward[] memory stakingRewards = new Reward[](stakingRewardTokens.length);
        for (uint256 i = 0; i < stakingRewardTokens.length; i++) {
            stakingRewards[i].rewardToken = stakingRewardTokens[i];
            stakingRewards[i].amount = IVTOKENRewarder(vTokenRewarder).earned(hiveToken, stakingRewardTokens[i]);
        }
        auction.rewards[0] = stakingRewards;

        for (uint256 i = 0; i < plugins.length; i++) {
            address plugin = plugins[i];
            address bribe = IVoter(voter).bribes(plugin);
            address[] memory bribeRewardTokens = IBribe(bribe).getRewardTokens();
            Reward[] memory bribeRewards = new Reward[](bribeRewardTokens.length);
            for (uint256 j = 0; j < bribeRewardTokens.length; j++) {
                bribeRewards[j].rewardToken = bribeRewardTokens[j];
                bribeRewards[j].amount = IBribe(bribe).earned(hiveToken, bribeRewardTokens[j]);
            }
            auction.rewards[i + 1] = bribeRewards;
        }
    }

    function getAuctions(uint256 start, uint256 end) public view returns (Auction[] memory auctions) {
        uint256 length = end - start;
        auctions = new Auction[](length);
        for (uint256 i = 0; i < length; i++) {
            (address hiveToken, , , ) = IHiveFactory(hiveFactory).getHiveByIndex(start + i);
            auctions[i] = getAuction(hiveToken);
        }
    }

    function getAuctionAssets(address hiveToken) public view returns (address[] memory assets) {
        address[] memory stakingRewardTokens = IVTOKENRewarder(vTokenRewarder).getRewardTokens();
        address[] memory plugins = IHiveToken(hiveToken).getPlugins();

        uint256 assetCount = 0;

        assetCount += stakingRewardTokens.length;

        for (uint256 i = 0; i < plugins.length; i++) {
            address bribe = IVoter(voter).bribes(plugins[i]);
            address[] memory bribeRewardTokens = IBribe(bribe).getRewardTokens();
            assetCount += bribeRewardTokens.length;
        }

        assets = new address[](assetCount);

        uint256 index = 0;

        for (uint256 i = 0; i < stakingRewardTokens.length; i++) {
            assets[index] = stakingRewardTokens[i];
            index++;
        }

        for (uint256 i = 0; i < plugins.length; i++) {
            address bribe = IVoter(voter).bribes(plugins[i]);
            address[] memory bribeRewardTokens = IBribe(bribe).getRewardTokens();
            for (uint256 j = 0; j < bribeRewardTokens.length; j++) {
                assets[index] = bribeRewardTokens[j];
                index++;
            }
        }

    }

    function getFeeFlowPrice(address hiveToken) public view returns (uint256 price) {
        (, , address hiveFeeFlow) = IHiveFactory(hiveFactory).getHiveByToken(hiveToken);
        price = IHiveFeeFlow(hiveFeeFlow).getPrice();
    }

    function getHiveLength() public view returns (uint256) {
        return IHiveFactory(hiveFactory).hiveIndex();
    }

}
