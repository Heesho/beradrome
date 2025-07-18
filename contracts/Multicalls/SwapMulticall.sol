// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "../FixedPointMathLib.sol";

interface ITOKEN {
    function SWAP_FEE() external view returns (uint256);
    function frBASE() external view returns (uint256);
    function mrvBASE() external view returns (uint256);
    function mrrBASE() external view returns (uint256);
    function mrrTOKEN() external view returns (uint256);
    function getMarketPrice() external view returns (uint256);
    function getOTokenPrice() external view returns (uint256);
    function getFloorPrice() external view returns (uint256);
    function getTotalValueLocked() external view returns (uint256);
    function getAccountCredit(address account) external view returns (uint256);
    function debts(address account) external view returns (uint256);
    function getMaxSell() external view returns (uint256);
}

interface IVTOKEN {
    function totalSupplyTOKEN() external view returns (uint256);
    function balanceOfTOKEN(address account) external view returns (uint256);
}

interface IVTOKENRewarder {
    function earned(address account, address token) external view returns (uint256);
    function getRewardForDuration(address token) external view returns (uint256);
}

interface IMinter {
    function weekly() external view returns (uint256);
}

interface IVoter {
    function gauges(address plugin) external view returns (address);
    function getPlugins() external view returns (address[] memory);
    function minter() external view returns (address);
    function usedWeights(address account) external view returns (uint256);
    function lastVoted(address account) external view returns (uint256);
}

interface IController {
    function plugin_IsFund(address plugin) external view returns (bool);
}

interface IGauge {
    function getRewardForDuration(address token) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

contract SwapMulticall {
    using FixedPointMathLib for uint256;

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 public constant DIVISOR = 10000;
    uint256 public constant PRECISION = 1e18;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable voter;
    address public immutable BASE;
    address public immutable TOKEN;
    address public immutable OTOKEN;
    address public immutable VTOKEN;
    address public immutable rewarder;
    address public immutable controller;

    uint256 public immutable FEE;

    struct Portfolio {
        uint256 total;
        uint256 stakingRewards;
        uint256 farmingRewards;
    }

    struct SwapCard {
        uint256 frBASE;
        uint256 mrvBASE;
        uint256 mrrBASE;
        uint256 mrrTOKEN;
        uint256 marketMaxTOKEN;
    }

    struct BondingCurve {
        uint256 priceBASE;
        uint256 priceTOKEN;
        uint256 priceOTOKEN;
        uint256 maxMarketSell;

        uint256 tvl;
        uint256 supplyTOKEN;
        uint256 supplyVTOKEN;
        uint256 apr;
        uint256 ltv;
        uint256 marketCap;
        uint256 weekly;

        uint256 accountBASE;
        uint256 accountTOKEN;
        uint256 accountOTOKEN;

        uint256 accountEarnedBASE;
        uint256 accountEarnedTOKEN;
        uint256 accountEarnedOTOKEN;

        uint256 accountVTOKEN;
        uint256 accountVotingPower;
        uint256 accountUsedWeights;

        uint256 accountBorrowCredit;
        uint256 accountBorrowDebt;
        uint256 accountMaxWithdraw;

        uint256 accountLastVoted;
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(address _voter, address _BASE, address _TOKEN, address _OTOKEN, address _VTOKEN, address _rewarder, address _controller) {
        voter = _voter;
        BASE = _BASE;
        TOKEN = _TOKEN;
        OTOKEN = _OTOKEN;
        VTOKEN = _VTOKEN;
        rewarder = _rewarder;
        controller = _controller;

        FEE = ITOKEN(TOKEN).SWAP_FEE();
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getBasePrice() public pure returns (uint256) {
        return 1e18;
    }

    function swapCardData() external view returns (SwapCard memory swapCard) {
        swapCard.frBASE = ITOKEN(TOKEN).frBASE();
        swapCard.mrvBASE = ITOKEN(TOKEN).mrvBASE();
        swapCard.mrrBASE = ITOKEN(TOKEN).mrrBASE();
        swapCard.mrrTOKEN = ITOKEN(TOKEN).mrrTOKEN();
        swapCard.marketMaxTOKEN = ITOKEN(TOKEN).mrvBASE();

        return swapCard;
    }

    function bondingCurveData(address account) external view returns (BondingCurve memory bondingCurve) {
        bondingCurve.priceBASE = getBasePrice();
        bondingCurve.priceTOKEN = ITOKEN(TOKEN).getMarketPrice() * bondingCurve.priceBASE / 1e18;
        bondingCurve.priceOTOKEN = ITOKEN(TOKEN).getOTokenPrice() * bondingCurve.priceBASE / 1e18;
        bondingCurve.maxMarketSell = ITOKEN(TOKEN).getMaxSell();

        bondingCurve.tvl = ITOKEN(TOKEN).getTotalValueLocked() * bondingCurve.priceBASE / 1e18;
        bondingCurve.supplyTOKEN = IERC20(TOKEN).totalSupply();
        bondingCurve.supplyVTOKEN = IVTOKEN(VTOKEN).totalSupplyTOKEN();
        bondingCurve.apr = bondingCurve.supplyVTOKEN == 0 ? 0 : (((IVTOKENRewarder(rewarder).getRewardForDuration(BASE) * bondingCurve.priceBASE / 1e18) + (IVTOKENRewarder(rewarder).getRewardForDuration(TOKEN) * bondingCurve.priceTOKEN / 1e18) + 
                           (IVTOKENRewarder(rewarder).getRewardForDuration(OTOKEN) * bondingCurve.priceOTOKEN / 1e18)) * 365 * 100 * 1e18 / (7 * IERC20(VTOKEN).totalSupply() * bondingCurve.priceTOKEN / 1e18));
        bondingCurve.ltv = 100 * ITOKEN(TOKEN).getFloorPrice() * 1e18 / ITOKEN(TOKEN).getMarketPrice();
        bondingCurve.marketCap = bondingCurve.supplyTOKEN * bondingCurve.priceTOKEN / 1e18;
        bondingCurve.weekly = IMinter(IVoter(voter).minter()).weekly();

        bondingCurve.accountBASE = (account == address(0) ? 0 : IERC20(BASE).balanceOf(account));
        bondingCurve.accountTOKEN = (account == address(0) ? 0 : IERC20(TOKEN).balanceOf(account));
        bondingCurve.accountOTOKEN = (account == address(0) ? 0 : IERC20(OTOKEN).balanceOf(account));

        bondingCurve.accountEarnedBASE = (account == address(0) ? 0 : IVTOKENRewarder(rewarder).earned(account, BASE));
        bondingCurve.accountEarnedTOKEN = (account == address(0) ? 0 : IVTOKENRewarder(rewarder).earned(account, TOKEN));
        bondingCurve.accountEarnedOTOKEN = (account == address(0) ? 0 : IVTOKENRewarder(rewarder).earned(account, OTOKEN));

        bondingCurve.accountVTOKEN = (account == address(0) ? 0 : IVTOKEN(VTOKEN).balanceOfTOKEN(account));
        bondingCurve.accountVotingPower = (account == address(0) ? 0 : IERC20(VTOKEN).balanceOf(account));
        bondingCurve.accountUsedWeights = (account == address(0) ? 0 : IVoter(voter).usedWeights(account));

        bondingCurve.accountBorrowCredit = (account == address(0) ? 0 : ITOKEN(TOKEN).getAccountCredit(account));
        bondingCurve.accountBorrowDebt = (account == address(0) ? 0 : ITOKEN(TOKEN).debts(account));
        bondingCurve.accountMaxWithdraw = (account == address(0) ? 0 : (IVoter(voter).usedWeights(account) > 0 ? 0 : bondingCurve.accountVTOKEN - bondingCurve.accountBorrowDebt));

        bondingCurve.accountLastVoted = (account == address(0) ? 0 : IVoter(voter).lastVoted(account));

        return bondingCurve;
    }

    function portfolioData(address account) external view returns (Portfolio memory portfolio) {
        uint256 priceBASE = getBasePrice();

        portfolio.total = (account == address(0) ? 0 : priceBASE * (((IERC20(TOKEN).balanceOf(account) 
            + IVTOKEN(VTOKEN).balanceOfTOKEN(account)) * ITOKEN(TOKEN).getMarketPrice() / 1e18)
            + (IERC20(OTOKEN).balanceOf(account) * ITOKEN(TOKEN).getOTokenPrice() / 1e18)
            - ITOKEN(TOKEN).debts(account)) / 1e18);

        portfolio.stakingRewards = (account == address(0) ? 0 : priceBASE * (IVTOKENRewarder(rewarder).getRewardForDuration(BASE)
            + (IVTOKENRewarder(rewarder).getRewardForDuration(TOKEN) * ITOKEN(TOKEN).getMarketPrice() / 1e18)
            + (IVTOKENRewarder(rewarder).getRewardForDuration(OTOKEN) * ITOKEN(TOKEN).getOTokenPrice() / 1e18)) / 1e18
            * IERC20(VTOKEN).balanceOf(account) / IERC20(VTOKEN).totalSupply());

        address[] memory plugins = IVoter(voter).getPlugins();
        uint256 rewardsOTOKEN = 0;
        for (uint i = 0; i < plugins.length; i++) {
            if (!IController(controller).plugin_IsFund(plugins[i])) {
                address gauge = IVoter(voter).gauges(plugins[i]);
                if (IGauge(gauge).balanceOf(account) > 0) {
                    rewardsOTOKEN += (IGauge(gauge).getRewardForDuration(OTOKEN) * IGauge(gauge).balanceOf(account) / IGauge(gauge).totalSupply());
                }
            }
        }

        portfolio.farmingRewards = rewardsOTOKEN * ITOKEN(TOKEN).getOTokenPrice() * priceBASE / 1e36;
        
        return portfolio;
    }

    function quoteBuyIn(uint256 input, uint256 slippageTolerance) external view returns (uint256 output, uint256 slippage, uint256 minOutput, uint256 autoMinOutput) {
        uint256 feeBASE = input * FEE / DIVISOR;
        uint256 oldMrBASE = ITOKEN(TOKEN).mrvBASE() + ITOKEN(TOKEN).mrrBASE();
        uint256 newMrBASE = oldMrBASE + input - feeBASE;
        uint256 oldMrTOKEN = ITOKEN(TOKEN).mrrTOKEN();
        output = oldMrTOKEN - (oldMrBASE * oldMrTOKEN / newMrBASE);
        slippage = 100 * (1e18 - (output * ITOKEN(TOKEN).getMarketPrice() / input));
        minOutput = (input * 1e18 / ITOKEN(TOKEN).getMarketPrice()) * slippageTolerance / DIVISOR;
        autoMinOutput = (input * 1e18 / ITOKEN(TOKEN).getMarketPrice()) * ((DIVISOR * 1e18) - ((slippage + 1e18) * 100)) / (DIVISOR * 1e18);
    }

    function quoteBuyOut(uint256 input, uint256 slippageTolerance) external view returns (uint256 output, uint256 slippage, uint256 minOutput, uint256 autoMinOutput) {
        uint256 oldMrBASE = ITOKEN(TOKEN).mrvBASE() + ITOKEN(TOKEN).mrrBASE();
        output = DIVISOR * ((oldMrBASE * ITOKEN(TOKEN).mrrTOKEN() / (ITOKEN(TOKEN).mrrTOKEN() - input)) - oldMrBASE) / (DIVISOR - FEE);
        slippage = 100 * (1e18 - (input * ITOKEN(TOKEN).getMarketPrice() / output));
        minOutput = input * slippageTolerance / DIVISOR;
        autoMinOutput = input * ((DIVISOR * 1e18) - ((slippage + 1e18) * 100)) / (DIVISOR * 1e18);
    }

    function quoteSellIn(uint256 input, uint256 slippageTolerance) external view returns (uint256 output, uint256 slippage, uint256 minOutput, uint256 autoMinOutput) {
        uint256 feeTOKEN = input * FEE / DIVISOR;
        uint256 oldMrTOKEN = ITOKEN(TOKEN).mrrTOKEN();
        uint256 newMrTOKEN = oldMrTOKEN + input - feeTOKEN;
        if (newMrTOKEN > ITOKEN(TOKEN).mrvBASE()) {
            return (0, 0, 0, 0);
        }

        uint256 oldMrBASE = ITOKEN(TOKEN).mrvBASE() + ITOKEN(TOKEN).mrrBASE();
        output = oldMrBASE - (oldMrBASE * oldMrTOKEN / newMrTOKEN);
        slippage = 100 * (1e18 - (output * 1e18 / (input * ITOKEN(TOKEN).getMarketPrice() / 1e18)));
        minOutput = input * ITOKEN(TOKEN).getMarketPrice() /1e18 * slippageTolerance / DIVISOR;
        autoMinOutput = input * ITOKEN(TOKEN).getMarketPrice() /1e18 * ((DIVISOR * 1e18) - ((slippage + 1e18) * 100)) / (DIVISOR * 1e18);
    }

    function quoteSellOut(uint256 input, uint256 slippageTolerance) external view returns (uint256 output, uint256 slippage, uint256 minOutput, uint256 autoMinOutput) {
        uint256 oldMrBASE = ITOKEN(TOKEN).mrvBASE() + ITOKEN(TOKEN).mrrBASE();
        output = DIVISOR * ((oldMrBASE * ITOKEN(TOKEN).mrrTOKEN() / (oldMrBASE - input)) - ITOKEN(TOKEN).mrrTOKEN()) / (DIVISOR - FEE);
        if (output.mulDivDown(DIVISOR - FEE, DIVISOR) + ITOKEN(TOKEN).mrrTOKEN() > ITOKEN(TOKEN).mrvBASE()) {
            return (0, 0, 0, 0);
        }
        slippage = 100 * (1e18 - (input * 1e18 / (output * ITOKEN(TOKEN).getMarketPrice() / 1e18)));
        minOutput = input * slippageTolerance / DIVISOR;
        autoMinOutput = input * ((DIVISOR * 1e18) - ((slippage + 1e18) * 100)) / (DIVISOR * 1e18);
    }

}