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
      <div className="max-w-lg w-full">
        <h1 className="text-3xl font-bold text-center mb-2">
          <span className="text-primary">Bridge</span> to <span style={{ color: "#5B8DEF" }}>Starknet</span>
        </h1>
        <p className="text-center text-sm opacity-40 mb-8">
          Bridge your native BTC to Starknet WBTC
        </p>

        {/* Step 1 */}
        <div className="card-btc mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">1</div>
            <h2 className="font-semibold">Connect Wallets</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-base-200 rounded-xl p-4 border border-base-300/50 flex flex-col">
              <p className="text-xs font-medium opacity-40 uppercase tracking-wider mb-3">Bitcoin (Xverse)</p>
              <div className="flex-1 flex flex-col justify-center">
                {xverseConnected ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-success"></div>
                      <p className="text-sm font-medium text-success">Connected</p>
                    </div>
                    {btcAddress && (
                      <p className="text-xs font-mono opacity-50 truncate">
                        {btcAddress.address.slice(0, 12)}...{btcAddress.address.slice(-8)}
                      </p>
                    )}
                    {xverseStarknet && (
                      <p className="text-xs font-mono opacity-50 truncate mt-1">
                        SN: {xverseStarknet.address.slice(0, 10)}...{xverseStarknet.address.slice(-6)}
                      </p>
                    )}
                    <button className="btn btn-ghost btn-xs mt-2 opacity-50" onClick={disconnectXverse}>Disconnect</button>
                  </div>
                ) : (
                  <div>
                    <button
                      className={`btn btn-primary btn-sm w-full text-white ${isConnecting ? "loading" : ""}`}
                      onClick={connectXverse}
                      disabled={isConnecting}
                    >
                      {isConnecting ? "Connecting..." : "Connect Xverse"}
                    </button>
                    {xverseError && <p className="text-xs text-error mt-2">{xverseError}</p>}
                    <p className="text-xs opacity-30 mt-2 text-center">BTC + Starknet in one wallet</p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-base-200 rounded-xl p-4 border border-accent/20 flex flex-col">
              <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "#5B8DEF" }}>Starknet</p>
              <div className="flex-1 flex flex-col justify-center">
                {starknetConnected ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-success"></div>
                      <p className="text-sm font-medium text-success">Connected</p>
                    </div>
                    <p className="text-xs font-mono opacity-50 truncate">
                      {starknetAddr?.slice(0, 10)}...{starknetAddr?.slice(-6)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="connect-modal"
                      className="btn btn-sm w-full text-white cursor-pointer"
                      style={{ backgroundColor: "#5B8DEF", borderColor: "#5B8DEF" }}
                    >
                      Connect Starknet
                    </label>
                    <p className="text-xs opacity-30 mt-2 text-center">Braavos, ArgentX, or Xverse</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="card-btc mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">2</div>
            <h2 className="font-semibold">Bridge BTC to Starknet</h2>
          </div>
          <p className="text-sm opacity-40 mb-4">Use LayerSwap to bridge native BTC to WBTC on Starknet.</p>
          <div className="flex flex-col gap-2">
            <a
              href={starknetAddr ? `${LAYERSWAP_URL}&destAddress=${starknetAddr}` : LAYERSWAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary w-full text-white shadow-lg shadow-primary/20"
            >
              Bridge via LayerSwap
            </a>
            <a
              href="https://starkgate.starknet.io"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm w-full opacity-50"
            >
              Or use StarkGate (Official Bridge)
            </a>
          </div>
          <div className="mt-4 bg-base-200 rounded-xl p-3 border border-base-300/50">
            <p className="text-xs font-medium mb-1.5 opacity-50">Bridge Options:</p>
            <div className="space-y-0.5 text-xs opacity-40">
              <p>LayerSwap - Fast (~10 min), direct BTC to Starknet</p>
              <p>StarkGate - Official bridge, ETH/WBTC from Ethereum</p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="card-btc mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">3</div>
            <h2 className="font-semibold">Deposit into Vault</h2>
          </div>
          <p className="text-sm opacity-40 mb-4">
            Once you have WBTC on Starknet, deposit into BTCVault to earn automated DeFi yield.
          </p>
          <a href="/vault" className="btn btn-outline border-primary/50 text-primary hover:bg-primary hover:text-white w-full">
            Go to Vault
          </a>
        </div>

        <div className="text-center text-xs opacity-25 space-y-1 mb-8 mt-6">
          <p className="font-mono">BTC &rarr; LayerSwap &rarr; WBTC &rarr; BTCVault &rarr; Yield</p>
          <p>Your keys, your coins. Fully non-custodial.</p>
        </div>
      </div>
    </div>
  );
};

export default BridgePage;
