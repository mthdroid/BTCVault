# BTCVault

Non-custodial Bitcoin yield vault on Starknet. Deposit WBTC, earn yield through dual DeFi strategies (Vesu lending + Ekubo LP), receive vault shares.

**Live:** [btcvault-opal.vercel.app](https://btcvault-opal.vercel.app) | **Track:** Bitcoin — [Re{define} Hackathon](https://dorahacks.io/hackathon/redefine)

---

## Architecture

```
                         ┌──────────────────────────────────┐
                         │           BTCVault                │
User ── WBTC ──────────► │  ERC-4626 on Starknet Mainnet    │
User ◄── WBTC ────────── │  Share-based accounting (1e18)   │
                         └──────────┬───────────┬───────────┘
                                    │           │
                              60%   │           │   40%
                                    ▼           ▼
                         ┌──────────────┐ ┌──────────────┐
                         │ Vesu Strategy│ │Ekubo Strategy│
                         │ Lending yield│ │   LP fees    │
                         └──────────────┘ └──────────────┘
                                    │           │
                                    └─────┬─────┘
                                          ▼
                                   ┌────────────┐
                                   │   Router   │
                                   │ Rebalances │
                                   │ if APY Δ   │
                                   │   > 10%    │
                                   └────────────┘
```

## Contracts (Starknet Mainnet)

| Contract | Address | Explorer |
|---|---|---|
| BTCVault | `0x0363caa24d01b...7d156f51` | [Starkscan](https://starkscan.co/contract/0x363caa24d01b66327a26426e69c7f1feaf41c170a7e9e74ab0d6b4b7d156f51) |
| VesuStrategy | `0x06d97a47825...fb125d37a8176` | [Starkscan](https://starkscan.co/contract/0x6d97a47825783883bb9f714bf0994edbdf612454dd5ebe8468fb125d37a8176) |
| EkuboStrategy | `0x06e2d08860...c941ccd2433d` | [Starkscan](https://starkscan.co/contract/0x6e2d088601e64a29ddaa56312cb079f209b37b7123ab8c56a35c941ccd2433d) |
| Router | `0x046aeabf2ec...ea66457524de3` | [Starkscan](https://starkscan.co/contract/0x46aeabf2ece1a737da603e768c75a44167693e6bb0d9bb5f5ef16713836938d) |

## How It Works

1. **Deposit** — User deposits WBTC (min 100 sats). The vault mints proportional shares following the ERC-4626 standard.
2. **Allocate** — Deposits are split between Vesu (60%) and Ekubo (40%) strategies to generate yield.
3. **Rebalance** — The Router monitors APY from both strategies. When the delta exceeds 10%, it auto-rebalances to maximize returns.
4. **Withdraw** — User burns vault shares and receives WBTC proportional to their share of total vault assets.

### Share Math

```
First deposit:   shares = assets × 1e18
Subsequent:      shares = (assets × total_shares) / total_assets
Withdrawal:      assets = (shares × total_assets) / total_shares
```

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Cairo, OpenZeppelin for Cairo, Scarb, Starknet Foundry |
| Frontend | Next.js 15, React 18, Scaffold-Stark 2 |
| Chain Interaction | starknet-react v5, starknet.js |
| Styling | TailwindCSS, daisyUI |
| Deployment | Vercel (frontend), Starknet Mainnet (contracts) |

## DeFi Integrations

- **[Vesu V2](https://vesu.xyz)** — Lending protocol. WBTC deposited via vToken (ERC-4626 compatible) earns lending yield.
- **[Ekubo](https://ekubo.org)** — Leading Starknet DEX. WBTC liquidity provided to earn trading fees.

## Project Structure

```
BTCVault/
├── packages/
│   ├── nextjs/                       # Frontend
│   │   ├── app/
│   │   │   ├── vault/page.tsx        # Deposit/withdraw UI
│   │   │   └── dashboard/page.tsx    # Vault overview & metrics
│   │   └── contracts/
│   │       └── deployedContracts.ts  # ABIs & mainnet addresses
│   │
│   └── snfoundry/                    # Smart contracts
│       └── contracts/src/
│           ├── btc_vault.cairo       # Main ERC-4626 vault
│           ├── vesu_strategy.cairo   # Vesu lending integration
│           ├── ekubo_strategy.cairo  # Ekubo LP integration
│           ├── router.cairo          # APY-based rebalancer
│           └── interfaces.cairo      # IBTCVault, IStrategy, IRouter, IERC20, IVToken
```

## Local Development

```bash
# Install dependencies
yarn install

# Run frontend (localhost:3000)
cd packages/nextjs && yarn dev

# Compile Cairo contracts
cd packages/snfoundry/contracts && scarb build

# Run tests
snforge test
```

## Contract Interface

```cairo
#[starknet::interface]
trait IBTCVault<TState> {
    fn deposit(ref self: TState, assets: u256) -> u256;      // Deposit WBTC, get shares
    fn withdraw(ref self: TState, shares: u256) -> u256;     // Burn shares, get WBTC
    fn total_assets(self: @TState) -> u256;                  // Total WBTC in vault
    fn total_shares(self: @TState) -> u256;                  // Total shares minted
    fn shares_of(self: @TState, account: ContractAddress) -> u256;
    fn get_vault_apy(self: @TState) -> u256;                 // Weighted avg APY
    fn get_allocation(self: @TState) -> (u256, u256);        // (vesu%, ekubo%)
    fn rebalance(ref self: TState);                          // Trigger rebalance
    fn harvest_and_compound(ref self: TState);               // Reinvest yield
}
```

## License

MIT
