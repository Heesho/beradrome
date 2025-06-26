// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../Fund.sol";

interface IAuctionFactory {
    function createAuction(
        uint256 initPrice,
        bool receiverIsFund_,
        address paymentToken_,
        address paymentReceiver_,
        uint256 epochPeriod_,
        uint256 priceMultiplier_,
        uint256 minInitPrice_
    ) external returns (address);
}

interface IBerachainRewardVault {
    function stake(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function setOperator(address operator) external;
}

interface IBeraPawForge {
    function mint(address user, address rewardVault, address recipient) external returns (uint256);
}

contract BeraPawFund is Fund, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    address public constant LBGT = 0xBaadCC2962417C01Af99fb2B7C75706B9bd6Babe;
    address public constant FORGE = 0xFeedb9750d6ac77D2E52e0C9EB8fB79F9de5Cafe;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable berachainRewardVault;

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  EVENTS  -----------------------------------------------*/

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        string memory _protocol,
        string memory _name,
        address _voter,
        address _asset,
        address[] memory _rewardTokens,
        address _berachainRewardVault
    ) Fund(_protocol, _name, _voter, _asset, _rewardTokens) {
        berachainRewardVault = _berachainRewardVault;
        IBerachainRewardVault(berachainRewardVault).setOperator(FORGE);
    }

    function deposit(uint256 amount) 
        public
        override
        nonReentrant
    {
        super.deposit(amount);
        IERC20(asset).safeApprove(berachainRewardVault, 0);
        IERC20(asset).safeApprove(berachainRewardVault, amount);
        IBerachainRewardVault(berachainRewardVault).stake(amount);
    }

    function claim() 
        public
        override
        nonReentrant
    {
        IBeraPawForge(FORGE).mint(address(this), berachainRewardVault, address(this));
    }

    /*---------- RESTRICTED FUNCTIONS  ----------------------------------*/

    function withdraw() 
        public
        override
    {
        IBerachainRewardVault(berachainRewardVault).withdraw(tvl);
        super.withdraw();
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/
}

contract BerapawFundFactory is Ownable {

    /*----------  CONSTANTS  --------------------------------------------*/

    /*----------  STATE VARIABLES  --------------------------------------*/

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  EVENTS  -----------------------------------------------*/

    /*----------  FUNCTIONS  --------------------------------------------*/

    /*---------- RESTRICTED FUNCTIONS  ----------------------------------*/

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/
}