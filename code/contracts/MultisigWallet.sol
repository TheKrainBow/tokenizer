// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MultisigWallet - Minimal M-of-N multisignature wallet
/// @notice Owners approve a transaction; once approvals reach `threshold`, anyone can execute it.
contract MultisigWallet {
    event Deposit(address indexed sender, uint256 value);

    event TransactionSubmitted(uint256 indexed transactionId, address indexed to, uint256 value, bytes data);
    event TransactionApproved(uint256 indexed transactionId, address indexed owner);
    event TransactionRevoked(uint256 indexed transactionId, address indexed owner);
    event TransactionExecuted(uint256 indexed transactionId, address indexed executor);

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public threshold;

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 approvals;
    }

    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public approvedBy;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    modifier transactionExists(uint256 transactionId) {
        require(transactionId < transactions.length, "Transaction does not exist");
        _;
    }

    modifier notExecuted(uint256 transactionId) {
        require(!transactions[transactionId].executed, "Transaction already executed");
        _;
    }

    modifier notApproved(uint256 transactionId) {
        require(!approvedBy[transactionId][msg.sender], "Already approved");
        _;
    }

    constructor(address[] memory _owners, uint256 _threshold) {
        require(_owners.length > 0, "Owners required");
        require(_threshold > 0 && _threshold <= _owners.length, "Invalid threshold");

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Zero owner");
            require(!isOwner[owner], "Duplicate owner");
            isOwner[owner] = true;
            owners.push(owner);
        }

        threshold = _threshold;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function ownersCount() external view returns (uint256) {
        return owners.length;
    }

    function transactionCount() external view returns (uint256) {
        return transactions.length;
    }

    /// @notice Propose a transaction to call `to` with `value` ETH and `data` calldata.
    function submit(address to, uint256 value, bytes calldata data) external onlyOwner returns (uint256 transactionId) {
        require(to != address(0), "Zero to");

        transactions.push(Transaction({
            to: to,
            value: value,
            data: data,
            executed: false,
            approvals: 0
        }));

        transactionId = transactions.length - 1;
        emit TransactionSubmitted(transactionId, to, value, data);
    }

    /// @notice Approve a proposed transaction.
    function approve(uint256 transactionId)
        external
        onlyOwner
        transactionExists(transactionId)
        notExecuted(transactionId)
        notApproved(transactionId)
    {
        approvedBy[transactionId][msg.sender] = true;
        transactions[transactionId].approvals += 1;

        emit TransactionApproved(transactionId, msg.sender);
    }

    /// @notice Revoke your approval before execution.
    function revoke(uint256 transactionId)
        external
        onlyOwner
        transactionExists(transactionId)
        notExecuted(transactionId)
    {
        require(approvedBy[transactionId][msg.sender], "Not approved");
        approvedBy[transactionId][msg.sender] = false;
        transactions[transactionId].approvals -= 1;

        emit TransactionRevoked(transactionId, msg.sender);
    }

    /// @notice Execute a transaction once it has enough approvals.
    function execute(uint256 transactionId)
        external
        transactionExists(transactionId)
        notExecuted(transactionId)
    {
        Transaction storage t = transactions[transactionId];
        require(t.approvals >= threshold, "Not enough approvals");

        t.executed = true;

        (bool ok, ) = t.to.call{ value: t.value }(t.data);
        require(ok, "Call failed");

        emit TransactionExecuted(transactionId, msg.sender);
    }
}
