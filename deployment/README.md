# Deployment

The project is deployed on Ethereum Sepolia, a public testnet. No real money is required.

## Public Addresses

Mandatory token:

- Contract: `MokkoAt42Nice`
- Network: Sepolia
- Address: `0xcEcc251E5204Cd169A424770DeA7A3D2E0Def6f5`
- Explorer: https://sepolia.etherscan.io/address/0xcEcc251E5204Cd169A424770DeA7A3D2E0Def6f5
- Verified source: https://sepolia.etherscan.io/address/0xcEcc251E5204Cd169A424770DeA7A3D2E0Def6f5#code

Bonus multisig:

- Contract: `MultisigWallet`
- Network: Sepolia
- Address: `0xc6392277fEA21B08BDe641ad30832040e70170aC`
- Explorer: https://sepolia.etherscan.io/address/0xc6392277fEA21B08BDe641ad30832040e70170aC
- Verified source: https://sepolia.etherscan.io/address/0xc6392277fEA21B08BDe641ad30832040e70170aC#code

## Environment

Create `code/.env` from `code/.env.example`:

```env
SEPOLIA_RPC=https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY=
PRIVATE_KEY2=
PRIVATE_KEY3=
```

The private keys must be testnet wallets only.

## Fresh Deployment

From `code/`:

```sh
rm -f deployments/sepolia.json deployments/sepolia_bonus.json
make sepolia-deploy
make sepolia-balance
```

This creates or updates `code/deployments/sepolia.json` locally with the token address.
Remove the JSON files first when you want a clean correction run. If they already exist, scripts may reuse saved addresses.

## Fresh Bonus Setup

From `code/`:

```sh
make sepolia-fund
make sepolia-bonus-setup
make sepolia-bonus-status
```

This creates or updates `code/deployments/sepolia_bonus.json` locally with the multisig address and bonus state.
If `sepolia_bonus.json` already contains a multisig address, the setup script reuses it instead of deploying a new multisig.

## Blockchain Explorer

The contracts above are verified on Sepolia Etherscan, so the Solidity source code is visible in the `Contract > Code` tab.

Optional verification commands:

```sh
make sepolia-verify
make sepolia-bonus-verify
```

These commands require `ETHERSCAN_API_KEY` in `code/.env`. They are useful after a fresh deployment with new addresses.
