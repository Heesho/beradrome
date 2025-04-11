// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import 'contracts/Plugin.sol';

interface IVaultToken {
    function getReward() external;
}

contract BearnPlugin is Plugin, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    /*----------  STATE VARIABLES  --------------------------------------*/

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  EVENTS ------------------------------------------------*/

    event BearnPlugin__ClaimedAndDistributed(address indexed token, uint256 amount);

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _token,
        address _voter,
        address[] memory _assetTokens,
        address[] memory _bribeTokens,
        address _vaultFactory,
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
    {}

    function claimAndDistribute() 
        public
        override
        nonReentrant
    {
        IVaultToken(getToken()).getReward();
        address bribe = getBribe();
        uint256 duration = IBribe(bribe).DURATION();
        address[] memory rewardTokens = getBribeTokens();
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            uint256 balance = IERC20(rewardTokens[i]).balanceOf(address(this));
            if (balance > duration) {
                IERC20(rewardTokens[i]).safeApprove(bribe, 0);
                IERC20(rewardTokens[i]).safeApprove(bribe, balance);
                IBribe(bribe).notifyRewardAmount(rewardTokens[i], balance);
                emit BearnPlugin__ClaimedAndDistributed(rewardTokens[i], balance);
            }
        }
    }

    function depositFor(address account, uint256 amount) 
        public
        override
        nonReentrant
    {
        super.depositFor(account, amount);
    }

    function withdrawTo(address account, uint256 amount) 
        public
        override
        nonReentrant
    {
        super.withdrawTo(account, amount);
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

}

contract BearnPluginFactory {

    string public constant PROTOCOL = "Bearn";
    address public constant REWARDS_VAULT_FACTORY = 0x94Ad6Ac84f6C6FbA8b8CCbD71d9f4f101def52a8;

    address public immutable VOTER;

    address public last_plugin;

    event BearnPluginFactory__PluginCreated(address plugin);

    constructor(address _VOTER) {
        VOTER = _VOTER;
    }

    function createPlugin(
        address _token,
        address[] memory _assetTokens,
        address[] memory _bribeTokens,
        string memory _name,
        string memory _vaultName
    ) external returns (address) {
        BearnPlugin lastPlugin = new BearnPlugin(
            _token,
            VOTER,
            _assetTokens,
            _bribeTokens,
            REWARDS_VAULT_FACTORY,
            PROTOCOL,
            _name,
            _vaultName
        );
        last_plugin = address(lastPlugin);
        emit BearnPluginFactory__PluginCreated(last_plugin);
        return last_plugin;
    }

}