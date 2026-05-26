# Code

Hardhat project for the 42 token exercise.

Contracts:

- `contracts/Mokko42.sol`: ERC-20-style token `MokkoAt42Nice` (`M42`)
- `contracts/MultisigWallet.sol`: 2-of-3 multisig for the bonus

## Setup

Create `code/.env`:

```env
SEPOLIA_RPC=https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY=...
PRIVATE_KEY2=...
PRIVATE_KEY3=...
```

`PRIVATE_KEY` deploys the token. `PRIVATE_KEY2` and `PRIVATE_KEY3` are used to prove the multisig approvals.

## Mandatory Commands

```sh
rm -f deployments/sepolia.json deployments/sepolia_bonus.json
make sepolia-deploy
make sepolia-mint
make sepolia-transfer
make sepolia-balance
```

`make sepolia-mint` proves the deployer can mint directly before ownership is moved to the multisig.

Delete the deployment JSON files before a fresh correction run. Otherwise the scripts reuse existing Sepolia addresses instead of starting from a new local deployment state.

## Bonus Demo

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

The first `execute` should fail because only one owner accepted. After the second accept, `execute` succeeds and mints through the multisig.

## Deployment Files

- `deployments/sepolia.json`: mandatory token address
- `deployments/sepolia_bonus.json`: bonus multisig and pending transaction state

Delete both JSON files before a fresh correction run if you want new Sepolia contract addresses. If they exist, the scripts use the saved addresses.

## Optional Etherscan Verification

Add `ETHERSCAN_API_KEY` to `.env`, then run:

```sh
make sepolia-verify
make sepolia-bonus-verify
```

The current documented contracts are already verified:

- Token: https://sepolia.etherscan.io/address/0xcEcc251E5204Cd169A424770DeA7A3D2E0Def6f5#code
- Multisig: https://sepolia.etherscan.io/address/0xc6392277fEA21B08BDe641ad30832040e70170aC#code
