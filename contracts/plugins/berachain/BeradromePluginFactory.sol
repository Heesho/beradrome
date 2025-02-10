// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import 'contracts/Plugin.sol';

contract BeradromePlugin is Plugin, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    /*----------  STATE VARIABLES  --------------------------------------*/

    /*----------  ERRORS ------------------------------------------------*/

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
        super.claimAndDistribute();
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

contract BeradromePluginFactory {

    string public constant PROTOCOL = "Beradrome";
    address public constant REWARDS_VAULT_FACTORY = 0x94Ad6Ac84f6C6FbA8b8CCbD71d9f4f101def52a8;

    address public immutable VOTER;

    address public last_plugin;

    event BeradromePluginFactory__PluginCreated(address plugin);

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
        BeradromePlugin lastPlugin = new BeradromePlugin(
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
        emit BeradromePluginFactory__PluginCreated(last_plugin);
        return last_plugin;
    }

}