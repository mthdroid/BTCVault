"use client";

import { useAccount } from "@starknet-react/core";
import { useXverseWallet } from "~~/hooks/useXverseWallet";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";

const LAYERSWAP_URL =
  "https://layerswap.io/app/?from=BITCOIN_MAINNET&to=STARKNET_MAINNET&fromAsset=BTC&lockFrom=true&lockTo=true&actionButtonText=Bridge%20BTC%20to%20Starknet";

const BridgePage = () => {
  const { address: starknetAddr, status } = useAccount();
  const starknetConnected = status === "connected";
  const {
    connect: connectXverse,
    disconnect: disconnectXverse,
    btcAddress,
    starknetAddress: xverseStarknet,
    isConnected: xverseConnected,
    isConnecting,
    error: xverseError,
  } = useXverseWallet();

  return (
    <div className="flex flex-col items-center grow pt-10 px-4">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center mb-2">Bridge</h1>
        <p className="text-center opacity-60 mb-8">
          Bridge your BTC to Starknet WBTC, then deposit into the vault
        </p>

        {/* Step 1: Connect Wallets */}
        <div className="bg-base-100 rounded-3xl border border-gradient p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">Step 1: Connect Wallets</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Xverse / Bitcoin Wallet */}
            <div className="border border-base-300 rounded-2xl p-4">
              <p className="text-xs opacity-50 uppercase mb-2">Bitcoin (Xverse)</p>
              {xverseConnected ? (
                <div>
                  <p className="text-sm font-mono text-success mb-1">Connected</p>
                  {btcAddress && (
                    <p className="text-xs font-mono opacity-70 truncate">
                      BTC: {btcAddress.address.slice(0, 12)}...{btcAddress.address.slice(-8)}
                    </p>
                  )}
                  {xverseStarknet && (
                    <p className="text-xs font-mono opacity-70 truncate mt-1">
                      Starknet: {xverseStarknet.address.slice(0, 10)}...{xverseStarknet.address.slice(-6)}
                    </p>
                  )}
                  <button
                    className="btn btn-ghost btn-xs mt-2"
                    onClick={disconnectXverse}
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div>
                  <button
                    className={`btn btn-secondary btn-sm w-full ${isConnecting ? "loading" : ""}`}
                    onClick={connectXverse}
                    disabled={isConnecting}
                  >
                    {isConnecting ? "Connecting..." : "Connect Xverse"}
                  </button>
                  {xverseError && (
                    <p className="text-xs text-error mt-2">{xverseError}</p>
                  )}
                  <p className="text-xs opacity-40 mt-2">
                    Xverse wallet supports both BTC and Starknet
                  </p>
                </div>
              )}
            </div>

            {/* Starknet Wallet */}
            <div className="border border-base-300 rounded-2xl p-4">
              <p className="text-xs opacity-50 uppercase mb-2">Starknet Wallet</p>
              {starknetConnected ? (
                <div>
                  <p className="text-sm font-mono text-success mb-1">Connected</p>
                  <p className="text-xs font-mono opacity-70 truncate">
                    {starknetAddr?.slice(0, 10)}...{starknetAddr?.slice(-6)}
                  </p>
                </div>
              ) : (
                <div>
                  <CustomConnectButton />
                  <p className="text-xs opacity-40 mt-2">
                    Braavos, ArgentX, or Xverse
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Bridge */}
        <div className="bg-base-100 rounded-3xl border border-gradient p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">Step 2: Bridge BTC to Starknet</h2>
          <p className="text-sm opacity-60 mb-4">
            Use LayerSwap to bridge your native BTC to WBTC on Starknet.
            The bridge will handle the conversion automatically.
          </p>

          <div className="flex flex-col gap-3">
            <a
              href={starknetAddr ? `${LAYERSWAP_URL}&destAddress=${starknetAddr}` : LAYERSWAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary w-full"
            >
              Bridge via LayerSwap
            </a>

            <a
              href="https://starkgate.starknet.io"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm w-full"
            >
              Or use StarkGate (Official Bridge)
            </a>
          </div>

          <div className="mt-4 bg-base-300 rounded-xl p-4">
            <p className="text-xs font-bold mb-2">Bridge Options:</p>
            <div className="space-y-1 text-xs opacity-70">
              <p>LayerSwap - Fast (~10 min), direct BTC to Starknet</p>
              <p>StarkGate - Official bridge, ETH/WBTC from Ethereum</p>
              <p>Xverse In-App - Bridge directly from Xverse wallet</p>
            </div>
          </div>
        </div>

        {/* Step 3: Deposit */}
        <div className="bg-base-100 rounded-3xl border border-gradient p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">Step 3: Deposit into Vault</h2>
          <p className="text-sm opacity-60 mb-4">
            Once you have WBTC on Starknet, deposit it into BTCVault
            to start earning automated DeFi yield.
          </p>
          <a href="/vault" className="btn btn-secondary w-full">
            Go to Vault
          </a>
        </div>

        {/* Flow Summary */}
        <div className="text-center text-xs opacity-40 space-y-1 mb-8">
          <p>BTC (Bitcoin) → LayerSwap → WBTC (Starknet) → BTCVault → Yield</p>
          <p>Your keys, your coins. Fully non-custodial.</p>
        </div>
      </div>
    </div>
  );
};

export default BridgePage;
