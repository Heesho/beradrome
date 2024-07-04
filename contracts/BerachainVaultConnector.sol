// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IBerachainRewardsVault {
    function stake(uint256 amount) external;
    function getReward(address account) external returns (uint256);
}

interface IVTOKENRewarder {
    function notifyRewardAmount(address token, uint256 amount) external;
}

contract VaultToken is ERC20 {

    constructor () ERC20("BeradromeVaultToken", "BVT") {
        _mint(msg.sender, 1e18);
    }

}

contract BerachainVaultConnector is Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant DURATION = 7 days;
    address public constant BGT = 0xbDa130737BDd9618301681329bF2e46A016ff9Ad;

    address public immutable vaultToken;
    address public immutable rewarder;
    address public vault;

    error BerachainVaultConnector__VaultNotSet();

    constructor(address _rewarder) {
        rewarder = _rewarder;
        vaultToken = address(new VaultToken());
    }

    function setVault(address _vault) external onlyOwner {
        vault = _vault;
    }

    function deposit() external {
        if (vault == address(0)) revert BerachainVaultConnector__VaultNotSet();
        uint256 amount = IERC20(vaultToken).balanceOf(address(this));
        IERC20(vaultToken).safeApprove(vault, 0);
        IERC20(vaultToken).safeApprove(vault, amount);
        IBerachainRewardsVault(vault).stake(amount);
    }

    function collect() external {
        IBerachainRewardsVault(vault).getReward(address(this));
    }

    function distribute() external {
        uint256 amount = IERC20(BGT).balanceOf(address(this));
        if (amount > DURATION) {
            IERC20(BGT).safeApprove(rewarder, 0);
            IERC20(BGT).safeApprove(rewarder, amount);
            IVTOKENRewarder(rewarder).notifyRewardAmount(BGT, amount);
        }
    }

}