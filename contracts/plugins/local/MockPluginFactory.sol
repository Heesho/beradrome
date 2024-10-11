// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import 'contracts/Plugin.sol';

contract ERC20Mock is ERC20 {
    constructor(string memory name, string memory symbol)
        ERC20(name, symbol)
    {}

    function mint(address _to, uint256 _amount) public {
        _mint(_to, _amount * (10**18));
    }
}

contract MockPlugin is Plugin {
    using SafeERC20 for IERC20;

    /*----------  STATE VARIABLES  --------------------------------------*/

    uint256 public constant DURATION = 604800;

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
    {
        super.claimAndDistribute();
        for (uint256 i = 0; i < getBribeTokens().length; i++) {
            ERC20Mock(getBribeTokens()[i]).mint(address(this), 10);
        }
        for (uint256 i = 0; i < getBribeTokens().length; i++) {
            address token = getBribeTokens()[i];
            uint256 balance = IERC20(token).balanceOf(address(this));
            if (balance > DURATION && token != getToken()) {
                IERC20(token).safeApprove(getBribe(), 0);
                IERC20(token).safeApprove(getBribe(), balance);
                IBribe(getBribe()).notifyRewardAmount(token, balance);
            }
        }
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/
    
}

contract MockPluginFactory {

    address public immutable VOTER;
    address public immutable VAULT_FACTORY;
    mapping(string => address) tokens;

    address public last_plugin;

    event Plugin__LPMockPluginCreated(address plugin);

    constructor(address _VOTER, address _VAULT_FACTORY) {
        VOTER = _VOTER;
        VAULT_FACTORY = _VAULT_FACTORY;
    }

    function createLPMockPlugin(string memory lpSymbol, string memory symbol0, string memory symbol1) external returns (address plugin) {

        // address token0 = tokens[symbol0] == address(0) ? createERC20Mock(symbol0) : tokens[symbol0];
        // address token1 = tokens[symbol1] == address(0) ? createERC20Mock(symbol1) : tokens[symbol1];
        // address lpToken = tokens[lpSymbol] == address(0) ? createERC20Mock(lpSymbol) : tokens[lpSymbol];

        address[] memory assetTokens = new address[](2);
        assetTokens[0] = tokens[symbol0] == address(0) ? createERC20Mock(symbol0) : tokens[symbol0];
        assetTokens[1] = tokens[symbol1] == address(0) ? createERC20Mock(symbol1) : tokens[symbol1];

        MockPlugin lastPlugin = new MockPlugin(
            tokens[lpSymbol] == address(0) ? createERC20Mock(lpSymbol) : tokens[lpSymbol],
            VOTER,
            assetTokens,
            assetTokens,
            VAULT_FACTORY,
            "LPMockPlugin",
            lpSymbol,
            "MockLpPluginVaultToken"
        );
        last_plugin = address(lastPlugin);
        emit Plugin__LPMockPluginCreated(last_plugin);
        return last_plugin;
    }

    function createLPMockFarmPlugin(string memory lpSymbol, string memory symbol0, string memory symbol1, string memory rewardSymbol) external returns (address plugin) {

        address[] memory assetTokens = new address[](2);
        assetTokens[0] = tokens[symbol0] == address(0) ? createERC20Mock(symbol0) : tokens[symbol0];
        assetTokens[1] = tokens[symbol1] == address(0) ? createERC20Mock(symbol1) : tokens[symbol1];

        address[] memory bribeTokens = new address[](1);
        bribeTokens[0] = tokens[rewardSymbol] == address(0) ? createERC20Mock(rewardSymbol) : tokens[rewardSymbol];

        MockPlugin lastPlugin = new MockPlugin(
            tokens[lpSymbol] == address(0) ? createERC20Mock(lpSymbol) : tokens[lpSymbol],
            VOTER,
            assetTokens,
            bribeTokens,
            VAULT_FACTORY,
            "LPMockFarmPlugin",
            lpSymbol,
            "MockLpFarmPluginVaultToken"
        );
        last_plugin = address(lastPlugin);
        emit Plugin__LPMockPluginCreated(last_plugin);
        return last_plugin;
    }

    function createSingleStakePlugin(string memory tokenSymbol, string memory rewardSymbol) external returns (address plugin) {

        address token = tokens[tokenSymbol] == address(0) ? createERC20Mock(tokenSymbol) : tokens[tokenSymbol];

        address[] memory assetTokens = new address[](1);
        assetTokens[0] = token;

        address[] memory bribeTokens = new address[](1);
        bribeTokens[0] = tokens[rewardSymbol] == address(0) ? createERC20Mock(rewardSymbol) : tokens[rewardSymbol];

        MockPlugin lastPlugin = new MockPlugin(
            token,
            VOTER,
            assetTokens,
            bribeTokens,
            VAULT_FACTORY,
            "SingleStakePlugin",
            tokenSymbol,
            "MockSingleStakePluginVaultToken"
        );
        last_plugin = address(lastPlugin);
        emit Plugin__LPMockPluginCreated(last_plugin);
        return last_plugin;
    }

    function createERC20Mock(string memory symbol) internal returns (address) {
        ERC20Mock token = new ERC20Mock(symbol, symbol);
        tokens[symbol] = address(token);
        return address(token);
    }


}