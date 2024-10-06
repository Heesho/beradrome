// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IRewardVault {
    function MAX_INCENTIVE_RATE() external view returns (uint256);
    function transferOwnership(address newOwner) external;
    function delegateStake(address account, uint256 amount) external;
    function delegateWithdraw(address account, uint256 amount) external;
    function incentives(address token) external view returns (uint256 minRate, uint256 currentRate, uint256 amountRemaining);
    function addIncetive(address token, uint256 amount, uint256 rate) external;
}

contract BerachainAutoBribes is Ownable {

    address public immutable bribeToken;
    address public immutable rewardVault;

    constructor(address _bribeToken, address _rewardVault) {
        bribeToken = _bribeToken;
        rewardVault = _rewardVault;
    }

    function distribute(uint256 rate) external {
        uint256 amount = IERC20(bribeToken).balanceOf(address(this));
        IERC20(bribeToken).approve(rewardVault, 0);
        IERC20(bribeToken).approve(rewardVault, amount);
        IRewardVault(rewardVault).addIncetive(bribeToken, amount, rate);
    }

}