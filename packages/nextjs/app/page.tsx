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
        <h1 className="text-4xl font-bold mb-4">
          BTCVault
        </h1>
        <p className="text-xl opacity-80 mb-2">
          Non-custodial Bitcoin yield on Starknet
        </p>
        <p className="text-base opacity-60 mb-8">
          Bridge your BTC via Xverse, earn optimized yield through automated
          allocation between Vesu lending and Ekubo LP strategies.
        </p>

        {!isConnected ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm opacity-70">Connect your wallet to get started</p>
            <CustomConnectButton />
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/bridge" className="btn btn-secondary btn-lg">
              Bridge BTC
            </Link>
            <Link href="/vault" className="btn btn-outline btn-lg">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex flex-col bg-base-100 relative text-sm px-6 py-8 text-center items-center rounded-3xl border border-gradient">
              <div className="trapeze"></div>
              <div className="text-3xl mb-4">1</div>
              <h3 className="font-bold text-lg mb-2">Connect Xverse</h3>
              <p className="opacity-70">
                Connect your Xverse wallet to get both BTC and Starknet addresses in one click.
              </p>
            </div>
            <div className="flex flex-col bg-base-100 relative text-sm px-6 py-8 text-center items-center rounded-3xl border border-gradient">
              <div className="trapeze"></div>
              <div className="text-3xl mb-4">2</div>
              <h3 className="font-bold text-lg mb-2">Bridge BTC</h3>
              <p className="opacity-70">
                Bridge native BTC to WBTC on Starknet via LayerSwap or StarkGate.
              </p>
            </div>
            <div className="flex flex-col bg-base-100 relative text-sm px-6 py-8 text-center items-center rounded-3xl border border-gradient">
              <div className="trapeze"></div>
              <div className="text-3xl mb-4">3</div>
              <h3 className="font-bold text-lg mb-2">Deposit WBTC</h3>
              <p className="opacity-70">
                Deposit into the vault. The Router auto-allocates between Vesu and Ekubo strategies.
              </p>
            </div>
            <div className="flex flex-col bg-base-100 relative text-sm px-6 py-8 text-center items-center rounded-3xl border border-gradient">
              <div className="trapeze"></div>
              <div className="text-3xl mb-4">4</div>
              <h3 className="font-bold text-lg mb-2">Earn Yield</h3>
              <p className="opacity-70">
                Shares appreciate as yield accrues. Withdraw anytime to get WBTC + earned yield.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Strategies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-base-100 rounded-3xl border border-gradient p-8">
              <h3 className="font-bold text-xl mb-2">Vesu Lending</h3>
              <p className="text-sm opacity-70 mb-4">
                Deposit WBTC into Vesu V2 vToken pools (ERC-4626).
                Earn passive lending yield with auto-compounding.
              </p>
              <div className="flex justify-between text-sm">
                <span className="opacity-60">Type</span>
                <span className="font-semibold">Lending / Supply</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="opacity-60">Risk</span>
                <span className="font-semibold text-success">Low</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="opacity-60">Default Allocation</span>
                <span className="font-semibold">60%</span>
              </div>
            </div>
            <div className="bg-base-100 rounded-3xl border border-gradient p-8">
              <h3 className="font-bold text-xl mb-2">Ekubo LP</h3>
              <p className="text-sm opacity-70 mb-4">
                Provide concentrated liquidity in WBTC pairs on Ekubo DEX.
                Higher yield potential with active management.
              </p>
              <div className="flex justify-between text-sm">
                <span className="opacity-60">Type</span>
                <span className="font-semibold">Liquidity Provision</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="opacity-60">Risk</span>
                <span className="font-semibold text-warning">Medium</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="opacity-60">Default Allocation</span>
                <span className="font-semibold">40%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="max-w-3xl mx-auto mt-16 text-center">
          <h2 className="text-2xl font-bold mb-6">Built On</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {["Starknet", "Cairo", "Vesu V2", "Ekubo", "Xverse", "Scaffold-Stark", "Next.js"].map((tech) => (
              <span key={tech} className="badge badge-lg badge-outline opacity-70">{tech}</span>
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
