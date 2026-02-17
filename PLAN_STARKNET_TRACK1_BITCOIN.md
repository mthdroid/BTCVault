# TRACK 1 - BITCOIN (mthdroid) | BTCVault
> Priority: PREMIER | Prize: $9,675 STRK + $5,500 Xverse in-kind = $15,175
> Timeline: J1-J6 (17-22 fev) | Deadline: 28 fev 23:59 UTC

---

## CONCEPT

**BTCVault** - Un vault non-custodial qui bridge du BTC vers Starknet via Xverse, le deploie automatiquement dans des strategies de yield DeFi (Vesu lending + Ekubo LP), avec rotation de strategie selon l'APY - le tout sans intervention humaine.

**Pitch 1 phrase:** "Bridge your Bitcoin, earn yield on Starknet DeFi, withdraw back to BTC - fully automated, fully non-custodial."

---

## ARCHITECTURE

```
BITCOIN (Xverse Wallet)
       |
  [StarkGate Bridge / LayerSwap]
       |
  WBTC on Starknet
       |
  BTCVault.cairo (Master Contract)
       |
       +---> VesuStrategy.cairo        (Lending - earn interest)
       |       |-- deposit() via ERC-4626 vToken
       |       |-- withdraw() + compound
       |
       +---> EkuboStrategy.cairo       (LP - earn swap fees)
       |       |-- mint_position() concentrated liquidity
       |       |-- collect_fees() + reinvest
       |
       +---> Router.cairo              (Strategy allocation)
               |-- get_best_apy() compare Vesu vs Ekubo
               |-- rebalance() shift funds
               |-- keeper incentive pour trigger auto

FRONTEND (Next.js + starknet.js + Sats Connect)
       |-- Connect Xverse wallet
       |-- Bridge flow (LayerSwap widget embed)
       |-- Deposit/Withdraw vault
       |-- Dashboard: yield tracking, APY, positions
```

---

## CONTRACTS CAIRO - SPEC DETAILLEE

### 1. `btc_vault.cairo` - Master Vault

```
#[starknet::contract]
mod BTCVault {
    // ERC-4626 vault pattern
    // Underlying asset: WBTC on Starknet

    // Storage
    - total_assets: u256
    - total_shares: u256
    - user_shares: Map<ContractAddress, u256>
    - vesu_allocation: u256      // % alloue a Vesu (0-100)
    - ekubo_allocation: u256     // % alloue a Ekubo (0-100)
    - vesu_strategy: ContractAddress
    - ekubo_strategy: ContractAddress
    - router: ContractAddress

    // Functions
    fn deposit(assets: u256) -> u256           // deposit WBTC, receive shares
    fn withdraw(shares: u256) -> u256          // burn shares, receive WBTC
    fn total_assets() -> u256                  // total WBTC under management
    fn preview_deposit(assets: u256) -> u256   // simulate shares received
    fn preview_withdraw(shares: u256) -> u256  // simulate WBTC received
    fn harvest_and_compound()                  // collect all yield, reinvest
    fn rebalance()                             // call router to shift allocation
}
```

### 2. `vesu_strategy.cairo` - Lending Strategy

```
mod VesuStrategy {
    // Integration avec Vesu V2 via ERC-4626 vTokens

    // Contracts Vesu (Mainnet)
    const POOL_FACTORY: felt252 = 0x3760f903a37948f97302736f89ce30290e45f441559325026842b7a6fb388c0;
    const VESU_ORACLE: felt252 = 0xfe4bfb1b353ba51eb34dff963017f94af5a5cf8bdf3dfc191c504657f3c05;

    // Pool cible: Re7 xBTC
    const XBTC_POOL: felt252 = 0x3a8416bf20d036df5b1cf3447630a2e1cb04685f6b0c3d3e016da754d7a135;

    // Functions
    fn deposit(amount: u256)
        // 1. Approve WBTC to vToken contract
        // 2. Call vToken.deposit(amount, self_address) -> shares
        // Vesu interface: fn deposit(assets: u256, receiver: ContractAddress) -> u256

    fn withdraw(amount: u256)
        // 1. Call vToken.withdraw(amount, vault_address, self_address) -> shares_burned
        // Vesu interface: fn withdraw(assets: u256, receiver: ContractAddress, owner: ContractAddress) -> u256

    fn get_balance() -> u256
        // Read vToken balance, convert to underlying via exchange rate

    fn get_apy() -> u256
        // Read current supply APY from Vesu oracle/pool

    fn compound()
        // Harvest any additional rewards (STRK from DeFi Spring)
        // Swap to WBTC and re-deposit
}
```

### 3. `ekubo_strategy.cairo` - LP Strategy

```
mod EkuboStrategy {
    // Integration avec Ekubo concentrated liquidity
    // Pair: WBTC/USDC ou WBTC/ETH

    // Functions
    fn deposit(amount: u256)
        // 1. Split WBTC: 50% keep, 50% swap to pair token via Ekubo
        // 2. mint_position() avec range autour du prix actuel
        // 3. Store position NFT ID

    fn withdraw(amount: u256)
        // 1. burn_position() ou decrease_liquidity()
        // 2. Collect tokens
        // 3. Swap pair token back to WBTC
        // 4. Return WBTC to vault

    fn collect_fees() -> u256
        // Collect accrued swap fees from position
        // Return fees in WBTC equivalent

    fn get_apy() -> u256
        // Estimate APY from recent fee accrual rate

    fn reposition(new_lower: u256, new_upper: u256)
        // Remove liquidity, re-add with new range
        // For when price moves out of range
}
```

### 4. `router.cairo` - Strategy Rotation

```
mod Router {
    // Compare APY between strategies, decide allocation

    fn get_allocation() -> (u256, u256)
        // Returns (vesu_pct, ekubo_pct)
        // Logic:
        //   - If vesu_apy > ekubo_apy * 1.1 -> shift to vesu
        //   - If ekubo_apy > vesu_apy * 1.1 -> shift to ekubo
        //   - Otherwise keep current allocation
        //   - Min 20% in each strategy (diversification)

    fn should_rebalance() -> bool
        // True if allocation drift > 10% from target

    fn rebalance()
        // 1. Withdraw from over-allocated strategy
        // 2. Deposit into under-allocated strategy
        // Anyone can call (incentivized keeper pattern)

    fn keeper_reward() -> u256
        // Small WBTC reward for calling rebalance()
        // Funded from yield
}
```

---

## FRONTEND - PAGES

### Page 1: Landing / Connect
- Hero: "Earn yield on your Bitcoin. Zero effort."
- Connect Xverse Wallet via Sats Connect SDK
- Show: supported assets, current vault APY, TVL

### Page 2: Bridge + Deposit
- Embed LayerSwap widget pour bridge BTC -> Starknet WBTC
- Input: montant a deposer
- Display: shares recues, APY estime
- Button: "Deposit & Earn"

### Page 3: Dashboard
- Votre position: WBTC deposite, shares, valeur actuelle
- Yield accumule: graphique temps reel
- Allocation: pie chart Vesu vs Ekubo
- APY live: Vesu APY | Ekubo APY | Vault APY composite
- Historique: transactions, rebalances, compounds

### Page 4: Withdraw
- Input: montant ou "Max"
- Preview: WBTC recus apres fees
- Option: "Withdraw to Starknet" ou "Bridge back to BTC"

---

## TIMELINE DETAILLEE

### Jour 1 (17 fev) - Setup + Vault Core
- [ ] Creer repo GitHub (compte mthdroid)
- [ ] Init Scaffold-Stark projet
- [ ] Ecrire `btc_vault.cairo` - deposit/withdraw/shares (ERC-4626 pattern)
- [ ] Tests unitaires vault basique
- [ ] Configurer Starknet Sepolia deployment

### Jour 2 (18 fev) - Vesu Integration
- [ ] Etudier les interfaces Vesu vToken (ERC-4626)
- [ ] Ecrire `vesu_strategy.cairo` - deposit/withdraw dans Vesu
- [ ] Tester sur Sepolia: deposit WBTC -> vToken mint -> check balance
- [ ] Implementer compound() basique

### Jour 3 (19 fev) - Ekubo Integration
- [ ] Etudier Ekubo contracts et interface LP
- [ ] Ecrire `ekubo_strategy.cairo` - add/remove liquidity + collect fees
- [ ] Tester sur Sepolia: add liquidity -> position NFT -> collect fees
- [ ] Gerer le edge case: price out of range

### Jour 4 (20 fev) - Router + Integration
- [ ] Ecrire `router.cairo` - APY comparison + allocation logic
- [ ] Integrer router dans btc_vault.cairo
- [ ] Test end-to-end: deposit -> allocate -> compound -> rebalance -> withdraw
- [ ] Deploy version complete sur Sepolia
- [ ] Keeper incentive mechanism

### Jour 5 (21 fev) - Frontend
- [ ] Setup Next.js avec starknet.js + Sats Connect
- [ ] Page Connect (Xverse wallet)
- [ ] Page Deposit (avec LayerSwap embed si possible, sinon lien)
- [ ] Page Dashboard (positions, APY, allocation chart)
- [ ] Page Withdraw
- [ ] Deploy sur Vercel (compte mthdroid)

### Jour 6 (22 fev) - Polish + Buffer
- [ ] Fix bugs, edge cases
- [ ] UI polish, responsive
- [ ] Security review rapide
- [ ] Preparer assets pour la video demo

---

## XVERSE INTEGRATION SPECIFIQUE

```javascript
// Sats Connect - Connect Xverse Wallet
import { connect } from "@xverse/sats-connect";

const response = await connect({
  purposes: ['starknet', 'payment'],  // Request both BTC + Starknet
  message: 'Connect to BTCVault'
});

// response.addresses contient:
// - starknet address (pour interagir avec les contracts)
// - payment address (pour le bridge BTC)
```

Le bridge BTC -> Starknet se fait via:
1. **StarkGate** (bridge officiel Starknet) - plus sur mais plus lent
2. **LayerSwap** - plus rapide, bonne UX, widget embeddable
3. **Xverse in-app bridge** - directement dans le wallet

**Recommandation:** Utiliser LayerSwap widget embed pour le MVP, mentionner Xverse bridge comme alternative.

---

## VESU INTEGRATION SPECIFIQUE

```cairo
// Interface ERC-4626 de Vesu vToken
#[starknet::interface]
trait IVToken<TState> {
    fn deposit(ref self: TState, assets: u256, receiver: ContractAddress) -> u256;
    fn withdraw(ref self: TState, assets: u256, receiver: ContractAddress, owner: ContractAddress) -> u256;
    fn total_assets(self: @TState) -> u256;
    fn convert_to_shares(self: @TState, assets: u256) -> u256;
    fn convert_to_assets(self: @TState, shares: u256) -> u256;
}

// Avant deposit: approve WBTC to vToken address
// Pool cible: Re7 xBTC pool
// vToken address: recuperer via PoolFactory.get_vtoken(pool_id, wbtc_address)
```

---

## CRITERES DE VICTOIRE BITCOIN TRACK

| Ce que les juges veulent | Comment on repond |
|---|---|
| Integration Xverse | Sats Connect wallet + mention bridge Xverse |
| BTC-native DeFi | Vault accepts BTC, yields in BTC terms |
| Starknet DeFi ecosystem | Vesu + Ekubo = 2 protocoles majeurs integres |
| Innovation | Strategy rotation auto, keeper pattern |
| Working product | Deploy Sepolia + frontend Vercel |
| Video demo | 3 min: connect wallet -> bridge -> deposit -> see yield -> withdraw |
