// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import 'contracts/Plugin.sol';

interface IInfraredVault {
    function stakingToken() external view returns (address);
    function stake(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function getReward() external;
    function getAllRewardTokens() external view returns (address[] memory);
}

contract ArberaInfraredPlugin is Plugin, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    address public constant ARBERA_MULTISIG = 0xc2524FCe63c2983f76ecf50af657ECd493ca1c3D;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable infraredVault;
    address public immutable arberaStakingPool;
    bool public distributeToVoters = true;

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _token, 
        address _voter, 
        address[] memory _assetTokens, 
        address[] memory _bribeTokens,
        address _vaultFactory,
        address _infraredVault,
        address _arberaStakingPool,
        string memory _protocol,
        string memory _name,
        string memory _vaultName
    )
        Plugin(
            _token, 
            _voter, 
            _assetTokens, 
            _bribeTokens,
            _vaultFactory,
            _protocol,
            _name,
            _vaultName
        )
    {
        infraredVault = _infraredVault;
        arberaStakingPool = _arberaStakingPool;
    }

    modifier onlyStakingPool() {
        require(msg.sender == arberaStakingPool, "Only staking pool can call this function");
        _;
    }

    function claimAndDistribute() 
        public
        override
        nonReentrant
    {
        super.claimAndDistribute();
        IInfraredVault(infraredVault).getReward();
        address bribe = getBribe();
        address gauge = getGauge();
        uint256 duration = IBribe(bribe).DURATION();
        address rewardsTarget = distributeToVoters ? bribe : gauge;

        address[] memory rewardTokens = IInfraredVault(infraredVault).getAllRewardTokens();
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            uint256 balance = IERC20(rewardTokens[i]).balanceOf(address(this));
            if (balance > duration) {
                // Distribute all Infrared vault rewards to voters or LPs based on switch
                IERC20(rewardTokens[i]).safeApprove(rewardsTarget, 0);
                IERC20(rewardTokens[i]).safeApprove(rewardsTarget, balance);
                IGauge(rewardsTarget).notifyRewardAmount(rewardTokens[i], balance);
            }
        }
    }

    function depositFor(address account, uint256 amount) 
        public
        override
        nonReentrant
        onlyStakingPool
    {
        super.depositFor(account, amount);
        IERC20(getToken()).safeApprove(infraredVault, 0);
        IERC20(getToken()).safeApprove(infraredVault, amount);
        IInfraredVault(infraredVault).stake(amount);
    }

    function withdrawTo(address account, uint256 amount) 
        public
        override
        nonReentrant
        onlyStakingPool
    {
        IInfraredVault(infraredVault).withdraw(amount); 
        super.withdrawTo(account, amount);
    }

    function setDistributeToVoters(bool _distributeToVoters) external {
        require(msg.sender == ARBERA_MULTISIG, "Only Arbera multisig can set distributeToVoters");
        distributeToVoters = _distributeToVoters;
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

}

contract ArberaInfraredPluginFactory {

    string public constant PROTOCOL = 'Arbera Infrared';
    address public constant REWARDS_VAULT_FACTORY = 0x94Ad6Ac84f6C6FbA8b8CCbD71d9f4f101def52a8;

    address public immutable VOTER;

    mapping(address => bool) public deployers;
    address public last_plugin;

    event ArberaInfraredPluginFactory__PluginCreated(address plugin);

    constructor(address _VOTER) {
        VOTER = _VOTER;
        deployers[VOTER] = true;
    }

    function createPlugin(
        address _infraredVault,
        address _arberaStakingPool,
        address[] memory _assetTokens,
        address[] memory _bribeTokens,
        string memory _name, // ex 50WETH-50HONEY or 50WBTC-50HONEY or 50WBERA-50HONEY
        string memory _vaultName
    ) external returns (address) {
        require(deployers[msg.sender], "Only deployer can create plugin");
        ArberaInfraredPlugin lastPlugin = new ArberaInfraredPlugin(
            IInfraredVault(_infraredVault).stakingToken(),
            VOTER,
            _assetTokens,
            _bribeTokens,
            REWARDS_VAULT_FACTORY,
            _infraredVault,
            _arberaStakingPool,
            PROTOCOL,
            _name,
            _vaultName
        );
        last_plugin = address(lastPlugin);
        emit ArberaInfraredPluginFactory__PluginCreated(last_plugin);
        return last_plugin;
    }

    function setDeployer(address _deployer, bool _status) external {
        require(msg.sender == VOTER, "Only Voter can set deployer");
        deployers[_deployer] = _status;
    }
}