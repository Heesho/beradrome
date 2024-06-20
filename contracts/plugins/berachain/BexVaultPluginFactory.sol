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

interface IBerachainRewardsVaultFactory {
    function getVault(address stakingToken) external view returns (address);
}

interface IBerachainRewardsVault {
    function stake(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function getReward(address account) external;
}

contract BexVaultPlugin is Plugin {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    address public constant BGT = 0xbDa130737BDd9618301681329bF2e46A016ff9Ad;
    address public constant WBERA = 0x7507c1dc16935B82698e4C63f2746A2fCf994dF8;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public rewardsVault;
    string public symbol;

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _underlying, 
        address _voter, 
        address[] memory _tokensInUnderlying, 
        address[] memory _bribeTokens,
        address _rewardsVault,
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
        rewardsVault = _rewardsVault;
        symbol = _symbol;
    }

    function claimAndDistribute() 
        public 
        override 
    {
        super.claimAndDistribute();
        IBerachainRewardsVault(rewardsVault).getReward(address(this));
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
        IERC20(getUnderlyingAddress()).safeApprove(rewardsVault, 0);
        IERC20(getUnderlyingAddress()).safeApprove(rewardsVault, amount);
        IBerachainRewardsVault(rewardsVault).stake(amount);
    }

    function withdrawTo(address account, uint256 amount) 
        public 
        override 
    {
        IBerachainRewardsVault(rewardsVault).withdraw(amount); 
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

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}

}

contract BexVaultPluginFactory {

    address public constant REWARDS_VAULT_FACTORY = 0x2B6e40f65D82A0cB98795bC7587a71bfa49fBB2B;
    address public constant WBERA = 0x7507c1dc16935B82698e4C63f2746A2fCf994dF8;
    string public constant PROTOCOL = 'BEX';

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
        string memory _symbol // ex 50WETH-50HONEY or 50WBTC-50HONEY or 50WBERA-50HONEY
    ) external returns (address) {

        address[] memory tokensInUnderlying = new address[](2);
        tokensInUnderlying[0] = _token0;
        tokensInUnderlying[1] = _token1;

        address[] memory bribeTokens = new address[](1);
        bribeTokens[0] = WBERA;

        BexVaultPlugin lastPlugin = new BexVaultPlugin(
            _lpToken,
            VOTER,
            tokensInUnderlying,
            bribeTokens,
            IBerachainRewardsVaultFactory(REWARDS_VAULT_FACTORY).getVault(_lpToken),
            PROTOCOL,
            _symbol
        );
        last_plugin = address(lastPlugin);
        emit Plugin__PluginCreated(last_plugin);
        return last_plugin;
    }

}