"use client";

import { useAccount } from "@starknet-react/core";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";

const DashboardPage = () => {
  const { address, status } = useAccount();
  const isConnected = status === "connected";

  // Mock data - will read from contracts after deployment
  const stats = {
    tvl: "0",
    totalUsers: "0",
    vaultAPY: "4.18",
    vesuAPY: "3.50",
    ekuboAPY: "5.20",
    vesuAlloc: 60,
    ekuboAlloc: 40,
    vesuBalance: "0",
    ekuboBalance: "0",
    lastRebalance: "N/A",
    rebalanceThreshold: "10%",
  };

  const userStats = {
    shares: "0",
    depositedValue: "0",
    currentValue: "0",
    pnl: "0",
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center grow pt-20">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <p className="opacity-70 mb-6">Connect your wallet to view the dashboard</p>
        <CustomConnectButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center grow pt-10 px-4">
      <div className="max-w-5xl w-full">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="opacity-60 mb-8">
          Vault overview and strategy performance
        </p>

        {/* Top Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-base-100 rounded-2xl border border-gradient p-4">
            <p className="text-xs opacity-50 uppercase">TVL</p>
            <p className="text-2xl font-bold">{stats.tvl} sats</p>
          </div>
          <div className="bg-base-100 rounded-2xl border border-gradient p-4">
            <p className="text-xs opacity-50 uppercase">Vault APY</p>
            <p className="text-2xl font-bold text-success">{stats.vaultAPY}%</p>
          </div>
          <div className="bg-base-100 rounded-2xl border border-gradient p-4">
            <p className="text-xs opacity-50 uppercase">Vesu APY</p>
            <p className="text-2xl font-bold">{stats.vesuAPY}%</p>
          </div>
          <div className="bg-base-100 rounded-2xl border border-gradient p-4">
            <p className="text-xs opacity-50 uppercase">Ekubo APY</p>
            <p className="text-2xl font-bold">{stats.ekuboAPY}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Strategy Allocation */}
          <div className="bg-base-100 rounded-3xl border border-gradient p-6">
            <h2 className="font-bold text-lg mb-4">Strategy Allocation</h2>

            <div className="flex rounded-full overflow-hidden h-6 mb-4">
              <div
                className="bg-secondary flex items-center justify-center text-xs text-white font-bold"
                style={{ width: `${stats.vesuAlloc}%` }}
              >
                {stats.vesuAlloc}%
              </div>
              <div
                className="bg-accent flex items-center justify-center text-xs font-bold"
                style={{ width: `${stats.ekuboAlloc}%` }}
              >
                {stats.ekuboAlloc}%
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary"></div>
                  <span className="text-sm">Vesu Lending</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{stats.vesuBalance} sats</p>
                  <p className="text-xs opacity-50">APY: {stats.vesuAPY}%</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent"></div>
                  <span className="text-sm">Ekubo LP</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{stats.ekuboBalance} sats</p>
                  <p className="text-xs opacity-50">APY: {stats.ekuboAPY}%</p>
                </div>
              </div>
            </div>

            <div className="divider my-3"></div>
            <div className="flex justify-between text-xs opacity-60">
              <span>Rebalance threshold</span>
              <span>{stats.rebalanceThreshold}</span>
            </div>
            <div className="flex justify-between text-xs opacity-60">
              <span>Last rebalance</span>
              <span>{stats.lastRebalance}</span>
            </div>
          </div>

          {/* Your Position */}
          <div className="bg-base-100 rounded-3xl border border-gradient p-6">
            <h2 className="font-bold text-lg mb-4">Your Position</h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="opacity-60 text-sm">Vault Shares</span>
                <span className="font-semibold">{userStats.shares}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60 text-sm">Deposited Value</span>
                <span className="font-semibold">{userStats.depositedValue} sats</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60 text-sm">Current Value</span>
                <span className="font-semibold">{userStats.currentValue} sats</span>
              </div>
              <div className="divider my-1"></div>
              <div className="flex justify-between">
                <span className="opacity-60 text-sm">P&L</span>
                <span className={`font-bold ${parseFloat(userStats.pnl) >= 0 ? "text-success" : "text-error"}`}>
                  {parseFloat(userStats.pnl) >= 0 ? "+" : ""}{userStats.pnl} sats
                </span>
              </div>
            </div>

            <div className="divider my-3"></div>

            <p className="text-xs opacity-40 text-center">
              Wallet: {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "N/A"}
            </p>
          </div>
        </div>

        {/* Architecture */}
        <div className="bg-base-100 rounded-3xl border border-gradient p-6 mb-8">
          <h2 className="font-bold text-lg mb-4">Architecture</h2>
          <div className="flex flex-col items-center">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full items-center text-center text-sm">
              <div className="bg-base-300 rounded-xl p-4">
                <p className="font-bold">User</p>
                <p className="text-xs opacity-50">WBTC deposits</p>
              </div>
              <div className="flex items-center justify-center">
                <span className="opacity-40">-&gt;</span>
              </div>
              <div className="bg-secondary/20 rounded-xl p-4 border border-secondary">
                <p className="font-bold">BTCVault</p>
                <p className="text-xs opacity-50">ERC-4626 shares</p>
              </div>
              <div className="flex items-center justify-center">
                <span className="opacity-40">-&gt;</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="bg-secondary/10 rounded-xl p-3 border border-secondary/50">
                  <p className="font-bold text-xs">Vesu Strategy</p>
                  <p className="text-xs opacity-50">Lending yield</p>
                </div>
                <div className="bg-accent/10 rounded-xl p-3 border border-accent/50">
                  <p className="font-bold text-xs">Ekubo Strategy</p>
                  <p className="text-xs opacity-50">LP fees</p>
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs opacity-40">
              Router contract auto-rebalances between strategies based on APY advantage (&gt;10%)
            </div>
          </div>
        </div>

        {/* Contract Addresses */}
        <div className="bg-base-100 rounded-3xl border border-gradient p-6 mb-8">
          <h2 className="font-bold text-lg mb-4">Contract Addresses (Mainnet)</h2>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="opacity-60">WBTC Token</span>
              <span className="text-xs">0x03fe2b...e7ac</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">WBTC vToken (Vesu)</span>
              <span className="text-xs">0x06b0ef...1dbd6</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">BTCVault</span>
              <span className="text-xs">0x363caa...56f51</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">VesuStrategy</span>
              <span className="text-xs">0x6d97a4...a8176</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">EkuboStrategy</span>
              <span className="text-xs">0x6e2d08...2433d</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">Router</span>
              <span className="text-xs">0x46aeab...6938d</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
