// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IRelayTokenFactory {
    function createRelayToken(address owner, string calldata name, string calldata symbol) external returns (address);
}

interface IRelayRewarderFactory {
    function createRelayRewarder(address owner, address relayToken) external returns (address);
}

contract RelayFactory is Ownable {

    address public immutable base;
    address public immutable token;
    address public immutable oToken;
    address public immutable vToken;
    address public immutable vTokenRewarder;

    address public relayTokenFactory;
    address public relayRewarderFactory;

    address public voter;
    address public multicall;
    address public protocol;

    error RelayFactory__InvalidZeroAddress();

    event RelayFactory__RelayCreated(string name, string symbol, address indexed relayToken, address indexed relayTokenRewarder);
    event RelayFactory__RelayTokenFactorySet(address indexed relayTokenFactory);
    event RelayFactory__RelayRewarderFactorySet(address indexed relayRewarderFactory);

    constructor(
        address _base, 
        address _token, 
        address _oToken, 
        address _vToken, 
        address _vTokenRewarder,
        address _voter,
        address _multicall
    ) {
        base = _base;
        token = _token;
        oToken = _oToken;
        vToken = _vToken;
        vTokenRewarder = _vTokenRewarder;
        voter = _voter;
        multicall = _multicall;
    }

    function createRelay(string calldata name, string calldata symbol) external returns (address) {
        address relayToken = IRelayTokenFactory(relayTokenFactory).createRelayToken(msg.sender, name, symbol);
        address relayTokenRewarder = IRelayRewarderFactory(relayRewarderFactory).createRelayRewarder(msg.sender, relayToken);
        emit RelayFactory__RelayCreated(name, symbol, relayToken, relayTokenRewarder);
        return address(relayToken);
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

    function setVoter(address _voter) external onlyOwner() {
        if (_voter == address(0)) revert RelayFactory__InvalidZeroAddress();
        voter = _voter;
    }

    function setMulticall(address _multicall) external onlyOwner() {
        if (_multicall == address(0)) revert RelayFactory__InvalidZeroAddress();
        multicall = _multicall;
    }

    function setProtocol(address _protocol) external onlyOwner() {
        if (_protocol == address(0)) revert RelayFactory__InvalidZeroAddress();
        protocol = _protocol;
    }

}