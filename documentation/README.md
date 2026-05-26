# Documentation

## Token Behavior

`MokkoAt42Nice` is an ERC-20-style token named `MokkoAt42Nice` with ticker `M42`.

It implements:

- `name`
- `symbol`
- `decimals`
- `totalSupply`
- `balanceOf`
- `transfer`
- `approve`
- `allowance`
- `transferFrom`

The constructor mints the initial supply to the deployer. The token also has an owner-controlled `mint` function to demonstrate ownership and privileges.

## Existing Libraries

This project implements the token and multisig logic manually to make the contract behavior easy to explain during evaluation. In a production project, I would normally avoid rewriting this logic and use audited libraries instead.

Libraries that could replace most of this code:

- OpenZeppelin `ERC20`: standard ERC-20 implementation for balances, transfers, allowances, metadata, and events.
- OpenZeppelin `Ownable`: standard owner access control for functions like `mint` and `transferOwnership`.
- OpenZeppelin `AccessControl`: role-based permissions if minting or administration needed several roles instead of one owner.
- OpenZeppelin `ERC20Permit`: optional gasless approvals using signatures.
- Safe smart accounts: production-grade multisig wallet infrastructure, commonly used instead of writing a custom multisig from scratch.

The manual implementation keeps the project smaller and shows exactly how `transfer`, `approve`, `transferFrom`, ownership, and multisig approvals work internally. The tradeoff is that manually written security-sensitive code should not be used in production without a serious audit.

## Security Choices

The mandatory part keeps ownership simple: the deployer owns the token and can call `mint`.

The bonus part transfers ownership to a `MultisigWallet`. After that, direct minting from the deployer fails with `Not owner`. A mint must be submitted to the multisig, accepted by enough owners, and then executed.

The multisig is configured as 2-of-3:

- Owner 1: `PRIVATE_KEY`
- Owner 2: `PRIVATE_KEY2`
- Owner 3: `PRIVATE_KEY3`
- Threshold: `2`

## Mandatory Correction Flow

From `code/`:

```sh
rm -f deployments/sepolia.json deployments/sepolia_bonus.json
make sepolia-deploy
make sepolia-mint
make sepolia-transfer
make sepolia-balance
```

What to show:

- Removing the deployment JSON files forces the scripts to use fresh Sepolia contracts for the correction.
- `sepolia-deploy`: creates the token on Sepolia.
- `sepolia-mint`: owner directly mints M42.
- `sepolia-transfer`: transfers 42 M42 from owner 1 to owner 2.
- `sepolia-balance`: displays ETH and M42 balances.

## Bonus Correction Flow

From `code/`:

```sh
make sepolia-fund
make sepolia-bonus-setup
make sepolia-bonus-mint
make sepolia-bonus-status
make sepolia-bonus-accept-1
make sepolia-bonus-execute
make sepolia-bonus-accept-2
make sepolia-bonus-execute
make sepolia-bonus-status
```

Expected behavior:

- If `deployments/sepolia_bonus.json` already exists, `sepolia-bonus-setup` reuses the saved multisig instead of deploying a new one.
- `sepolia-bonus-setup` deploys the multisig and transfers token ownership to it.
- `sepolia-bonus-mint` submits a pending mint transaction to the multisig.
- After `accept-1`, `execute` should fail because the threshold is not met.
- After `accept-2`, `execute` succeeds and mints through the multisig.

## Verified Explorer Links

Token:

https://sepolia.etherscan.io/address/0xcEcc251E5204Cd169A424770DeA7A3D2E0Def6f5#code

Multisig:

https://sepolia.etherscan.io/address/0xc6392277fEA21B08BDe641ad30832040e70170aC#code

Both contracts are verified, so the Solidity source code is readable directly on Sepolia Etherscan.
