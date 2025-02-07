// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import 'contracts/Plugin.sol';

interface IBGT {
    function unboostedBalanceOf(address account) external view returns (uint256);
    function redeem(address receiver, uint256 amount) external;
}

interface IWBERA {
    function deposit() external payable;
}

contract BerachainPlugin is Plugin, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    address public constant BGT = 0x656b95E550C07a9ffe548bd4085c72418Ceb1dba;
    address public constant WBERA = 0x6969696969696969696969696969696969696969;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public berachainRewardVault;

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _token, 
        address _voter, 
        address[] memory _assetTokens, 
        address[] memory _bribeTokens,
        address _vaultFactory,
        address _berachainRewardVault,
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
        berachainRewardVault = _berachainRewardVault;
    }

    function claimAndDistribute() 
        public
        override
        nonReentrant
    {
        super.claimAndDistribute();
        IBerachainRewardVault(berachainRewardVault).getReward(address(this), address(this));
        address bribe = getBribe();
        uint256 duration = IBribe(bribe).DURATION();
        uint256 balance = IBGT(BGT).unboostedBalanceOf(address(this));
        if (balance > duration) {
            IBGT(BGT).redeem(address(this), balance);
            IWBERA(WBERA).deposit{value: balance}();
            IERC20(WBERA).safeApprove(bribe, 0);
            IERC20(WBERA).safeApprove(bribe, balance);
            IBribe(bribe).notifyRewardAmount(WBERA, balance);
        }
    }

    function depositFor(address account, uint256 amount) 
        public
        override
        nonReentrant
    {
        super.depositFor(account, amount);
        IERC20(getToken()).safeApprove(berachainRewardVault, 0);
        IERC20(getToken()).safeApprove(berachainRewardVault, amount);
        IBerachainRewardVault(berachainRewardVault).stake(amount);
    }

    function withdrawTo(address account, uint256 amount) 
        public
        override
        nonReentrant
    {
        IBerachainRewardVault(berachainRewardVault).withdraw(amount); 
        super.withdrawTo(account, amount);
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

}

contract BerachainPluginFactory {

    string public constant PROTOCOL = "Berachain";
    address public constant REWARDS_VAULT_FACTORY = 0x94Ad6Ac84f6C6FbA8b8CCbD71d9f4f101def52a8;
    address public constant WBERA = 0x6969696969696969696969696969696969696969;

    address public immutable VOTER;

    address public last_plugin;

    event BerachainPluginFactory__PluginCreated(address plugin);

    constructor(address _VOTER) {
        VOTER = _VOTER;
    }

    function createPlugin(
        address _token,
        address[] memory _assetTokens,
        string memory _name,
        string memory _vaultName
    ) external returns (address) {

        address[] memory bribeTokens = new address[](1);
        bribeTokens[0] = WBERA;

        BerachainPlugin lastPlugin = new BerachainPlugin(
            _token,
            VOTER,
            _assetTokens,
            bribeTokens,
            REWARDS_VAULT_FACTORY,
            IBerachainRewardVaultFactory(REWARDS_VAULT_FACTORY).getVault(_token),
            PROTOCOL,
            _name,
            _vaultName
        );
        last_plugin = address(lastPlugin);
        emit BerachainPluginFactory__PluginCreated(last_plugin);
        return last_plugin;
    }

}