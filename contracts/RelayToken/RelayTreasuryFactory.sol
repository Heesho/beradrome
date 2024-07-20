// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IRelayRewarder {
    function notifyRewardAmount(address rewardToken, uint256 amount) external;
}

contract RelayTreasury is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 public constant DURATION = 7 days;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public relayFactory;
    address public relayRewarder;

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  EVENTS ------------------------------------------------*/

    /*----------  MODIFIERS  --------------------------------------------*/

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _relayFactory,
        address _relayRewarder
    ) {
        relayFactory = _relayFactory;
        relayRewarder = _relayRewarder;
    }

    function distributeRewards(address[] rewardTokens) external nonReentrant {


    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

}

contract RelayTreasuryFactory {

    address public relayFactory;
    address public lastRelayTreasury;

    error RelayTreasuryFactory__Unathorized();
    error RelayTreasuryFactory__InvalidZeroAddress();

    event RelayTreasuryFactory__RelayFactorySet(address indexed account);
    event RelayTreasuryFactory__RelayTreasuryCreated(address indexed relayToken);

    modifier onlyRelayFactory() {
        if (msg.sender != relayFactory) revert RelayTreasuryFactory__Unathorized();
        _;
    }

    constructor(address _relayFactory) {
        relayFactory = _relayFactory;
    }

    function setRelayFactory(address _relayFactory) external onlyRelayFactory {
        if (_relayFactory == address(0)) revert RelayTreasuryFactory__InvalidZeroAddress();
        relayFactory = _relayFactory;
        emit RelayTreasuryFactory__RelayFactorySet(_relayFactory);
    }

    function createRelayTreasury(address owner, address relayRewarder) external onlyRelayFactory returns (address) {
        RelayTreasury relayTreasury = new RelayTreasury(relayFactory, relayRewarder);
        relayTreasury.transferOwnership(owner);
        lastRelayTreasury = address(relayTreasury);
        emit RelayTreasuryFactory__RelayTreasuryCreated(lastRelayTreasury);
        return lastRelayTreasury;
    }

}