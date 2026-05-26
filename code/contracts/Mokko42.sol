// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MokkoAt42Nice - Minimal ERC-20 implementation (no OpenZeppelin)
/// @notice Supply minted to deployer at construction.
contract MokkoAt42Nice {
    // --- ERC-20 metadata ---
    string public name;
    string public symbol;

    // Most ERC-20 tokens use 18 decimals (convention, not mandatory)
    uint8 public constant decimals = 18;

    // --- ERC-20 storage ---
    uint256 private _totalSupply;
    mapping(address => uint256) private _balanceOf;
    mapping(address => mapping(address => uint256)) private _allowance;

    // --- ERC-20 events ---
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(
        uint256 initialSupply // in "whole tokens" (we will scale by decimals)
    ) {
        name = "MokkoAt42Nice";
        symbol = "M42";

        owner = msg.sender;

        // mint initialSupply * 10^decimals to deployer
        _mint(msg.sender, initialSupply * (10 ** uint256(decimals)));
    }

    // --- ERC-20 view functions ---
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balanceOf[account];
    }

    function allowance(address tokenOwner, address spender) external view returns (uint256) {
        return _allowance[tokenOwner][spender];
    }

    // --- ERC-20 state-changing functions ---
    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        _approve(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 current = _allowance[from][msg.sender];
        require(current >= value, "ERC20: insufficient allowance");

        // Decrease allowance (standard behavior)
        unchecked {
            _allowance[from][msg.sender] = current - value;
        }

        _transfer(from, to, value);
        return true;
    }

    // --- Internal helpers ---
    function _transfer(address from, address to, uint256 value) internal {
        require(from != address(0), "ERC20: transfer from zero");
        require(to != address(0), "ERC20: transfer to zero");

        uint256 fromBal = _balanceOf[from];
        require(fromBal >= value, "ERC20: insufficient balance");

        unchecked {
            _balanceOf[from] = fromBal - value;
        }
        _balanceOf[to] += value;

        emit Transfer(from, to, value);
    }

    function _approve(address tokenOwner, address spender, uint256 value) internal {
        require(tokenOwner != address(0), "ERC20: approve from zero");
        require(spender != address(0), "ERC20: approve to zero");

        _allowance[tokenOwner][spender] = value;
        emit Approval(tokenOwner, spender, value);
    }

    function _mint(address to, uint256 value) internal {
        require(to != address(0), "ERC20: mint to zero");

        _totalSupply += value;
        _balanceOf[to] += value;

        // ERC-20 convention: mint emits Transfer(from=0x0, to, value)
        emit Transfer(address(0), to, value);
    }

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner is zero");
        address prev = owner;
        owner = newOwner;
        emit OwnershipTransferred(prev, newOwner);
    }

    function mint(address to, uint256 wholeTokens) external onlyOwner returns (bool) {
        _mint(to, wholeTokens * (10 ** uint256(decimals)));
        return true;
    }
}
