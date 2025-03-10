// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import 'contracts/Plugin.sol';

interface IBurrBearFarms {
    function lpToken(uint256 pid) external view returns (address);
    function deposit(uint256 pid, uint256 amount, address to) external;
    function withdraw(uint256 pid, uint256 amount, address to) external;
    function harvest(uint256 pid, address to) external;
}

contract BurrBearPlugin is Plugin, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    address public constant WBERA = 0x6969696969696969696969696969696969696969;
    address public constant BURR_BEAR_FARMS = 0x7A2Be8E74F4aE28796828AF7B685dEf78c20416c;

    /*----------  STATE VARIABLES  --------------------------------------*/

    uint256 public immutable pid;

    /*----------  ERRORS ------------------------------------------------*/

    error BurrBearPlugin__InvalidToken();

    /*---------- EVENTS -------------------------------------------------*/

    event BurrBearPlugin__ClaimAndDistribute(uint256 amount);

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _token, 
        address _voter, 
        address[] memory _assetTokens, 
        address[] memory _bribeTokens,
        address _vaultFactory,
        uint256 _pid,
        string memory _protocol,
        string memory _name,
        string memory _vaultName
    )
        Plugin(
            _token, 
            _voter, 
            _assetTokens, 
            _bribeTokens,
            _vaultFactory,
            _protocol,
            _name,
            _vaultName
        )
    {
        pid = _pid;
    }

    function claimAndDistribute() 
        public 
        override 
        nonReentrant
    {
        super.claimAndDistribute();
        IBurrBearFarms(BURR_BEAR_FARMS).harvest(pid, address(this));
        address bribe = getBribe();
        uint256 duration = IBribe(bribe).DURATION();
        uint256 balance = IERC20(WBERA).balanceOf(address(this));
        if (balance > duration) {
            IERC20(WBERA).safeApprove(bribe, 0);
            IERC20(WBERA).safeApprove(bribe, balance);
            IBribe(bribe).notifyRewardAmount(WBERA, balance);
            emit BurrBearPlugin__ClaimAndDistribute(balance);
        }
    }

    function depositFor(address account, uint256 amount) 
        public
        override
        nonReentrant
    {
        super.depositFor(account, amount);
        IERC20(getToken()).safeApprove(BURR_BEAR_FARMS, 0);
        IERC20(getToken()).safeApprove(BURR_BEAR_FARMS, amount);
        IBurrBearFarms(BURR_BEAR_FARMS).deposit(pid, amount, address(this));
    }

    function withdrawTo(address account, uint256 amount) 
        public
        override
        nonReentrant
    {
        IBurrBearFarms(BURR_BEAR_FARMS).withdraw(pid, amount, address(this));
        super.withdrawTo(account, amount);
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    function recoverERC20(address to, address target, uint256 amount)
        external 
        onlyOwner 
    {
        if (target == getToken()) {
            revert BurrBearPlugin__InvalidToken();
        } else {
            IERC20(target).safeTransfer(to, amount);
        }
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

}

contract BurrBearPluginFactory {

    string public constant PROTOCOL = 'BurrBear';
    address public constant WBERA = 0x6969696969696969696969696969696969696969;
    address public constant BURR_BEAR_FARMS = 0x7A2Be8E74F4aE28796828AF7B685dEf78c20416c;
    address public constant REWARDS_VAULT_FACTORY = 0x94Ad6Ac84f6C6FbA8b8CCbD71d9f4f101def52a8;

    address public immutable VOTER;

    address public last_plugin;

    event BurrBearPluginFactory__PluginCreated(address plugin);

    constructor(address _VOTER) {
        VOTER = _VOTER;
    }

    function createPlugin(
        uint256 _pid,
        address[] memory _assetTokens,
        string memory _name,
        string memory _vaultName
    ) external returns (address) {

        address[] memory bribeTokens = new address[](1);
        bribeTokens[0] = WBERA;

        BurrBearPlugin lastPlugin = new BurrBearPlugin(
            IBurrBearFarms(BURR_BEAR_FARMS).lpToken(_pid),
            VOTER,
            _assetTokens,
            bribeTokens,
            REWARDS_VAULT_FACTORY,
            _pid,
            PROTOCOL,
            _name,
            _vaultName
        );
        last_plugin = address(lastPlugin);
        lastPlugin.transferOwnership(msg.sender);
        emit BurrBearPluginFactory__PluginCreated(last_plugin);
        return last_plugin;
    }

}