"use client";

import Link from "next/link";
import { useAccount } from "@starknet-react/core";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";

const Home = () => {
  const { status } = useAccount();
  const isConnected = status === "connected";

  return (
    <div className="flex items-center flex-col grow pt-10">
      <div className="px-5 max-w-3xl text-center">
        <h1 className="text-5xl font-bold mb-4">
          <span className="text-primary">BTC</span>Vault
        </h1>
        <p className="text-xl opacity-80 mb-2">
          Non-custodial Bitcoin yield on Starknet
        </p>
        <p className="text-base opacity-50 mb-8 max-w-xl mx-auto">
          Bridge your BTC via Xverse, earn optimized yield through automated
          allocation between Vesu lending and Ekubo LP strategies.
        </p>

        {!isConnected ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm opacity-60">Connect your wallet to get started</p>
            <CustomConnectButton />
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/bridge" className="btn btn-primary btn-lg text-white">
              Bridge BTC
            </Link>
            <Link href="/vault" className="btn btn-outline border-primary text-primary hover:bg-primary hover:text-white btn-lg">
              Enter Vault
            </Link>
            <Link href="/dashboard" className="btn btn-ghost btn-lg">
              Dashboard
            </Link>
          </div>
        )}
      </div>

      <div className="bg-container grow w-full mt-16 px-8 py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { step: "1", title: "Connect Xverse", desc: "Connect your Xverse wallet to get both BTC and Starknet addresses in one click." },
              { step: "2", title: "Bridge BTC", desc: "Bridge native BTC to WBTC on Starknet via LayerSwap." },
              { step: "3", title: "Deposit WBTC", desc: "Deposit into the vault. The Router auto-allocates between Vesu and Ekubo." },
              { step: "4", title: "Earn Yield", desc: "Shares appreciate as yield accrues. Withdraw anytime to get WBTC + earned yield." },
            ].map((item) => (
              <div key={item.step} className="flex flex-col bg-base-100 px-6 py-8 text-center items-center rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm opacity-60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Strategies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-base-100 rounded-2xl shadow-sm p-8 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">V</span>
                </div>
                <h3 className="font-bold text-xl">Vesu Lending</h3>
              </div>
              <p className="text-sm opacity-60 mb-4">
                Deposit WBTC into Vesu V2 vToken pools (ERC-4626).
                Earn passive lending yield with auto-compounding.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="opacity-50">Type</span>
                  <span className="font-medium">Lending / Supply</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-50">Risk</span>
                  <span className="font-medium text-success">Low</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-50">Allocation</span>
                  <span className="font-medium text-primary">60%</span>
                </div>
              </div>
            </div>
            <div className="bg-base-100 rounded-2xl shadow-sm p-8 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-accent font-bold text-sm">E</span>
                </div>
                <h3 className="font-bold text-xl">Ekubo LP</h3>
              </div>
              <p className="text-sm opacity-60 mb-4">
                Provide concentrated liquidity in WBTC pairs on Ekubo DEX.
                Higher yield potential with active management.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="opacity-50">Type</span>
                  <span className="font-medium">Liquidity Provision</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-50">Risk</span>
                  <span className="font-medium text-warning">Medium</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-50">Allocation</span>
                  <span className="font-medium text-accent">40%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="max-w-3xl mx-auto mt-16 text-center">
          <h2 className="text-2xl font-bold mb-6">Built On</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {["Starknet", "Cairo", "Vesu V2", "Ekubo", "Xverse", "Scaffold-Stark", "Next.js"].map((tech) => (
              <span key={tech} className="px-4 py-1.5 rounded-full text-sm font-medium bg-base-100 shadow-sm opacity-80">{tech}</span>
            ))}
          </div>
          <p className="text-xs opacity-40 mt-6">
            4 smart contracts deployed on Starknet Mainnet | 22 tests passing
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
