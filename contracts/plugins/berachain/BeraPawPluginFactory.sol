// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import 'contracts/Plugin.sol';

interface ILBGT {
    function mintLbgtTo(address rewardsVault, address recipient) external returns (uint256);
}

contract BeraPawPlugin is Plugin, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    address public constant LBGT = 0x32Cf940DB5d7ea3e95e799A805B1471341241264;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable berachainRewardsVault;

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _token, 
        address _voter, 
        address[] memory _assetTokens, 
        address[] memory _bribeTokens,
        address _vaultFactory,
        address _berachainRewardsVault,
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
        berachainRewardsVault = _berachainRewardsVault;
        IBerachainRewardsVault(berachainRewardsVault).setOperator(LBGT);
    }

    function claimAndDistribute() 
        public
        override
        nonReentrant
    {
        super.claimAndDistribute();
        ILBGT(LBGT).mintLbgtTo(berachainRewardsVault, address(this));
        address bribe = getBribe();
        uint256 duration = IBribe(bribe).DURATION();
        uint256 balance = IERC20(LBGT).balanceOf(address(this));
        if (balance > duration) {
            IERC20(LBGT).safeApprove(bribe, 0);
            IERC20(LBGT).safeApprove(bribe, balance);
            IBribe(bribe).notifyRewardAmount(LBGT, balance);
        }
    }

    function depositFor(address account, uint256 amount) 
        public
        override
        nonReentrant
    {
        super.depositFor(account, amount);
        IERC20(getToken()).safeApprove(berachainRewardsVault, 0);
        IERC20(getToken()).safeApprove(berachainRewardsVault, amount);
        IBerachainRewardsVault(berachainRewardsVault).stake(amount);
    }

    function withdrawTo(address account, uint256 amount) 
        public
        override
        nonReentrant
    {
        IBerachainRewardsVault(berachainRewardsVault).withdraw(amount); 
        super.withdrawTo(account, amount);
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

}

contract BeraPawPluginFactory {

    string public constant PROTOCOL = "BeraPaw";
    address public constant REWARDS_VAULT_FACTORY = 0x2B6e40f65D82A0cB98795bC7587a71bfa49fBB2B;
    address public constant LBGT = 0x32Cf940DB5d7ea3e95e799A805B1471341241264;

    address public immutable VOTER;

    address public last_plugin;

    event Plugin__PluginCreated(address plugin);

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
        bribeTokens[0] = LBGT;

        BeraPawPlugin lastPlugin = new BeraPawPlugin(
            _token,
            VOTER,
            _assetTokens,
            bribeTokens,
            REWARDS_VAULT_FACTORY,
            IBerachainRewardsVaultFactory(REWARDS_VAULT_FACTORY).getVault(_token),
            PROTOCOL,
            _name,
            _vaultName
        );
        last_plugin = address(lastPlugin);
        emit Plugin__PluginCreated(last_plugin);
        return last_plugin;
    }

}