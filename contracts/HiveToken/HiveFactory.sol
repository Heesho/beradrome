// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IHiveTokenFactory {
    function createHiveToken(address owner, string calldata name, string calldata symbol, string calldata uri, string calldata description) external returns (address);
}

interface IHiveRewarderFactory {
    function createHiveRewarder(address owner, address hiveToken) external returns (address);
}

interface IHiveDistroFactory {
    function createHiveDistro(address owner, address hiveToken, address hiveRewarder) external returns (address);
}

interface IHiveFeeFlowFactory {
    function createHiveFeeFlow(address hiveDistro, address rewardToken, uint256 initPrice, uint256 minInitPrice) external returns (address);
}

interface IHiveToken {
    function setFeeFlow(address hiveFeeFlow) external;
}

interface IHiveRewarder {
    function addReward(address rewardToken) external;
}

contract HiveFactory is Ownable {

    uint256 public constant MINT_FEE_MIN = 0;
    uint256 public constant MINT_FEE_MAX = 200;
    uint256 public constant REWARD_FEE_MIN = 200;
    uint256 public constant REWARD_FEE_MAX = 2000;

    address public immutable oToken;
    address public immutable vToken;
    address public immutable vTokenRewarder;
    address public voter;
    address public hiBeroVault;

    address public hiveTokenFactory;
    address public hiveRewarderFactory;
    address public hiveDistroFactory;
    address public hiveFeeFlowFactory;

    address public protocol;

    uint256 public mintFee = 100;
    uint256 public rewardFee = 1000;

    struct Hive {
        address hiveToken;
        address hiveRewarder;
        address hiveDistro;
        address hiveFeeFlow;
        address rewardToken;
    } 

    uint256 public hiveIndex = 0;
    mapping(uint256 => Hive) public index_Hive;
    mapping(address => uint256) public hiveToken_Index;

    error HiveFactory__InvalidZeroAddress();
    error HiveFactory__Unauthorized();
    error HiveFactory__InvalidInput();

    event HiveFactory__HiveCreated(string name, string symbol, address hiveToken, address hiveRewarder, address hiveDistro, address hiveFeeFlow);
    event HiveFactory__HiveTokenFactorySet(address hiveTokenFactory);
    event HiveFactory__HiveRewarderFactorySet(address hiveRewarderFactory);
    event HiveFactory__HiveDistroFactorySet(address hiveDistroFactory);
    event HiveFactory__HiveFeeFlowFactorySet(address hiveFeeFlowFactory);
    event HiveFactory__RewardAdded(address hiveRewarder, address rewardToken);
    event HiveFactory__FeeFlowSet(uint256 index, address hiveToken, address hiveFeeFlow);
    event HiveFactory__VoterSet(address voter);
    event HiveFactory__HiBeroVaultSet(address hiBeroVault);
    event HiveFactory__ProtocolSet(address protocol);
    event HiveFactory__MintFeeSet(uint256 mintFee);
    event HiveFactory__RewardFeeSet(uint256 rewardFee);

    constructor(
        address _oToken, 
        address _vToken, 
        address _vTokenRewarder,
        address _voter,
        address _hiBeroVault
    ) {
        oToken = _oToken;
        vToken = _vToken;
        vTokenRewarder = _vTokenRewarder;
        voter = _voter;
        hiBeroVault = _hiBeroVault;
        protocol = msg.sender;
    }

    function createHive(
        string calldata name, 
        string calldata symbol, 
        string calldata uri,
        string calldata description,
        address rewardToken, 
        uint256 initPrice, 
        uint256 minInitPrice
    ) external {
        address hiveToken = IHiveTokenFactory(hiveTokenFactory).createHiveToken(msg.sender, name, symbol, uri, description);
        address hiveRewarder = IHiveRewarderFactory(hiveRewarderFactory).createHiveRewarder(msg.sender, hiveToken);
        address hiveDistro = IHiveDistroFactory(hiveDistroFactory).createHiveDistro(msg.sender, hiveToken, hiveRewarder);
        address hiveFeeFlow = IHiveFeeFlowFactory(hiveFeeFlowFactory).createHiveFeeFlow(hiveDistro, rewardToken, initPrice, minInitPrice);

        index_Hive[hiveIndex] = Hive(hiveToken, hiveRewarder, hiveDistro, hiveFeeFlow, rewardToken);
        hiveToken_Index[hiveToken] = hiveIndex;
        hiveIndex++;

        IHiveToken(hiveToken).setFeeFlow(hiveFeeFlow);
        IHiveRewarder(hiveRewarder).addReward(rewardToken);

        emit HiveFactory__HiveCreated(name, symbol, hiveToken, hiveRewarder, hiveDistro, hiveFeeFlow);
    }

    function setHiveTokenFactory(address _hiveTokenFactory) external onlyOwner() {
        if (_hiveTokenFactory == address(0)) revert HiveFactory__InvalidZeroAddress();
        hiveTokenFactory = _hiveTokenFactory;
        emit HiveFactory__HiveTokenFactorySet(_hiveTokenFactory);
    }

    function setHiveRewarderFactory(address _hiveRewarderFactory) external onlyOwner() {
        if (_hiveRewarderFactory == address(0)) revert HiveFactory__InvalidZeroAddress();
        hiveRewarderFactory = _hiveRewarderFactory;
        emit HiveFactory__HiveRewarderFactorySet(_hiveRewarderFactory);
    }

    function setHiveDistroFactory(address _hiveDistroFactory) external onlyOwner() {
        if (_hiveDistroFactory == address(0)) revert HiveFactory__InvalidZeroAddress();
        hiveDistroFactory = _hiveDistroFactory;
        emit HiveFactory__HiveDistroFactorySet(_hiveDistroFactory);
    }

    function setHiveFeeFlowFactory(address _hiveFeeFlowFactory) external onlyOwner() {
        if (_hiveFeeFlowFactory == address(0)) revert HiveFactory__InvalidZeroAddress();
        hiveFeeFlowFactory = _hiveFeeFlowFactory;
        emit HiveFactory__HiveFeeFlowFactorySet(_hiveFeeFlowFactory);
    }

    function setVoter(address _voter) external onlyOwner() {
        if (_voter == address(0)) revert HiveFactory__InvalidZeroAddress();
        voter = _voter;
        emit HiveFactory__VoterSet(_voter);
    }

    function setHiBeroVault(address _hiBeroVault) external onlyOwner() {
        if (_hiBeroVault == address(0)) revert HiveFactory__InvalidZeroAddress();
        hiBeroVault = _hiBeroVault;
        emit HiveFactory__HiBeroVaultSet(_hiBeroVault);
    }

    function addReward(address hiveRewarder, address rewardToken) external onlyOwner() {
        IHiveRewarder(hiveRewarder).addReward(rewardToken);
        emit HiveFactory__RewardAdded(hiveRewarder, rewardToken);
    }

    function setHiveFeeFlow(address hiveToken, uint256 initPrice, uint256 minInitPrice) external onlyOwner() {
        uint256 index = hiveToken_Index[hiveToken];
        address hiveDistro = index_Hive[index].hiveDistro;
        address rewardToken = index_Hive[index].rewardToken;
        address hiveFeeFlow = IHiveFeeFlowFactory(hiveFeeFlowFactory).createHiveFeeFlow(hiveDistro, rewardToken, initPrice, minInitPrice);
        IHiveToken(hiveToken).setFeeFlow(hiveFeeFlow);
        index_Hive[index].hiveFeeFlow = hiveFeeFlow;
        emit HiveFactory__FeeFlowSet(index, hiveToken, hiveFeeFlow);
    }

    function setProtocol(address _protocol) external onlyOwner() {
        if (_protocol == address(0)) revert HiveFactory__InvalidZeroAddress();
        protocol = _protocol;
        emit HiveFactory__ProtocolSet(_protocol);
    }

    function setMintFee(uint256 fee) external onlyOwner() {
        if (fee < MINT_FEE_MIN || fee > MINT_FEE_MAX) revert HiveFactory__InvalidInput();
        mintFee = fee;
        emit HiveFactory__MintFeeSet(fee);
    }

    function setRewardFee(uint256 fee) external onlyOwner() {
        if (fee < REWARD_FEE_MIN || fee > REWARD_FEE_MAX) revert HiveFactory__InvalidInput();
        rewardFee = fee;
        emit HiveFactory__RewardFeeSet(fee);
    }

    function getHiveByIndex(uint256 index) external view returns (address hiveToken, address hiveRewarder, address hiveDistro, address hiveFeeFlow) {
        return (index_Hive[index].hiveToken, index_Hive[index].hiveRewarder, index_Hive[index].hiveDistro, index_Hive[index].hiveFeeFlow);
    }

    function getHiveByToken(address hiveToken) external view returns (address hiveRewarder, address hiveDistro, address hiveFeeFlow) {
        uint256 index = hiveToken_Index[hiveToken];
        return (index_Hive[index].hiveRewarder, index_Hive[index].hiveDistro, index_Hive[index].hiveFeeFlow);
    }

}