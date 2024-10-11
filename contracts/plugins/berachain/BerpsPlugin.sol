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

contract BerpsPlugin is Plugin {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    address public constant BERPS_VAULT = 0xC5Cb3459723B828B3974f7E58899249C2be3B33d;
    address public constant BHONEY = 0x1306D3c36eC7E38dd2c128fBe3097C2C2449af64;
    address public constant BGT = 0xbDa130737BDd9618301681329bF2e46A016ff9Ad;
    address public constant WBERA = 0x7507c1dc16935B82698e4C63f2746A2fCf994dF8;

    /*----------  STATE VARIABLES  --------------------------------------*/

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _voter, 
        address[] memory _assetTokens,  // [HONEY]
        address[] memory _bribeTokens, // [WBERA]
        address _vaultFactory
    )
        Plugin(
            BHONEY, 
            _voter, 
            _assetTokens, 
            _bribeTokens,
            _vaultFactory,
            "BERPS",
            "bHONEY",
            "BerpsVaultToken"
        )
    {}

    function claimAndDistribute() 
        public 
        override 
    {
        super.claimAndDistribute();
        IBerachainRewardsVault(BERPS_VAULT).getReward(address(this));
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
        IERC20(BHONEY).safeApprove(BERPS_VAULT, 0);
        IERC20(BHONEY).safeApprove(BERPS_VAULT, amount);
        IBerachainRewardsVault(BERPS_VAULT).stake(amount);
    }

    function withdrawTo(address account, uint256 amount) 
        public 
        override 
    {
        IBerachainRewardsVault(BERPS_VAULT).withdraw(amount); 
        super.withdrawTo(account, amount);
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}

}