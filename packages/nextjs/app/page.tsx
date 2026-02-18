"use client";

import Link from "next/link";
import { useAccount } from "@starknet-react/core";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";

const Home = () => {
  const { status } = useAccount();
  const isConnected = status === "connected";

  return (
    <div className="flex items-center flex-col grow">
      {/* Hero Section */}
      <div className="w-full py-20 px-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-primary text-sm font-medium">Live on Starknet Mainnet</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="text-primary">BTC</span>Vault
          </h1>
          <p className="text-lg opacity-70 mb-2">
            Non-custodial Bitcoin yield on Starknet
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
          <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { step: "1", title: "Connect Xverse", desc: "Connect your Xverse wallet to get both BTC and Starknet addresses in one click." },
              { step: "2", title: "Bridge BTC", desc: "Bridge native BTC to WBTC on Starknet via LayerSwap." },
              { step: "3", title: "Deposit WBTC", desc: "Deposit into the vault. The Router auto-allocates between Vesu and Ekubo." },
              { step: "4", title: "Earn Yield", desc: "Shares appreciate as yield accrues. Withdraw anytime to get WBTC + earned yield." },
            ].map((item) => (
              <div key={item.step} className="card-btc flex flex-col text-center items-center">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold mb-4">
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
          <h2 className="text-2xl font-bold text-center mb-10">Strategies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-btc">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <span className="text-primary font-bold">V</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Vesu Lending</h3>
                  <p className="text-xs opacity-40">Low risk</p>
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
            <div className="card-btc">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                  <span className="text-accent font-bold">E</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Ekubo LP</h3>
                  <p className="text-xs opacity-40">Medium risk</p>
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

        {/* Tech Stack */}
        <div className="max-w-3xl mx-auto mt-20 text-center">
          <h2 className="text-2xl font-bold mb-6">Built On</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {["Starknet", "Cairo", "Vesu V2", "Ekubo", "Xverse", "Scaffold-Stark", "Next.js"].map((tech) => (
              <span key={tech} className="px-4 py-1.5 rounded-full text-sm font-medium bg-base-100 border border-primary/10 opacity-70">{tech}</span>
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
