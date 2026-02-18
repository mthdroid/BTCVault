# BTCVault Demo Video Script (~3 minutes)

## Intro (30s)
- "BTCVault is a non-custodial Bitcoin yield vault on Starknet"
- "It automatically allocates your WBTC between two DeFi strategies - Vesu lending and Ekubo LP - to maximize yield"
- Show the landing page (Home) with the 4-step flow

## Connect Wallet (20s)
- Click "Connect Xverse" on Bridge page
- Show Xverse wallet popup connecting both BTC and Starknet addresses
- Also show connecting Braavos/ArgentX as alternative Starknet wallet

## Bridge Flow (30s)
- Navigate to /bridge
- Show Step 1: both wallets connected
- Show Step 2: Click "Bridge via LayerSwap" - opens LayerSwap with BTC→Starknet pre-filled
- Explain: "Users bridge native BTC to WBTC on Starknet through LayerSwap"

## Deposit (40s)
- Navigate to /vault
- Show vault stats: Total Assets, APY, allocation bar (60% Vesu / 40% Ekubo)
- Enter deposit amount (e.g., 100 sats)
- Click "Deposit WBTC" - triggers multicall: WBTC.approve + BTCVault.deposit
- Show wallet confirmation popup
- "Deposits are split automatically: 60% to Vesu lending, 40% to Ekubo LP"

## Dashboard (30s)
- Navigate to /dashboard
- Show live on-chain data: TVL, Vault APY, strategy allocation breakdown
- Show your position: shares, current value
- Show architecture diagram: User → BTCVault → Strategies
- Show clickable contract addresses on Starkscan

## Smart Contracts (20s)
- "4 Cairo contracts deployed on Starknet Mainnet"
- "BTCVault: ERC-4626 vault with share-based deposit/withdraw"
- "VesuStrategy: Lending via Vesu vToken pools"
- "EkuboStrategy: Concentrated liquidity on Ekubo DEX"
- "Router: Auto-rebalances when APY difference exceeds 10%"
- Navigate to /debug to show live contract interaction

## Closing (10s)
- "BTCVault: Bridge your Bitcoin, earn yield on Starknet DeFi, withdraw back to BTC"
- "Fully automated, fully non-custodial"
- Show GitHub repo + Vercel URL

---

## Key Points to Emphasize for Judges:
1. **Xverse Integration** - Sats Connect SDK, both BTC + Starknet addresses
2. **Real Mainnet Deployment** - 4 contracts live on Starknet Mainnet
3. **Two DeFi Protocols** - Vesu (lending) + Ekubo (LP) = ecosystem integration
4. **Auto-Rotation** - Router compares APY, rebalances automatically
5. **Working Product** - Frontend on Vercel, contracts on Mainnet, real transactions
6. **22 Tests Passing** - Full test coverage with Starknet Foundry
