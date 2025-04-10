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

contract InfraredTrifectaPlugin is Plugin, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    address public constant IBGT = 0xac03CABA51e17c86c921E1f6CBFBdC91F8BB2E6b;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public infraredVault;

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _token, 
        address _voter, 
        address[] memory _assetTokens, 
        address[] memory _bribeTokens,
        address _vaultFactory,
        address _infraredVault,
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

        uint256 ibgtBalance = IERC20(IBGT).balanceOf(address(this));
        if (ibgtBalance > duration) {
            IERC20(IBGT).safeApprove(gauge, 0);
            IERC20(IBGT).safeApprove(gauge, ibgtBalance);
            IGauge(gauge).notifyRewardAmount(IBGT, ibgtBalance);
        }

        address[] memory rewardTokens = IInfraredVault(infraredVault).getAllRewardTokens();
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            if (rewardTokens[i] != IBGT) {
                uint256 balance = IERC20(rewardTokens[i]).balanceOf(address(this));
                if (balance > duration) {
                    IERC20(rewardTokens[i]).safeApprove(bribe, 0);
                    IERC20(rewardTokens[i]).safeApprove(bribe, balance);
                    IBribe(bribe).notifyRewardAmount(rewardTokens[i], balance);
                }
            }
        }
    }

    function depositFor(address account, uint256 amount) 
        public
        override
        nonReentrant
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
    {
        IInfraredVault(infraredVault).withdraw(amount); 
        super.withdrawTo(account, amount);
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

}

contract InfraredTrifectaPluginFactory {

    string public constant PROTOCOL = 'Infrared Trifecta';
    address public constant REWARDS_VAULT_FACTORY = 0x94Ad6Ac84f6C6FbA8b8CCbD71d9f4f101def52a8;

    address public immutable VOTER;

    address public last_plugin;

    event InfraredTrifectaPluginFactory__PluginCreated(address plugin);

    constructor(address _VOTER) {
        VOTER = _VOTER;
    }

    function createPlugin(
        address _infraredVault,
        address[] memory _assetTokens,
        address[] memory _bribeTokens,
        string memory _name, // ex 50WETH-50HONEY or 50WBTC-50HONEY or 50WBERA-50HONEY
        string memory _vaultName
    ) external returns (address) {

        InfraredTrifectaPlugin lastPlugin = new InfraredTrifectaPlugin(
            IInfraredVault(_infraredVault).stakingToken(),
            VOTER,
            _assetTokens,
            _bribeTokens,
            REWARDS_VAULT_FACTORY,
            _infraredVault,
            PROTOCOL,
            _name,
            _vaultName
        );
        last_plugin = address(lastPlugin);
        emit InfraredTrifectaPluginFactory__PluginCreated(last_plugin);
        return last_plugin;
    }

}