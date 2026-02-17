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
          Earn optimized yield on your WBTC through automated allocation
          between Vesu lending and Ekubo LP strategies.
        </p>

        {!isConnected ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm opacity-70">Connect your Starknet wallet to get started</p>
            <CustomConnectButton />
          </div>
        ) : (
          <div className="flex justify-center gap-4">
            <Link href="/vault" className="btn btn-secondary btn-lg">
              Enter Vault
            </Link>
            <Link href="/dashboard" className="btn btn-outline btn-lg">
              Dashboard
            </Link>
          </div>
        )}
      </div>

      <div className="bg-container grow w-full mt-16 px-8 py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col bg-base-100 relative text-sm px-8 py-8 text-center items-center rounded-3xl border border-gradient">
              <div className="trapeze"></div>
              <div className="text-3xl mb-4">1</div>
              <h3 className="font-bold text-lg mb-2">Deposit WBTC</h3>
              <p className="opacity-70">
                Deposit your WBTC into the vault. You receive vault shares
                representing your position.
              </p>
            </div>
            <div className="flex flex-col bg-base-100 relative text-sm px-8 py-8 text-center items-center rounded-3xl border border-gradient">
              <div className="trapeze"></div>
              <div className="text-3xl mb-4">2</div>
              <h3 className="font-bold text-lg mb-2">Auto-Allocate</h3>
              <p className="opacity-70">
                The Router automatically splits funds between Vesu (lending)
                and Ekubo (LP) based on real-time APY comparison.
              </p>
            </div>
            <div className="flex flex-col bg-base-100 relative text-sm px-8 py-8 text-center items-center rounded-3xl border border-gradient">
              <div className="trapeze"></div>
              <div className="text-3xl mb-4">3</div>
              <h3 className="font-bold text-lg mb-2">Earn Yield</h3>
              <p className="opacity-70">
                Your shares appreciate as yield accrues. Withdraw anytime
                to get your WBTC + earned yield back.
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
