// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import 'contracts/Plugin.sol';

interface IBGT {
    function unboostedBalanceOf(address account) external view returns (uint256);
    function redeem(address receiver, uint256 amount) external;
}

interface IWBERA {
    function deposit() external payable;
}

contract BexPlugin is Plugin {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    address public constant BGT = 0xbDa130737BDd9618301681329bF2e46A016ff9Ad;
    address public constant WBERA = 0x7507c1dc16935B82698e4C63f2746A2fCf994dF8;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public bexVault;

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _underlying, 
        address _voter, 
        address[] memory _assetTokens, 
        address[] memory _bribeTokens,
        address _vaultFactory,
        address _bexVault,
        string memory _protocol,
        string memory _name,
        string memory _vaultName   
    )
        Plugin(
            _underlying, 
            _voter, 
            _assetTokens, 
            _bribeTokens,
            _vaultFactory,
            _protocol,
            _name,
            _vaultName
        )
    {
        bexVault = _bexVault;
    }

    function claimAndDistribute() 
        public 
        override 
    {
        super.claimAndDistribute();
        IBerachainRewardsVault(bexVault).getReward(address(this));
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
    {
        super.depositFor(account, amount);
        IERC20(getToken()).safeApprove(bexVault, 0);
        IERC20(getToken()).safeApprove(bexVault, amount);
        IBerachainRewardsVault(bexVault).stake(amount);
    }

    function withdrawTo(address account, uint256 amount) 
        public 
        override 
    {
        IBerachainRewardsVault(bexVault).withdraw(amount); 
        super.withdrawTo(account, amount);
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}

}

contract BexPluginFactory {

    string public constant PROTOCOL = "BEX";
    address public constant REWARDS_VAULT_FACTORY = 0x2B6e40f65D82A0cB98795bC7587a71bfa49fBB2B;
    address public constant WBERA = 0x7507c1dc16935B82698e4C63f2746A2fCf994dF8;

    address public immutable VOTER;

    address public last_plugin;

    event Plugin__PluginCreated(address plugin);

    constructor(address _VOTER) {
        VOTER = _VOTER;
    }

    function createPlugin(
        address _lpToken,
        address _token0,
        address _token1,
        string memory _name,
        string memory _vaultName
    ) external returns (address) {

        address[] memory assetTokens = new address[](2);
        assetTokens[0] = _token0;
        assetTokens[1] = _token1;

        address[] memory bribeTokens = new address[](1);
        bribeTokens[0] = WBERA;

        BexPlugin lastPlugin = new BexPlugin(
            _lpToken,
            VOTER,
            assetTokens,
            bribeTokens,
            REWARDS_VAULT_FACTORY,
            IBerachainRewardsVaultFactory(REWARDS_VAULT_FACTORY).getVault(_lpToken),
            PROTOCOL,
            _name,
            _vaultName
        );
        last_plugin = address(lastPlugin);
        emit Plugin__PluginCreated(last_plugin);
        return last_plugin;
    }

}