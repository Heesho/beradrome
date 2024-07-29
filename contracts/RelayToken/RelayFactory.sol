// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IRelayTokenFactory {
    function createRelayToken(address owner, string calldata name, string calldata symbol, string calldata uri, string calldata description) external returns (address);
}

interface IRelayRewarderFactory {
    function createRelayRewarder(address owner, address relayToken) external returns (address);
}

interface IRelayDistroFactory {
    function createRelayDistro(address owner, address relayToken, address relayRewarder) external returns (address);
}

interface IRelayFeeFlowFactory {
    function createRelayFeeFlow(address relayDistro, address rewardToken, uint256 initPrice, uint256 minInitPrice) external returns (address);
}

interface IRelayToken {
    function setFeeFlow(address relayFeeFlow) external;
}

interface IRelayRewarder {
    function addReward(address rewardToken) external;
}

contract RelayFactory is Ownable {

    uint256 public constant MINT_FEE_MIN = 0;
    uint256 public constant MINT_FEE_MAX = 200;
    uint256 public constant REWARD_FEE_MIN = 200;
    uint256 public constant REWARD_FEE_MAX = 2000;

    address public immutable oToken;
    address public immutable vToken;
    address public immutable vTokenRewarder;
    address public voter;

    address public relayTokenFactory;
    address public relayRewarderFactory;
    address public relayDistroFactory;
    address public relayFeeFlowFactory;

    address public protocol;
    address public developer;

    uint256 public mintFee = 100;
    uint256 public rewardFee = 1000;

    struct Relay {
        address relayToken;
        address relayRewarder;
        address relayDistro;
        address relayFeeFlow;
        address rewardToken;
    } 

    uint256 public relayIndex = 0;
    mapping(uint256 => Relay) public index_Relay;
    mapping(address => uint256) public relayToken_Index;

    error RelayFactory__InvalidZeroAddress();
    error RelayFactory__Unauthorized();
    error RelayFactory__InvalidInput();

    event RelayFactory__RelayCreated(string name, string symbol, address relayToken, address relayRewarder, address relayDistro, address relayFeeFlow);
    event RelayFactory__RelayTokenFactorySet(address relayTokenFactory);
    event RelayFactory__RelayRewarderFactorySet(address relayRewarderFactory);
    event RelayFactory__RelayDistroFactorySet(address relayDistroFactory);
    event RelayFactory__RelayFeeFlowFactorySet(address relayFeeFlowFactory);
    event RelayFactory__RewardAdded(address relayRewarder, address rewardToken);
    event RelayFactory__FeeFlowSet(uint256 index, address relayToken, address relayFeeFlow);
    event RelayFactory__VoterSet(address voter);
    event RelayFactory__ProtocolSet(address protocol);
    event RelayFactory__DeveloperSet(address developer);
    event RelayFactory__MintFeeSet(uint256 mintFee);
    event RelayFactory__RewardFeeSet(uint256 rewardFee);

    constructor(
        address _oToken, 
        address _vToken, 
        address _vTokenRewarder,
        address _voter
    ) {
        oToken = _oToken;
        vToken = _vToken;
        vTokenRewarder = _vTokenRewarder;
        voter = _voter;
        protocol = msg.sender;
        developer = msg.sender;
    }

    function createRelay(
        string calldata name, 
        string calldata symbol, 
        string calldata uri,
        string calldata description,
        address rewardToken, 
        uint256 initPrice, 
        uint256 minInitPrice
    ) external {
        address relayToken = IRelayTokenFactory(relayTokenFactory).createRelayToken(msg.sender, name, symbol, uri, description);
        address relayRewarder = IRelayRewarderFactory(relayRewarderFactory).createRelayRewarder(msg.sender, relayToken);
        address relayDistro = IRelayDistroFactory(relayDistroFactory).createRelayDistro(msg.sender, relayToken, relayRewarder);
        address relayFeeFlow = IRelayFeeFlowFactory(relayFeeFlowFactory).createRelayFeeFlow(relayDistro, rewardToken, initPrice, minInitPrice);

        index_Relay[relayIndex] = Relay(relayToken, relayRewarder, relayDistro, relayFeeFlow, rewardToken);
        relayToken_Index[relayToken] = relayIndex;
        relayIndex++;

        IRelayToken(relayToken).setFeeFlow(relayFeeFlow);
        IRelayRewarder(relayRewarder).addReward(rewardToken);

        emit RelayFactory__RelayCreated(name, symbol, relayToken, relayRewarder, relayDistro, relayFeeFlow);
    }

    function setRelayTokenFactory(address _relayTokenFactory) external onlyOwner() {
        if (_relayTokenFactory == address(0)) revert RelayFactory__InvalidZeroAddress();
        relayTokenFactory = _relayTokenFactory;
        emit RelayFactory__RelayTokenFactorySet(_relayTokenFactory);
    }

    function setRelayRewarderFactory(address _relayRewarderFactory) external onlyOwner() {
        if (_relayRewarderFactory == address(0)) revert RelayFactory__InvalidZeroAddress();
        relayRewarderFactory = _relayRewarderFactory;
        emit RelayFactory__RelayRewarderFactorySet(_relayRewarderFactory);
    }

    function setRelayDistroFactory(address _relayDistroFactory) external onlyOwner() {
        if (_relayDistroFactory == address(0)) revert RelayFactory__InvalidZeroAddress();
        relayDistroFactory = _relayDistroFactory;
        emit RelayFactory__RelayDistroFactorySet(_relayDistroFactory);
    }

    function setRelayFeeFlowFactory(address _relayFeeFlowFactory) external onlyOwner() {
        if (_relayFeeFlowFactory == address(0)) revert RelayFactory__InvalidZeroAddress();
        relayFeeFlowFactory = _relayFeeFlowFactory;
        emit RelayFactory__RelayFeeFlowFactorySet(_relayFeeFlowFactory);
    }

    function setVoter(address _voter) external onlyOwner() {
        if (_voter == address(0)) revert RelayFactory__InvalidZeroAddress();
        voter = _voter;
        emit RelayFactory__VoterSet(_voter);
    }

    function addReward(address relayRewarder, address rewardToken) external onlyOwner() {
        IRelayRewarder(relayRewarder).addReward(rewardToken);
        emit RelayFactory__RewardAdded(relayRewarder, rewardToken);
    }

    function setRelayFeeFlow(address relayToken, uint256 initPrice, uint256 minInitPrice) external onlyOwner() {
        uint256 index = relayToken_Index[relayToken];
        address relayDistro = index_Relay[index].relayDistro;
        address rewardToken = index_Relay[index].rewardToken;
        address relayFeeFlow = IRelayFeeFlowFactory(relayFeeFlowFactory).createRelayFeeFlow(relayDistro, rewardToken, initPrice, minInitPrice);
        IRelayToken(relayToken).setFeeFlow(relayFeeFlow);
        index_Relay[index].relayFeeFlow = relayFeeFlow;
        emit RelayFactory__FeeFlowSet(index, relayToken, relayFeeFlow);
    }

    function setProtocol(address _protocol) external onlyOwner() {
        if (_protocol == address(0)) revert RelayFactory__InvalidZeroAddress();
        protocol = _protocol;
        emit RelayFactory__ProtocolSet(_protocol);
    }

    function setDeveloper(address _developer) external {
        if (msg.sender != developer) revert RelayFactory__Unauthorized();
        if (_developer == address(0)) revert RelayFactory__InvalidZeroAddress();
        developer = _developer;
        emit RelayFactory__DeveloperSet(_developer);
    }

    function setMintFee(uint256 fee) external onlyOwner() {
        if (fee < MINT_FEE_MIN || fee > MINT_FEE_MAX) revert RelayFactory__InvalidInput();
        mintFee = fee;
        emit RelayFactory__MintFeeSet(fee);
    }

    function setRewardFee(uint256 fee) external onlyOwner() {
        if (fee < REWARD_FEE_MIN || fee > REWARD_FEE_MAX) revert RelayFactory__InvalidInput();
        rewardFee = fee;
        emit RelayFactory__RewardFeeSet(fee);
    }

    function getRelayByIndex(uint256 index) external view returns (address relayToken, address relayRewarder, address relayDistro, address relayFeeFlow) {
        return (index_Relay[index].relayToken, index_Relay[index].relayRewarder, index_Relay[index].relayDistro, index_Relay[index].relayFeeFlow);
    }

    function getRelayByToken(address relayToken) external view returns (address relayRewarder, address relayDistro, address relayFeeFlow) {
        uint256 index = relayToken_Index[relayToken];
        return (index_Relay[index].relayRewarder, index_Relay[index].relayDistro, index_Relay[index].relayFeeFlow);
    }

}