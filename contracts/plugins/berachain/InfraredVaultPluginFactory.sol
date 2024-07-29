// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import 'contracts/Plugin.sol';

interface IInfraredVault {
    function stakingToken() external view returns (address);
    function stake(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function getReward() external;
}

contract InfraredVaultPlugin is Plugin {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public vault;
    string public symbol;

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _underlying, 
        address _voter, 
        address[] memory _tokensInUnderlying, 
        address[] memory _bribeTokens,
        address _vault,
        string memory _protocol,
        string memory _symbol
    )
        Plugin(
            _underlying, 
            _voter, 
            _tokensInUnderlying, 
            _bribeTokens,
            _protocol
        )
    {
        vault = _vault;
        symbol = _symbol;
    }

    function claimAndDistribute() 
        public 
        override 
    {
        super.claimAndDistribute();
        IInfraredVault(vault).getReward();
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
        IERC20(getUnderlyingAddress()).safeApprove(vault, 0);
        IERC20(getUnderlyingAddress()).safeApprove(vault, amount);
        IInfraredVault(vault).stake(amount);
    }

    function withdrawTo(address account, uint256 amount) 
        public 
        override 
    {
        IInfraredVault(vault).withdraw(amount); 
        super.withdrawTo(account, amount);
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getUnderlyingName() public view override returns (string memory) {
        return symbol;
    }

    function getUnderlyingSymbol() public view override returns (string memory) {
        return symbol;
    }

}

contract InfraredVaultPluginFactory {

    string public constant PROTOCOL = 'Infrared';

    address public immutable VOTER;

    address public last_plugin;

    event Plugin__PluginCreated(address plugin);

    constructor(address _VOTER) {
        VOTER = _VOTER;
    }

    function createPlugin(
        address _vault,
        address[] memory _tokensInUnderlying,
        address[] memory _bribeTokens,
        string memory _symbol // ex 50WETH-50HONEY or 50WBTC-50HONEY or 50WBERA-50HONEY
    ) external returns (address) {

        InfraredVaultPlugin lastPlugin = new InfraredVaultPlugin(
            IInfraredVault(_vault).stakingToken(),
            VOTER,
            _tokensInUnderlying,
            _bribeTokens,
            _vault,
            PROTOCOL,
            _symbol
        );
        last_plugin = address(lastPlugin);
        emit Plugin__PluginCreated(last_plugin);
        return last_plugin;
    }

}