# Tokenizer

This repository contains a 42 token project deployed on a public test blockchain.

## Project Choice

I chose Ethereum Sepolia because it is a public testnet, works with Hardhat, and does not require real money. The token follows the ERC-20 interface style: name, symbol, decimals, total supply, balances, transfers, allowances, approvals, and transferFrom.

Token:

- Name: `MokkoAt42Nice`
- Symbol: `M42`
- Decimals: `18`
- Standard: ERC-20-style token
- Network: Ethereum Sepolia testnet

## Repository Structure

- `code/`: Solidity contracts, Hardhat config, and scripts.
- `deployment/`: deployed addresses and deployment procedure.
- `documentation/`: project documentation and correction/demo flow.

## Quick Demo

From `code/`:

```sh
rm -f deployments/sepolia.json deployments/sepolia_bonus.json
make sepolia-deploy
make sepolia-mint
make sepolia-transfer
make sepolia-balance
```

Bonus multisig demo:

```sh
make sepolia-fund
make sepolia-bonus-setup
make sepolia-bonus-mint
make sepolia-bonus-accept-1
make sepolia-bonus-execute
make sepolia-bonus-accept-2
make sepolia-bonus-execute
make sepolia-bonus-status
```

The first bonus execution should fail with only one approval. The second execution succeeds after the second owner approval.

Previously deployed public addresses are documented in `deployment/README.md`. For correction, prefer a fresh run so the mandatory demo starts with a token still owned by the deployer.
