// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import 'contracts/Plugin.sol';
import "@openzeppelin/contracts/access/Ownable.sol";

interface ICommunalFarm {
    function lockedLiquidityOf(address account) external view returns (uint256);
    function stakeLocked(uint256 amount, uint256 time) external;
    function withdrawLockedAll() external;
    function getReward() external;
}

contract IslandFarmPlugin is Plugin {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public farm;
    string public symbol;

    mapping(address => LockedStake[]) public account_LockedStakes;

    struct LockedStake {
        bytes32 id;
        uint256 amount;
    }

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _underlying, 
        address _voter, 
        address[] memory _tokensInUnderlying, 
        address[] memory _bribeTokens,
        address _farm,
        string memory _protocol,
        string memory _symbol
    )
        Plugin(
            _underlying, 
            _voter, 
            _tokensInUnderlying, 
            _bribeTokens,
            _protocol
        )
    {
        farm = _farm;
        symbol = _symbol;
    }

    function claimAndDistribute() 
        public 
        override 
    {
        super.claimAndDistribute();
        ICommunalFarm(farm).getReward();
        address bribe = getBribe();
        uint256 duration = IBribe(bribe).DURATION();
        for (uint256 i = 0; i < getBribeTokens().length; i++) {
            uint256 balance = IERC20(getBribeTokens()[i]).balanceOf(address(this));
            if (balance > duration) {
                IERC20(getBribeTokens()[i]).safeApprove(bribe, 0);
                IERC20(getBribeTokens()[i]).safeApprove(bribe, balance);
                IBribe(bribe).notifyRewardAmount(getBribeTokens()[i], balance);
            }
        }
    }

    function depositFor(address account, uint256 amount) 
        public 
        override 
    {
        super.depositFor(account, amount);

        // bytes32 id = keccak256(abi.encodePacked(address(this), block.timestamp, amount, ICommunalFarm(farm).lockedLiquidityOf(address(this))));
        IERC20(getUnderlyingAddress()).safeApprove(farm, 0);
        IERC20(getUnderlyingAddress()).safeApprove(farm, amount);
        ICommunalFarm(farm).stakeLocked(amount, 0);
    }

    function withdrawTo(address account, uint256 amount) 
        public 
        override 
    {
        ICommunalFarm(farm).withdrawLockedAll(); 
        super.withdrawTo(account, amount);
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getUnderlyingName() public view override returns (string memory) {
        return symbol;
    }

    function getUnderlyingSymbol() public view override returns (string memory) {
        return symbol;
    }

}

contract IslandFarmPluginFactory is Ownable {

    string public constant PROTOCOL = 'Kodiak';
    address public constant KDK = 0xfd27998fa0eaB1A6372Db14Afd4bF7c4a58C5364;
    address public constant XKDK = 0x414B50157a5697F14e91417C5275A7496DcF429D;

    address public immutable VOTER;

    address public last_plugin;

    event Plugin__PluginCreated(address plugin);

    constructor(address _VOTER) {
        VOTER = _VOTER;
    }

    function createPlugin(
        address _lpToken,
        address _farm,
        address _token0,
        address _token1,
        address[] calldata _otherRewards,
        string memory _symbol // ex 50WETH-50HONEY or 50WBTC-50HONEY or 50WBERA-50HONEY
    ) external returns (address) {

        address[] memory tokensInUnderlying = new address[](2);
        tokensInUnderlying[0] = _token0;
        tokensInUnderlying[1] = _token1;

        address[] memory bribeTokens = new address[](2 + _otherRewards.length);
        bribeTokens[0] = KDK;
        bribeTokens[1] = XKDK;
        for (uint256 i = 0; i < _otherRewards.length; i++) {
            bribeTokens[2 + i] = _otherRewards[i];
        }

        IslandFarmPlugin lastPlugin = new IslandFarmPlugin(
            _lpToken,
            VOTER,
            tokensInUnderlying,
            bribeTokens,
            _farm,
            PROTOCOL,
            _symbol
        );
        last_plugin = address(lastPlugin);
        emit Plugin__PluginCreated(last_plugin);
        return last_plugin;
    }

}
