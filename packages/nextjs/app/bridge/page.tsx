"use client";

import { useAccount } from "@starknet-react/core";
import { useXverseWallet } from "~~/hooks/useXverseWallet";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";

const LAYERSWAP_URL =
  "https://layerswap.io/app/?from=BITCOIN_MAINNET&to=STARKNET_MAINNET&lockFrom=true&lockTo=true&fromAsset=BTC&toAsset=WBTC&actionButtonText=Bridge+BTC+to+Starknet&destAddress=0x013221b418c779b5fbeab1dc0c08fc47e268bc0c2bd5cba6572cb7189ff5bf1e";

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
    providers,
  } = useXverseWallet();

  return (
    <div className="flex flex-col items-center grow pt-10 px-4">
      <div className="max-w-lg w-full">
        <h1 className="text-3xl font-bold text-center mb-2">
          <span className="text-primary">Bridge</span> to{" "}
          <span style={{ color: "#5B8DEF" }}>Starknet</span>
        </h1>
        <p className="text-center text-sm opacity-40 mb-8">
          Bridge your native BTC to Starknet WBTC
        </p>

        {/* Step 1 */}
        <div className="card-btc mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              1
            </div>
            <h2 className="font-semibold">Connect Wallets</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Bitcoin Wallet Card */}
            <div className="rounded-2xl p-4 flex flex-col bg-gradient-to-b from-base-200 to-base-200/50 border border-primary/10 hover:border-primary/30 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                  <span className="text-primary text-xs font-bold">
                    &#8383;
                  </span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-60">
                  Bitcoin
                </p>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                {xverseConnected ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                      <p className="text-sm font-medium text-success">
                        Connected
                      </p>
                    </div>
                    {btcAddress && (
                      <p className="text-xs font-mono opacity-50 truncate bg-base-300/50 rounded-lg px-2 py-1">
                        {btcAddress.address.slice(0, 10)}...
                        {btcAddress.address.slice(-6)}
                      </p>
                    )}
                    {xverseStarknet && (
                      <p className="text-xs font-mono opacity-50 truncate mt-1.5 bg-base-300/50 rounded-lg px-2 py-1">
                        SN: {xverseStarknet.address.slice(0, 8)}...
                        {xverseStarknet.address.slice(-4)}
                      </p>
                    )}
                    <button
                      className="btn btn-ghost btn-xs mt-3 opacity-40 hover:opacity-80"
                      onClick={disconnectXverse}
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <div>
                    {providers.length > 1 ? (
                      <div className="flex flex-col gap-1.5">
                        {providers.map((p) => (
                          <button
                            key={p.id}
                            className={`btn btn-primary btn-sm w-full text-white rounded-xl ${isConnecting ? "loading" : ""}`}
                            onClick={() => connectXverse(p.id)}
                            disabled={isConnecting}
                          >
                            {isConnecting ? "..." : p.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        className={`btn btn-primary btn-sm w-full text-white rounded-xl shadow-md shadow-primary/15 ${isConnecting ? "loading" : ""}`}
                        onClick={() => connectXverse()}
                        disabled={isConnecting}
                      >
                        {isConnecting ? "Connecting..." : "Connect Bitcoin"}
                      </button>
                    )}
                    {xverseError && (
                      <p className="text-xs text-error mt-2">{xverseError}</p>
                    )}
                    <p className="text-[10px] opacity-25 mt-2 text-center">
                      Xverse, UniSat, or compatible
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Starknet Wallet Card */}
            <div className="rounded-2xl p-4 flex flex-col bg-gradient-to-b from-base-200 to-base-200/50 border border-accent/10 hover:border-accent/30 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(91,141,239,0.15)" }}
                >
                  <span
                    style={{ color: "#5B8DEF" }}
                    className="text-xs font-bold"
                  >
                    S
                  </span>
                </div>
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#5B8DEF", opacity: 0.8 }}
                >
                  Starknet
                </p>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                {starknetConnected ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                      <p className="text-sm font-medium text-success">
                        Connected
                      </p>
                    </div>
                    <p className="text-xs font-mono opacity-50 truncate bg-base-300/50 rounded-lg px-2 py-1">
                      {starknetAddr?.slice(0, 10)}...{starknetAddr?.slice(-6)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="connect-modal"
                      className="btn btn-sm w-full text-white cursor-pointer rounded-xl shadow-md"
                      style={{
                        backgroundColor: "#5B8DEF",
                        borderColor: "#5B8DEF",
                        boxShadow: "0 4px 12px rgba(91,141,239,0.15)",
                      }}
                    >
                      Connect Starknet
                    </label>
                    <p className="text-[10px] opacity-25 mt-2 text-center">
                      Braavos, ArgentX, or Xverse
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="card-btc mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              2
            </div>
            <h2 className="font-semibold">Bridge BTC to Starknet</h2>
          </div>
          <p className="text-sm opacity-40 mb-4">
            Use LayerSwap to bridge native BTC to WBTC on Starknet.
          </p>
          <div className="flex flex-col gap-2">
            <a
              href={LAYERSWAP_URL}
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
            <p className="text-xs font-medium mb-1.5 opacity-50">
              Bridge Options:
            </p>
            <div className="space-y-0.5 text-xs opacity-40">
              <p>LayerSwap - Fast (~10 min), direct BTC to Starknet</p>
              <p>StarkGate - Official bridge, ETH/WBTC from Ethereum</p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="card-btc mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              3
            </div>
            <h2 className="font-semibold">Deposit into Vault</h2>
          </div>
          <p className="text-sm opacity-40 mb-4">
            Once you have WBTC on Starknet, deposit into BTCVault to earn
            automated DeFi yield.
          </p>
          <a
            href="/vault"
            className="btn btn-outline border-secondary/50 text-secondary hover:bg-secondary hover:text-white w-full"
          >
            Go to Vault
          </a>
        </div>

        <div className="text-center text-xs opacity-25 space-y-1 mb-8 mt-6">
          <p className="font-mono">
            BTC &rarr; LayerSwap &rarr; WBTC &rarr; BTCVault &rarr; Yield
          </p>
          <p>Your keys, your coins. Fully non-custodial.</p>
        </div>
      </div>
    </div>
  );
};

export default BridgePage;
