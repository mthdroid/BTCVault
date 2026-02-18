"use client";

import Image from "next/image";
import { useAccount } from "@starknet-react/core";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

const CONTRACTS = {
  WBTC: "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac",
  WBTC_vToken:
    "0x06b0ef784eb49c85f4d9447f30d7f7212be65ce1e553c18d516c87131e81dbd6",
  BTCVault: "0x363caa24d01b66327a26426e69c7f1feaf41c170a7e9e74ab0d6b4b7d156f51",
  VesuStrategy:
    "0x6d97a47825783883bb9f714bf0994edbdf612454dd5ebe8468fb125d37a8176",
  EkuboStrategy:
    "0x6e2d088601e64a29ddaa56312cb079f209b37b7123ab8c56a35c941ccd2433d",
  Router: "0x46aeabf2ece1a737da603e768c75a44167693e6bb0d9bb5f5ef16713836938d",
};

const DashboardPage = () => {
  const { address, status } = useAccount();
  const isConnected = status === "connected";

  const { data: totalAssets } = useScaffoldReadContract({
    contractName: "BTCVault",
    functionName: "total_assets",
  });
  const { data: totalShares } = useScaffoldReadContract({
    contractName: "BTCVault",
    functionName: "total_shares",
  });
  const { data: vaultApy } = useScaffoldReadContract({
    contractName: "BTCVault",
    functionName: "get_vault_apy",
  });
  const { data: allocation } = useScaffoldReadContract({
    contractName: "BTCVault",
    functionName: "get_allocation",
  });
  const { data: userShares } = useScaffoldReadContract({
    contractName: "BTCVault",
    functionName: "shares_of",
    args: [address ?? "0x0"],
  });

  const tvl = totalAssets ? totalAssets.toString() : "0";
  const apyBps = vaultApy ? Number(vaultApy) : 0;
  const vaultApyStr = (apyBps / 100).toFixed(2);
  const vesuAPY = "3.50";
  const ekuboAPY = "5.20";

  let vesuAlloc = 60,
    ekuboAlloc = 40;
  if (allocation) {
    const alloc = allocation as unknown as [bigint, bigint];
    if (Array.isArray(alloc) && alloc.length === 2) {
      vesuAlloc = Number(alloc[0]) / 100;
      ekuboAlloc = Number(alloc[1]) / 100;
    }
  }

  const userSharesStr = userShares ? userShares.toString() : "0";
  const userAssetsStr =
    userShares &&
    totalShares &&
    totalAssets &&
    BigInt(totalShares.toString()) > 0n
      ? (
          (BigInt(userShares.toString()) * BigInt(totalAssets.toString())) /
          BigInt(totalShares.toString())
        ).toString()
      : "0";

  const tvlNum = totalAssets ? Number(totalAssets) : 0;
  const vesuBalance = Math.floor((tvlNum * vesuAlloc) / 100).toString();
  const ekuboBalance = Math.floor((tvlNum * ekuboAlloc) / 100).toString();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center grow pt-20">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <p className="opacity-50 mb-6 text-sm">
          Connect your wallet to view the dashboard
        </p>
        <CustomConnectButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center grow pt-10 px-4">
      <div className="max-w-5xl w-full">
        <h1 className="text-3xl font-bold mb-1">
          <span className="text-primary">BTC</span>Vault Dashboard
        </h1>
        <p className="opacity-40 text-sm mb-8">
          Vault overview and strategy performance on{" "}
          <span style={{ color: "#5B8DEF" }}>Starknet</span>
        </p>

        {/* Top Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "TVL", value: tvl, unit: "sats" },
            {
              label: "Vault APY",
              value: `${vaultApyStr}%`,
              color: "text-success",
            },
            { label: "Vesu APY", value: `${vesuAPY}%` },
            { label: "Ekubo APY", value: `${ekuboAPY}%` },
          ].map((stat) => (
            <div key={stat.label} className="card-btc !p-5">
              <p className="text-xs opacity-40 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color || ""}`}>
                {stat.value}
              </p>
              {stat.unit && <p className="text-xs opacity-30">{stat.unit}</p>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Strategy Allocation */}
          <div className="card-btc">
            <h2 className="font-bold text-base mb-4">Strategy Allocation</h2>
            <div className="flex rounded-full overflow-hidden h-5 mb-4 bg-base-300">
              <div
                className="bg-primary flex items-center justify-center text-[10px] text-white font-bold"
                style={{ width: `${vesuAlloc}%` }}
              >
                {vesuAlloc}%
              </div>
              <div
                className="bg-accent flex items-center justify-center text-[10px] text-white font-bold"
                style={{ width: `${ekuboAlloc}%` }}
              >
                {ekuboAlloc}%
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Image
                    src="/vesu-logo.svg"
                    alt="Vesu"
                    width={20}
                    height={20}
                    className="rounded"
                  />
                  <span className="text-sm">Vesu Lending</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{vesuBalance} sats</p>
                  <p className="text-xs opacity-30">APY: {vesuAPY}%</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Image
                    src="/ekubo-logo.svg"
                    alt="Ekubo"
                    width={20}
                    height={20}
                    className="rounded"
                  />
                  <span className="text-sm">Ekubo LP</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{ekuboBalance} sats</p>
                  <p className="text-xs opacity-30">APY: {ekuboAPY}%</p>
                </div>
              </div>
            </div>
            <div className="border-t border-base-300 mt-4 pt-3 flex justify-between text-xs opacity-30">
              <span>Rebalance threshold</span>
              <span>10%</span>
            </div>
          </div>

          {/* Your Position */}
          <div className="card-btc">
            <h2 className="font-bold text-base mb-4">Your Position</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="opacity-40 text-sm">Vault Shares</span>
                <span className="font-semibold">{userSharesStr}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-40 text-sm">Current Value</span>
                <span className="font-semibold">{userAssetsStr} sats</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-40 text-sm">Total Vault Shares</span>
                <span className="font-semibold">
                  {totalShares ? totalShares.toString() : "0"}
                </span>
              </div>
            </div>
            <div className="border-t border-base-300 mt-4 pt-3">
              <p className="text-xs opacity-25 text-center font-mono">
                {address
                  ? `${address.slice(0, 8)}...${address.slice(-6)}`
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Architecture */}
        <div className="card-btc mb-6">
          <h2 className="font-bold text-base mb-5">Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 w-full items-center text-center text-sm">
            <div className="bg-base-200 rounded-xl p-4 border border-base-300/50">
              <p className="font-bold">User</p>
              <p className="text-xs opacity-30">WBTC deposits</p>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-primary font-bold text-xl">&rarr;</span>
            </div>
            <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
              <p className="font-bold text-primary">BTCVault</p>
              <p className="text-xs opacity-30">
                ERC-4626 on <span style={{ color: "#5B8DEF" }}>Starknet</span>
              </p>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-primary font-bold text-xl">&rarr;</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                <p className="font-bold text-xs">Vesu Strategy</p>
                <p className="text-xs opacity-30">Lending yield</p>
              </div>
              <div className="bg-accent/10 rounded-xl p-3 border border-accent/20">
                <p className="font-bold text-xs text-accent">Ekubo Strategy</p>
                <p className="text-xs opacity-30">LP fees</p>
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs opacity-25 text-center">
            Router contract auto-rebalances between strategies based on APY
            advantage (&gt;10%)
          </div>
        </div>

        {/* Contract Addresses */}
        <div className="card-btc mb-8">
          <h2 className="font-bold text-base mb-4">
            Contracts on{" "}
            <span style={{ color: "#5B8DEF" }}>Starknet Mainnet</span>
          </h2>
          <div className="space-y-2.5">
            {Object.entries(CONTRACTS).map(([name, addr]) => (
              <div key={name} className="flex justify-between items-center">
                <span className="text-sm opacity-40">{name}</span>
                <a
                  href={`https://starkscan.co/contract/${addr}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-primary hover:underline"
                >
                  {addr.slice(0, 10)}...{addr.slice(-6)}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
