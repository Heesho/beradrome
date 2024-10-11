// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import 'contracts/Plugin.sol';

interface IInfraredVault {
    function stakingToken() external view returns (address);
    function stake(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function getReward() external;
}

contract InfraredPlugin is Plugin {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

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
    {
        super.claimAndDistribute();
        IInfraredVault(infraredVault).getReward();
        address bribe = getBribe();
        uint256 duration = IBribe(bribe).DURATION();
        address[] memory rewardTokens = IBribe(bribe).getRewardTokens();
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            uint256 balance = IERC20(rewardTokens[i]).balanceOf(address(this));
            if (balance > duration) {
                IERC20(rewardTokens[i]).safeApprove(bribe, 0);
                IERC20(rewardTokens[i]).safeApprove(bribe, balance);
                IBribe(bribe).notifyRewardAmount(rewardTokens[i], balance);
            }
        }
    }

    function depositFor(address account, uint256 amount) 
        public 
        override 
    {
        super.depositFor(account, amount);
        IERC20(getToken()).safeApprove(infraredVault, 0);
        IERC20(getToken()).safeApprove(infraredVault, amount);
        IInfraredVault(infraredVault).stake(amount);
    }

    function withdrawTo(address account, uint256 amount) 
        public 
        override 
    {
        IInfraredVault(infraredVault).withdraw(amount); 
        super.withdrawTo(account, amount);
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

}

contract InfraredPluginFactory {

    address public constant REWARDS_VAULT_FACTORY = 0x2B6e40f65D82A0cB98795bC7587a71bfa49fBB2B;
    string public constant PROTOCOL = 'Infrared';

    address public immutable VOTER;

    address public last_plugin;

    event Plugin__PluginCreated(address plugin);

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

        InfraredPlugin lastPlugin = new InfraredPlugin(
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
        emit Plugin__PluginCreated(last_plugin);
        return last_plugin;
    }

}