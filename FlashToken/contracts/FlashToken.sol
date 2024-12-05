// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./interfaces/IFlashToken.sol";

interface IERC20Errors {
    error ERC20InsufficientBalance(
        address sender,
        uint256 balance,
        uint256 needed
    );

    error ERC20InvalidSender(address sender);

    error ERC20InvalidReceiver(address receiver);

    error ERC20InsufficientAllowance(
        address spender,
        uint256 allowance,
        uint256 needed
    );

    error ERC20InvalidApprover(address approver);

    error ERC20InvalidSpender(address spender);
}

contract FlashToken is Ownable, IFlashToken, IERC20, IERC20Errors {
    using EnumerableSet for EnumerableSet.UintSet;

    uint256 private _totalSupply;
    uint256 private initialSupply = 50000000 * 1e18;
    uint256 public constant EXPIRATION_TIME = 10 days;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    mapping(address => TransferInformation) private transferInfos;
    mapping(address => mapping(uint256 => TokenInformation)) private tokenInfos;

    uint8 private decimal;
    string private _name;
    string private _symbol;
    constructor(string memory name_, string memory symbol_, uint8 _decimal) {
        require(_decimal > 0, "INVALID_DECIMAL");
        _name = name_;
        _symbol = symbol_;
        decimal = _decimal;
        _mint(address(this), initialSupply);
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view virtual returns (uint256) {
        uint256 totalAmount = 0;
        TransferInformation memory transferInfo = transferInfos[account];
        (uint256 startIndex, uint256 currentIndex, uint256 curTime) = (
            transferInfo.startIndex,
            transferInfo.currentIndex,
            block.timestamp
        );
        for (uint256 i = startIndex; i < currentIndex; i++) {
            TokenInformation memory tokenInfo = tokenInfos[account][i];
            if (tokenInfo.expireTime > curTime) {
                totalAmount += tokenInfo.amount;
            }
        }
        return totalAmount;
    }

    function transfer(address to, uint256 value) public virtual returns (bool) {
        address owner = msg.sender;
        _transfer(owner, to, value);
        return true;
    }

    function allowance(
        address owner,
        address spender
    ) public view virtual returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(
        address spender,
        uint256 value
    ) public virtual returns (bool) {
        address owner = msg.sender;
        _approve(owner, spender, value);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public virtual returns (bool) {
        address spender = msg.sender;
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        return true;
    }

    function mintTokens(address receiver, uint256 amount) external onlyOwner {
        _mint(receiver, amount);
    }

    function _transfer(address from, address to, uint256 value) internal {
        if (from == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(from, to, value);
    }

    function _popTokens(address _account, uint256 _amount) internal {
        TransferInformation storage information = transferInfos[_account];
        (uint256 startIndex, uint256 currentIndex) = (
            information.startIndex,
            information.currentIndex
        );
        uint256 curTime = block.timestamp;
        uint256 remainAmount = _amount;
        for (uint256 i = startIndex; i < currentIndex; i++) {
            TokenInformation storage tokenInfo = tokenInfos[_account][i];
            if (tokenInfo.expireTime > curTime) {
                remainAmount = tokenInfo.amount > remainAmount
                    ? remainAmount
                    : tokenInfo.amount;
                tokenInfo.amount -= remainAmount;

                if (tokenInfo.amount == 0) {
                    information.startIndex = i + 1;
                }
            } else {
                information.startIndex = i + 1;
            }
        }
    }

    function _pushTokens(address _account, uint256 _amount) internal {
        TransferInformation storage information = transferInfos[_account];
        (uint256 startIndex, uint256 currentIndex) = (
            information.startIndex,
            information.currentIndex
        );
        uint256 curTime = block.timestamp;
        for (uint256 i = startIndex; i < currentIndex; i++) {
            TokenInformation memory tokenInfo = tokenInfos[_account][i];
            if (tokenInfo.expireTime < curTime) {
                information.startIndex = i + 1;
            }
        }

        tokenInfos[_account][information.currentIndex] = TokenInformation(
            curTime,
            curTime + EXPIRATION_TIME,
            _amount
        );
        information.currentIndex += 1;
    }

    function _update(address from, address to, uint256 value) internal virtual {
        if (from == address(0)) {
            // Overflow check required: The rest of the code assumes that totalSupply never overflows
            _totalSupply += value;
        } else {
            uint256 fromBalance = balanceOf(from);
            if (fromBalance < value) {
                revert ERC20InsufficientBalance(from, fromBalance, value);
            }
            _popTokens(from, value);
            unchecked {
                // Overflow not possible: value <= fromBalance <= totalSupply.
                _balances[from] = fromBalance - value;
            }
        }

        if (to == address(0)) {
            unchecked {
                // Overflow not possible: value <= totalSupply or value <= fromBalance <= totalSupply.
                _totalSupply -= value;
            }
        } else {
            _pushTokens(to, value);
            unchecked {
                // Overflow not possible: balance + value is at most totalSupply, which we know fits into a uint256.
                _balances[to] += value;
            }
        }

        emit Transfer(from, to, value);
    }

    function _mint(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(address(0), account, value);
    }

    function _burn(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        _update(account, address(0), value);
    }

    function _approve(address owner, address spender, uint256 value) internal {
        _approve(owner, spender, value, true);
    }

    function _approve(
        address owner,
        address spender,
        uint256 value,
        bool emitEvent
    ) internal virtual {
        if (owner == address(0)) {
            revert ERC20InvalidApprover(address(0));
        }
        if (spender == address(0)) {
            revert ERC20InvalidSpender(address(0));
        }
        _allowances[owner][spender] = value;
        if (emitEvent) {
            emit Approval(owner, spender, value);
        }
    }

    function _spendAllowance(
        address owner,
        address spender,
        uint256 value
    ) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            if (currentAllowance < value) {
                revert ERC20InsufficientAllowance(
                    spender,
                    currentAllowance,
                    value
                );
            }
            unchecked {
                _approve(owner, spender, currentAllowance - value, false);
            }
        }
    }
}
