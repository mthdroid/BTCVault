"use client";

import Link from "next/link";
import Image from "next/image";
import { useAccount } from "@starknet-react/core";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";

const Home = () => {
  const { status } = useAccount();
  const isConnected = status === "connected";

  return (
    <div className="flex items-center flex-col grow">
      {/* Hero Section */}
      <div className="w-full py-20 px-5 text-center relative overflow-hidden">
        {/* Dual glow: orange left + blue right */}
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(ellipse_at_top_left,_#F7931A_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(ellipse_at_top_right,_#5B8DEF_0%,_transparent_50%)]"></div>
        <div className="relative max-w-2xl mx-auto">
          {/* Powered by Starknet badge */}
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20">
            <Image src="/starknet-logo.svg" alt="Starknet" width={18} height={18} />
            <span className="text-sm font-medium" style={{ color: "#5B8DEF" }}>Live on Starknet Mainnet</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="text-primary">BTC</span>Vault
          </h1>
          <p className="text-lg opacity-70 mb-2">
            Non-custodial Bitcoin yield on <span style={{ color: "#5B8DEF" }}>Starknet</span>
          </p>
          <p className="text-sm opacity-40 mb-10 max-w-lg mx-auto">
            Bridge your BTC via Xverse, earn optimized yield through automated
            allocation between Vesu lending and Ekubo LP strategies.
          </p>

          {!isConnected ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm opacity-50">Connect your wallet to get started</p>
              <CustomConnectButton />
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/bridge" className="btn btn-primary btn-lg text-white shadow-lg shadow-primary/20">
                Bridge BTC
              </Link>
              <Link href="/vault" className="btn btn-outline border-primary/50 text-primary hover:bg-primary hover:text-white btn-lg">
                Enter Vault
              </Link>
              <Link href="/dashboard" className="btn btn-ghost btn-lg opacity-70">
                Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-container grow w-full px-8 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">How it works</h2>
          <p className="text-center text-sm opacity-40 mb-10">From native BTC to DeFi yield in 4 steps</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { step: "1", title: "Connect Xverse", desc: "Connect your Xverse wallet to get both BTC and Starknet addresses in one click.", color: "bg-primary" },
              { step: "2", title: "Bridge BTC", desc: "Bridge native BTC to WBTC on Starknet via LayerSwap.", color: "bg-primary" },
              { step: "3", title: "Deposit WBTC", desc: "Deposit into the vault. The Router auto-allocates between Vesu and Ekubo.", color: "bg-accent" },
              { step: "4", title: "Earn Yield", desc: "Shares appreciate as yield accrues. Withdraw anytime to get WBTC + earned yield.", color: "bg-accent" },
            ].map((item) => (
              <div key={item.step} className="card-btc flex flex-col text-center items-center">
                <div className={`w-10 h-10 rounded-full ${item.color} text-white flex items-center justify-center text-lg font-bold mb-4`}>
                  {item.step}
                </div>
                <h3 className="font-bold text-base mb-2">{item.title}</h3>
                <p className="text-sm opacity-50">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strategies */}
        <div className="max-w-4xl mx-auto mt-20">
          <h2 className="text-2xl font-bold text-center mb-2">Dual Strategy Engine</h2>
          <p className="text-center text-sm opacity-40 mb-10">Automated yield optimization across two protocols</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-btc">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <span className="text-primary font-bold">V</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Vesu Lending</h3>
                  <p className="text-xs opacity-40">Low risk — Passive yield</p>
                </div>
              </div>
              <p className="text-sm opacity-50 mb-5">
                Deposit WBTC into Vesu V2 vToken pools (ERC-4626).
                Earn passive lending yield with auto-compounding.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="opacity-40">Type</span>
                  <span className="font-medium">Lending / Supply</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-40">Risk</span>
                  <span className="font-medium text-success">Low</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-40">Allocation</span>
                  <span className="font-medium text-primary">60%</span>
                </div>
              </div>
            </div>
            <div className="card-starknet">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                  <span className="text-accent font-bold">E</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Ekubo LP</h3>
                  <p className="text-xs opacity-40">Medium risk — Active yield</p>
                </div>
              </div>
              <p className="text-sm opacity-50 mb-5">
                Provide concentrated liquidity in WBTC pairs on Ekubo DEX.
                Higher yield potential with active management.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="opacity-40">Type</span>
                  <span className="font-medium">Liquidity Provision</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-40">Risk</span>
                  <span className="font-medium text-warning">Medium</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-40">Allocation</span>
                  <span className="font-medium text-accent">40%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Powered By Section */}
        <div className="max-w-4xl mx-auto mt-20">
          <h2 className="text-2xl font-bold text-center mb-10">Powered By</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="https://starknet.io" target="_blank" rel="noreferrer" className="card-starknet flex flex-col items-center justify-center py-6 hover:shadow-lg transition-shadow">
              <Image src="/starknet-logo.svg" alt="Starknet" width={40} height={40} className="mb-3" />
              <span className="font-semibold text-sm">Starknet</span>
              <span className="text-xs opacity-30 mt-1">L2 Network</span>
            </a>
            <a href="https://www.xverse.app" target="_blank" rel="noreferrer" className="card-btc flex flex-col items-center justify-center py-6 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 bg-[#1a1a2e] rounded-lg flex items-center justify-center mb-3">
                <Image src="/xverse-logo.svg" alt="Xverse" width={28} height={28} />
              </div>
              <span className="font-semibold text-sm">Xverse</span>
              <span className="text-xs opacity-30 mt-1">BTC Wallet</span>
            </a>
            <a href="https://vesu.xyz" target="_blank" rel="noreferrer" className="card-btc flex flex-col items-center justify-center py-6 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-3">
                <span className="text-primary font-bold text-lg">V</span>
              </div>
              <span className="font-semibold text-sm">Vesu</span>
              <span className="text-xs opacity-30 mt-1">Lending Protocol</span>
            </a>
            <a href="https://ekubo.org" target="_blank" rel="noreferrer" className="card-starknet flex flex-col items-center justify-center py-6 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center mb-3">
                <span className="text-accent font-bold text-lg">E</span>
              </div>
              <span className="font-semibold text-sm">Ekubo</span>
              <span className="text-xs opacity-30 mt-1">DEX Protocol</span>
            </a>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="max-w-3xl mx-auto mt-20 text-center">
          <h2 className="text-2xl font-bold mb-6">Built With</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { name: "Starknet", type: "blue" },
              { name: "Cairo", type: "blue" },
              { name: "Vesu V2", type: "orange" },
              { name: "Ekubo", type: "blue" },
              { name: "Xverse", type: "orange" },
              { name: "Scaffold-Stark", type: "blue" },
              { name: "Next.js", type: "neutral" },
            ].map((tech) => (
              <span
                key={tech.name}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border ${
                  tech.type === "blue"
                    ? "bg-accent/5 border-accent/20 text-accent"
                    : tech.type === "orange"
                    ? "bg-primary/5 border-primary/20 text-primary"
                    : "bg-base-100 border-base-300/50 opacity-70"
                }`}
              >
                {tech.name}
              </span>
            ))}
          </div>
          <p className="text-xs opacity-30 mt-8">
            4 smart contracts deployed on Starknet Mainnet | 22 tests passing
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
