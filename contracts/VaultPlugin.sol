// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import 'contracts/Plugin.sol';
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IBerachainRewardsVaultFactory {
    function createRewardsVault(address _stakingToken) external returns (address);
}

interface IRewardVault {
    function delegateStake(address account, uint256 amount) external;
    function delegateWithdraw(address account, uint256 amount) external;
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

contract VaultPlugin is Plugin {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable vaultToken;
    address public immutable rewardVault;

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _underlying, 
        address _voter, 
        address[] memory _tokensInUnderlying, 
        address[] memory _bribeTokens,
        address _vaultFactory,
        string memory _protocol,
        string memory _vaultTokenName,
        string memory _vaultTokenSymbol
    )
        Plugin(
            _underlying, 
            _voter, 
            _tokensInUnderlying, 
            _bribeTokens,
            _protocol
        )
    {
        vaultToken = address(new VaultToken(_vaultTokenName, _vaultTokenSymbol));
        rewardVault = IBerachainRewardsVaultFactory(_vaultFactory).createRewardsVault(vaultToken);
    }

    function claimAndDistribute() 
        public 
        override 
    {
        super.claimAndDistribute();
    }

    function depositFor(address account, uint256 amount) 
        public 
        override 
    {
        super.depositFor(account, amount);

        // Berachain Rewards Vault Delegate Stake
        VaultToken(vaultToken).mint(address(this), amount);
        VaultToken(vaultToken).approve(rewardVault, amount);
        IRewardVault(rewardVault).delegateStake(account, amount);
    }

    function withdrawTo(address account, uint256 amount) 
        public 
        override 
    {
        super.withdrawTo(account, amount);

        // Berachain Rewards Vault Delegate Stake
        IRewardVault(rewardVault).delegateWithdraw(account, amount);
        VaultToken(vaultToken).burn(address(this), amount);
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getVaultToken() external view returns (address) {
        return vaultToken;
    }

    function getRewardVault() external view returns (address) {
        return rewardVault;
    }

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}

}