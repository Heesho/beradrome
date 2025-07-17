// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./FixedPointMathLib.sol";

interface IVoter {
    function getPlugins() external view returns (address[] memory);
}

interface IController {
    function distribute() external;
    function plugin_IsFund(address plugin) external view returns (bool);
}

interface IFund {
    function getAssetAuction() external view returns (address);
    function getRewardTokens() external view returns (address[] memory);
    function distribute(address[] memory tokens) external;
}

interface IAuction {
    function paymentToken() external view returns (address);
    function buy(
        address[] memory assets,
        address receiver,
        uint256 epochId,
        uint256 deadline,
        uint256 maxPayment
    ) external;
}

contract Router {
    using SafeERC20 for IERC20;
    using FixedPointMathLib for uint256;

    /*----------  CONSTANTS  --------------------------------------------*/

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable controller;
    address public immutable voter;
    address public immutable token;
    address public immutable oToken;
    address public immutable rewardAuction;

    /*----------  ERRORS  ---------------------------------------------*/

    /*----------  FUNCTIONS  -----------------------------------------*/

    constructor(address _controller, address _voter, address _token, address _oToken, address _rewardAuction) {
        controller = _controller;
        voter = _voter;
        token = _token;
        oToken = _oToken;
        rewardAuction = _rewardAuction;
    }

    function buyFromAssetAuction(
        address plugin,
        uint256 epochId,
        uint256 deadline,
        uint256 maxPayment
    ) external {
        IController(controller).distribute();

        address auction = IFund(plugin).getAssetAuction();
        address paymentToken = IAuction(auction).paymentToken();
        address[] memory assets = new address[](1);
        assets[0] = oToken;

        IERC20(paymentToken).safeTransferFrom(msg.sender, address(this), maxPayment);
        IERC20(paymentToken).safeApprove(auction, 0);
        IERC20(paymentToken).safeApprove(auction, maxPayment);
        IAuction(auction).buy(
            assets,
            msg.sender,
            epochId,
            deadline,
            maxPayment
        );
        IERC20(paymentToken).safeTransfer(msg.sender, IERC20(paymentToken).balanceOf(address(this)));
    }

    function buyFromRewardAuction(
        uint256 epochId,
        uint256 deadline,
        uint256 maxPayment
    ) external {
        IController(controller).distribute();

        address[] memory plugins = IVoter(voter).getPlugins();
        uint256 assetsLength = 0;
        for (uint256 i = 0; i < plugins.length; i++) {
            if (IController(controller).plugin_IsFund(plugins[i])) {
                address[] memory rewardTokens = IFund(plugins[i]).getRewardTokens();
                assetsLength += rewardTokens.length;
            }
        }
        address[] memory assets = new address[](assetsLength);
        uint256 index = 0;
        for (uint256 i = 0; i < plugins.length; i++) {
            if (IController(controller).plugin_IsFund(plugins[i])) {
                address[] memory rewardTokens = IFund(plugins[i]).getRewardTokens();
                for (uint256 j = 0; j < rewardTokens.length; j++) {
                    assets[index] = rewardTokens[j];
                    index++;
                }
            }
        }

        IERC20(token).safeTransferFrom(msg.sender, address(this), maxPayment);
        IERC20(token).safeApprove(rewardAuction, 0);
        IERC20(token).safeApprove(rewardAuction, maxPayment);
        IAuction(rewardAuction).buy(
            assets,
            msg.sender,
            epochId,
            deadline,
            maxPayment
        );
        IERC20(token).safeTransfer(msg.sender, IERC20(token).balanceOf(address(this)));
    }

}