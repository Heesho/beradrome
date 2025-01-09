// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "contracts/interfaces/IGauge.sol";
import "contracts/interfaces/IBribe.sol";
import "contracts/interfaces/IVoter.sol";

interface IBerachainRewardsVaultFactory {
    function createRewardsVault(address stakingToken) external returns (address);
    function getVault(address stakingToken) external view returns (address);
}

interface IBerachainRewardsVault {
    function delegateStake(address account, uint256 amount) external;
    function delegateWithdraw(address account, uint256 amount) external;
    function stake(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function getReward(address account) external;
    function setOperator(address operator) external;
}

contract VaultToken is ERC20, Ownable {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}

/**
 * @title Plugin
 * @author heesho
 * 
 * Plugins are contracts that can be used to integrate a yield-bearing asset with the Voting system.
 * The idea is that when a yield-bearing asset is added to this system, users can deposit it in a Plugin
 * to earn OTOKEN rewards. The Plugin will strip the yield from the yield-bearing asset and distribute it
 * as a voting reward to VTOKEN holders that voted for the Plugin. The Plugin contract is in charge of 
 * accepting deposits/withdrawals from accounts and updating their balances in the corresponding Gauge contract
 * so that they can receive OTOKEN rewards. The Plugin is also in charge of harvesting yield from the yield-bearing
 * asset (underlying) and distributing that yield to its corresponding Bribe contract.
 * 
 * Plugin balanceOf must be equal to Gauge balanceOf for all users at all times.
 * Plugin totalSupply must be equal to Gauge totalSupply at all times.
 */
abstract contract Plugin {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    /*----------  STATE VARIABLES  --------------------------------------*/

    IERC20 private immutable token;
    address private immutable OTOKEN;
    address private immutable voter;
    address private gauge;
    address private bribe;

    address private vaultToken;
    address private rewardVault;

    string private protocol;
    string private name;

    address[] private assetTokens;
    address[] private bribeTokens;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    /*----------  ERRORS ------------------------------------------------*/

    error Plugin__InvalidZeroInput();
    error Plugin__NotAuthorizedVoter();

    /*----------  EVENTS ------------------------------------------------*/

    event Plugin__Deposited(address indexed account, uint256 amount);
    event Plugin__Withdrawn(address indexed account, uint256 amount);
    event Plugin__ClaimedAnDistributed();

    /*----------  MODIFIERS  --------------------------------------------*/

    modifier nonZeroInput(uint256 _amount) {
        if (_amount == 0) revert Plugin__InvalidZeroInput();
        _;
    }

    modifier onlyVoter() {
        if (msg.sender != voter) revert Plugin__NotAuthorizedVoter();
        _;
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _token, 
        address _voter, 
        address[] memory _assetTokens, 
        address[] memory _bribeTokens,
        address _vaultFactory,
        string memory _protocol,
        string memory _name,
        string memory _vaultName
    ) {
        token = IERC20(_token);
        voter = _voter;
        assetTokens = _assetTokens;
        bribeTokens = _bribeTokens;

        protocol = _protocol;
        name = _name;

        OTOKEN = IVoter(_voter).OTOKEN();
        vaultToken = address(new VaultToken(_vaultName, _vaultName));
        rewardVault = IBerachainRewardsVaultFactory(_vaultFactory).createRewardsVault(vaultToken);
    }

    function depositFor(address account, uint256 amount) 
        public
        virtual
        nonZeroInput(amount)
    {
        _totalSupply = _totalSupply + amount;
        _balances[account] = _balances[account] + amount;
        emit Plugin__Deposited(account, amount);
        token.safeTransferFrom(msg.sender, address(this), amount);

        IGauge(gauge)._deposit(account, amount);

        VaultToken(vaultToken).mint(address(this), amount);
        IERC20(vaultToken).safeApprove(rewardVault, 0);
        IERC20(vaultToken).safeApprove(rewardVault, amount);
        IBerachainRewardsVault(rewardVault).delegateStake(account, amount);
    }

    function withdrawTo(address account, uint256 amount)
        public
        virtual
        nonZeroInput(amount)
    {
        _totalSupply = _totalSupply - amount;
        _balances[msg.sender] = _balances[msg.sender] - amount;
        emit Plugin__Withdrawn(msg.sender, amount);
        token.safeTransfer(account, amount);

        IGauge(gauge)._withdraw(msg.sender, amount);

        IBerachainRewardsVault(rewardVault).delegateWithdraw(msg.sender, amount);
        VaultToken(vaultToken).burn(address(this), amount);

    }

    function claimAndDistribute() public virtual {
        emit Plugin__ClaimedAnDistributed();
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    function setGauge(address _gauge) external onlyVoter {
        gauge = _gauge;
    }

    function setBribe(address _bribe) external onlyVoter {
        bribe = _bribe;
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function getToken() public view virtual returns (address) {
        return address(token);
    }

    function getProtocol() public view virtual returns (string memory) {
        return protocol;
    }

    function getName() public view virtual returns (string memory) {
        return name;
    }

    function getVoter() public view returns (address) {
        return voter;
    }

    function getGauge() public view returns (address) {
        return gauge;
    }

    function getBribe() public view returns (address) {
        return bribe;
    }

    function getAssetTokens() public view virtual returns (address[] memory) {
        return assetTokens;
    }

    function getBribeTokens() public view returns (address[] memory) {
        return bribeTokens;
    }

    function getVaultToken() public view returns (address) {
        return vaultToken;
    }

    function getRewardVault() public view returns (address) {
        return rewardVault;
    }
}