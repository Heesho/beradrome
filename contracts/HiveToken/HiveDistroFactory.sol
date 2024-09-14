// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IHiveFactory {
    function protocol() external view returns (address);
    function developer() external view returns (address);
    function rewardFee() external view returns (uint256);
}

interface IHiveToken {
    function treasury() external view returns (address);
}

interface IHiveRewarder {
    function notifyRewardAmount(address rewardToken, uint256 amount) external;
}

contract HiveDistro is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 public constant DURATION = 7 days;
    uint256 public constant DIVISOR = 10000;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable hiveFactory;
    address public immutable hiveToken;
    address public immutable hiveRewarder;

    /*----------  EVENTS  ----------------------------------------------*/

    event HiveDistro__RewardDistributed(address indexed rewardToken, uint256 amount);

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _hiveFactory,
        address _hiveToken,
        address _hiveRewarder
    ) {
        hiveFactory = _hiveFactory;
        hiveToken = _hiveToken;
        hiveRewarder = _hiveRewarder;
    } 

    function distributeRewards(address[] calldata rewardTokens) external nonReentrant {
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            uint256 balance = IERC20(rewardTokens[i]).balanceOf(address(this));
            if (balance > DURATION) {
                uint256 fee = balance * IHiveFactory(hiveFactory).rewardFee() / DIVISOR;
                balance -= fee;
                
                IERC20(rewardTokens[i]).safeTransfer(IHiveToken(hiveToken).treasury(), fee / 3);
                IERC20(rewardTokens[i]).safeTransfer(IHiveFactory(hiveFactory).protocol(), fee  /3);
                IERC20(rewardTokens[i]).safeTransfer(IHiveFactory(hiveFactory).developer(), fee / 3);

                IERC20(rewardTokens[i]).safeApprove(hiveRewarder, 0);
                IERC20(rewardTokens[i]).safeApprove(hiveRewarder, balance);
                IHiveRewarder(hiveRewarder).notifyRewardAmount(rewardTokens[i], balance);
                emit HiveDistro__RewardDistributed(rewardTokens[i], balance);
            }
        }
    }

}

contract HiveDistroFactory {

    address public hiveFactory;
    address public lastHiveDistro;

    error HiveDistroFactory__Unathorized();
    error HiveDistroFactory__InvalidZeroAddress();

    event HiveDistroFactory__HiveFactorySet(address indexed account);
    event HiveDistroFactory__HiveDistroCreated(address indexed hiveToken);

    modifier onlyHiveFactory() {
        if (msg.sender != hiveFactory) revert HiveDistroFactory__Unathorized();
        _;
    }

    constructor(address _hiveFactory) {
        hiveFactory = _hiveFactory;
    }

    function setHiveFactory(address _hiveFactory) external onlyHiveFactory {
        if (_hiveFactory == address(0)) revert HiveDistroFactory__InvalidZeroAddress();
        hiveFactory = _hiveFactory;
        emit HiveDistroFactory__HiveFactorySet(_hiveFactory);
    }

    function createHiveDistro(address owner, address hiveToken, address hiveRewarder) external onlyHiveFactory returns (address) {
        HiveDistro hiveDistro = new HiveDistro(hiveFactory, hiveToken, hiveRewarder);
        hiveDistro.transferOwnership(owner);
        lastHiveDistro = address(hiveDistro);
        emit HiveDistroFactory__HiveDistroCreated(lastHiveDistro);
        return lastHiveDistro;
    }

}