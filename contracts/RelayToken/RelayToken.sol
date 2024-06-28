// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RelayToken is ERC20, ERC20Permit, ERC20Votes, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*===================================================================*/
    /*===========================  SETTINGS  ============================*/

    string internal constant NAME = 'RelayToken';   // Name of RelayToken
    string internal constant SYMBOL = 'reTOKEN';    // Symbol of reTOKEN

    /*===========================  END SETTINGS  ========================*/
    /*===================================================================*/

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 public constant DIVISOR = 10000;
    uint256 public constant PRECISION = 1e18;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable base;
    address public immutable token;
    address public immutable oToken;
    address public immutable vToken;
    address public immutable vTokenRewarder;

    address public voter;
    address public multicall;

    address public delegate;
    address public treasury;

    address[] public plugins;
    address[] public weights;

    uint256 public slippageTolerance = 9500;
    uint256 public fee = 1000;

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  EVENTS ------------------------------------------------*/

    /*----------  MODIFIERS  --------------------------------------------*/

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _base, 
        address _token, 
        address _oToken, 
        address _vToken, 
        address _vTokenRewarder,
        address _voter,
        address _multicall
    )
        ERC20(NAME, SYMBOL) 
        ERC20Permit(NAME)
    {
        base = _base;
        token = _token;
        oToken = _oToken;
        vToken = _vToken;
        vTokenRewarder = _vTokenRewarder;
        voter = _voter;
        multicall = _multicall;
        delegate = msg.sender;
        treasury = msg.sender;
    }

    // mint

    // vote

    // claim bribes

    // sweep rewards

    // claim vToken rewards

    // burn oToken

    // stake Token

    // borrow base

    // buy Token

    // loop

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    // set votes

    // set voter

    // set multicall

    // set delegate

    // set treasury

    // set slippage tolerance

    // set fee

    /*----------  FUNCTION OVERRIDES  -----------------------------------*/

    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20)
    {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    // get votes

}