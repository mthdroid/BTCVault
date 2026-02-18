# BTCVault - Bitcoin Yield on Starknet

> Non-custodial Bitcoin yield vault deploying WBTC into Vesu (lending) + Ekubo (LP) DeFi strategies with automated rotation.

**Starknet Hackathon - Bitcoin Track 1**

## What is BTCVault?

BTCVault is an ERC-4626 vault on Starknet that accepts WBTC deposits and automatically allocates them across two DeFi strategies to maximize yield:

- **Vesu Strategy** - Lend WBTC via Vesu's vToken pools (ERC-4626) to earn interest
- **Ekubo Strategy** - Provide concentrated liquidity on Ekubo DEX to earn swap fees
- **Router** - Automatically compares APY between strategies and rebalances when the difference exceeds 10%

Users deposit WBTC, receive vault shares, and earn yield without managing positions manually.

## Architecture

```
User (WBTC) -> BTCVault (ERC-4626 shares)
                    |
                    +-> VesuStrategy  (60% default) -> Vesu vToken lending
                    +-> EkuboStrategy (40% default) -> Ekubo LP fees
                    |
                Router (APY comparison + auto-rebalance)
```

## Deployed Contracts (Starknet Mainnet)

| Contract | Address |
|----------|---------|
| BTCVault | `0x363caa24d01b66327a26426e69c7f1feaf41c170a7e9e74ab0d6b4b7d156f51` |
| VesuStrategy | `0x6d97a47825783883bb9f714bf0994edbdf612454dd5ebe8468fb125d37a8176` |
| EkuboStrategy | `0x6e2d088601e64a29ddaa56312cb079f209b37b7123ab8c56a35c941ccd2433d` |
| Router | `0x46aeabf2ece1a737da603e768c75a44167693e6bb0d9bb5f5ef16713836938d` |

External integrations:
- WBTC: `0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac`
- Vesu WBTC vToken: `0x06b0ef784eb49c85f4d9447f30d7f7212be65ce1e553c18d516c87131e81dbd6`

## Tech Stack

- **Smart Contracts**: Cairo (edition 2024_07, Scarb 2.15.2)
- **Testing**: Starknet Foundry (22 tests passing)
- **Frontend**: Next.js 15 + starknet-react + DaisyUI 5
- **Framework**: Scaffold-Stark 2
- **DeFi Protocols**: Vesu V2 (lending), Ekubo (concentrated liquidity)

## Smart Contracts

### BTCVault (`btc_vault.cairo`)
ERC-4626 vault pattern with:
- `deposit(assets)` - Deposit WBTC, receive shares, auto-allocate to strategies
- `withdraw(shares)` - Burn shares, receive WBTC back from strategies
- `rebalance()` - Router-driven strategy rotation
- `harvest_and_compound()` - Collect and reinvest yield
- Minimum deposit: 100 satoshis

### VesuStrategy (`vesu_strategy.cairo`)
- Deposits WBTC into Vesu's Genesis Pool via vToken (ERC-4626/SNIP-22)
- Tracks vToken shares for accurate balance reporting
- Yield accrues automatically via vToken exchange rate

### EkuboStrategy (`ekubo_strategy.cairo`)
- Provides concentrated liquidity in WBTC pairs on Ekubo
- Manages position NFTs and fee collection
- Supports repositioning when price moves out of range

### Router (`router.cairo`)
- Compares APY between strategies
- Triggers rebalance when difference > 10%
- Maintains minimum 20% allocation per strategy
- Keeper incentive pattern for permissionless rebalancing

## Quick Start

### Prerequisites
- Node.js >= 22
- Yarn
- Scarb 2.15.2
- Starknet Foundry

### Install & Run

```bash
git clone https://github.com/mthdroid/BTCVault.git
cd BTCVault
yarn install
```

### Run Tests
```bash
cd packages/snfoundry
snforge test
```

### Start Frontend
```bash
yarn start
```

Visit `http://localhost:3000`

### Compile Contracts
```bash
cd packages/snfoundry/contracts
scarb build
```

## Frontend Pages

- **Home** (`/`) - Landing page with vault overview and "How it works" flow
- **Vault** (`/vault`) - Deposit/withdraw WBTC with real contract interactions
- **Dashboard** (`/dashboard`) - Live vault stats, strategy allocation, user position
- **Debug** (`/debug`) - Raw contract interaction via Scaffold-Stark

## Project Structure

```
BTCVault/
├── packages/
│   ├── snfoundry/
│   │   └── contracts/src/
│   │       ├── btc_vault.cairo      # Main ERC-4626 vault
│   │       ├── vesu_strategy.cairo  # Vesu lending strategy
│   │       ├── ekubo_strategy.cairo # Ekubo LP strategy
│   │       ├── router.cairo         # Strategy rotation
│   │       ├── interfaces.cairo     # Shared interfaces
│   │       └── tests/               # 22 tests
│   └── nextjs/
│       ├── app/
│       │   ├── page.tsx             # Landing page
│       │   ├── vault/page.tsx       # Deposit/withdraw
│       │   └── dashboard/page.tsx   # Vault analytics
│       └── contracts/
│           └── deployedContracts.ts # Mainnet ABI + addresses
├── deploy-mainnet.js               # Deployment script
└── deployment-mainnet.json          # Deployed addresses
```

## License

MIT

---

Built by [mthdroid](https://github.com/mthdroid) for the Starknet Hackathon Bitcoin Track
