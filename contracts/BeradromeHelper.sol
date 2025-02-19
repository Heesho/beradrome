// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract BeradromeHelper is Ownable {

    /*----------  STATE VARIABLES  --------------------------------------*/

    mapping(address => address) public vaultToken_UnderlyingToken;
    mapping(address => address) public underlyingToken_VaultToken;
 
    /*----------  FUNCTIONS  --------------------------------------------*/

    event BeradromeHelper__TokenSet(address indexed vaultToken, address indexed underlyingToken);

    constructor() {}

    function setToken(address _vaultToken, address _underlyingToken) external onlyOwner {
        vaultToken_UnderlyingToken[_vaultToken] = _underlyingToken;
        underlyingToken_VaultToken[_underlyingToken] = _vaultToken;
        emit BeradromeHelper__TokenSet(_vaultToken, _underlyingToken);
    }

    function getUnderlyingToken(address _vaultToken) external view returns (address) {
        return vaultToken_UnderlyingToken[_vaultToken];
    }

    function getVaultToken(address _underlyingToken) external view returns (address) {
        return underlyingToken_VaultToken[_underlyingToken];
    }

}