"use client";

import { useState } from "react";
import { useAccount } from "@starknet-react/core";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { useScaffoldMultiWriteContract } from "~~/hooks/scaffold-stark/useScaffoldMultiWriteContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";

const VAULT_ADDRESS = "0x363caa24d01b66327a26426e69c7f1feaf41c170a7e9e74ab0d6b4b7d156f51";
const WBTC_ADDRESS = "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac";

const VaultPage = () => {
  const { address, status } = useAccount();
  const isConnected = status === "connected";
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");

  const { data: totalAssets } = useScaffoldReadContract({ contractName: "BTCVault", functionName: "total_assets" });
  const { data: totalShares } = useScaffoldReadContract({ contractName: "BTCVault", functionName: "total_shares" });
  const { data: userShares } = useScaffoldReadContract({ contractName: "BTCVault", functionName: "shares_of", args: [address ?? "0x0"] });
  const { data: vaultApy } = useScaffoldReadContract({ contractName: "BTCVault", functionName: "get_vault_apy" });
  const { data: allocation } = useScaffoldReadContract({ contractName: "BTCVault", functionName: "get_allocation" });

  const totalAssetsStr = totalAssets ? totalAssets.toString() : "0";
  const userSharesStr = userShares ? userShares.toString() : "0";
  const apyBps = vaultApy ? Number(vaultApy) : 418;
  const apyStr = (apyBps / 100).toFixed(2);

  let vesuAlloc = 60, ekuboAlloc = 40;
  if (allocation) {
    const alloc = allocation as unknown as [bigint, bigint];
    if (Array.isArray(alloc) && alloc.length === 2) {
      vesuAlloc = Number(alloc[0]) / 100;
      ekuboAlloc = Number(alloc[1]) / 100;
    }
  }

  const userAssetsStr =
    userShares && totalShares && totalAssets && BigInt(totalShares.toString()) > 0n
      ? ((BigInt(userShares.toString()) * BigInt(totalAssets.toString())) / BigInt(totalShares.toString())).toString()
      : "0";

  const amountBigInt = amount && parseFloat(amount) > 0 ? BigInt(Math.floor(parseFloat(amount))) : 0n;

  const { sendAsync: sendDeposit, isPending: depositPending } = useScaffoldMultiWriteContract({
    calls: [
      { contractAddress: WBTC_ADDRESS, entrypoint: "approve", calldata: [VAULT_ADDRESS, amountBigInt.toString(), "0"] },
      { contractName: "BTCVault", functionName: "deposit", args: [amountBigInt] },
    ],
  });

  const { sendAsync: sendWithdraw, isPending: withdrawPending } = useScaffoldWriteContract({
    contractName: "BTCVault", functionName: "withdraw", args: [amountBigInt],
  });

  const isLoading = depositPending || withdrawPending;

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) < 100) return;
    try { await sendDeposit(); setAmount(""); } catch (err) { console.error("Deposit failed:", err); }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    try { await sendWithdraw(); setAmount(""); } catch (err) { console.error("Withdraw failed:", err); }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center grow pt-20">
        <h1 className="text-3xl font-bold mb-4"><span className="text-primary">BTC</span>Vault</h1>
        <p className="opacity-50 mb-6 text-sm">Connect your wallet to access the vault</p>
        <CustomConnectButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center grow pt-10 px-4">
      <div className="max-w-md w-full">
        {/* Vault Stats */}
        <div className="card-btc mb-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg">
              <span className="text-primary">BTC</span>Vault
            </h2>
            <span className="text-sm font-semibold text-success bg-success/10 px-3 py-1 rounded-full border border-success/20">
              {apyStr}% APY
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs opacity-40 mb-1">Total Assets</p>
              <p className="text-xl font-bold">{totalAssetsStr} <span className="text-xs opacity-40">sats</span></p>
            </div>
            <div>
              <p className="text-xs opacity-40 mb-1">Your Position</p>
              <p className="text-xl font-bold">{userAssetsStr} <span className="text-xs opacity-40">sats</span></p>
            </div>
          </div>
        </div>

        {/* Strategy Allocation */}
        <div className="card-btc mb-4">
          <p className="text-xs font-medium opacity-50 mb-3">Strategy Allocation</p>
          <div className="flex rounded-full overflow-hidden h-3 mb-3 bg-base-300">
            <div className="bg-primary transition-all" style={{ width: `${vesuAlloc}%` }} />
            <div className="bg-accent transition-all" style={{ width: `${ekuboAlloc}%` }} />
          </div>
          <div className="flex justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="opacity-50">Vesu {vesuAlloc}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <span className="opacity-50">Ekubo {ekuboAlloc}%</span>
            </div>
          </div>
        </div>

        {/* Deposit/Withdraw Card */}
        <div className="card-btc">
          <div className="flex gap-1 mb-5 bg-base-200 rounded-full p-1">
            <button
              className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all ${activeTab === "deposit" ? "bg-primary text-white shadow-sm" : "opacity-50 hover:opacity-80"}`}
              onClick={() => setActiveTab("deposit")}
            >
              Deposit
            </button>
            <button
              className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all ${activeTab === "withdraw" ? "bg-primary text-white shadow-sm" : "opacity-50 hover:opacity-80"}`}
              onClick={() => setActiveTab("withdraw")}
            >
              Withdraw
            </button>
          </div>

          <div className="mb-4">
            <div className="bg-base-200 rounded-xl p-4 border border-base-300/50">
              <label className="text-xs opacity-40 mb-2 block">
                {activeTab === "deposit" ? "Amount (satoshis)" : "Shares to burn"}
              </label>
              <input
                type="number"
                placeholder={activeTab === "deposit" ? "Min: 100 sats" : "Enter shares amount"}
                className="w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-base-content/20"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={activeTab === "deposit" ? "100" : "1"}
              />
            </div>
          </div>

          {activeTab === "deposit" && amount && parseFloat(amount) > 0 && (
            <div className="text-xs opacity-50 mb-4 px-1">
              You will receive vault shares proportional to your deposit.
              {parseFloat(amount) < 100 && (
                <span className="text-error block mt-1">Minimum deposit is 100 satoshis</span>
              )}
            </div>
          )}

          <button
            className={`btn btn-primary w-full text-white text-base shadow-lg shadow-primary/20 ${isLoading ? "loading" : ""}`}
            onClick={activeTab === "deposit" ? handleDeposit : handleWithdraw}
            disabled={isLoading || !amount || parseFloat(amount) <= 0 || (activeTab === "deposit" && parseFloat(amount) < 100)}
          >
            {isLoading ? "Processing..." : activeTab === "deposit" ? "Deposit WBTC" : "Withdraw WBTC"}
          </button>
        </div>

        <div className="text-center mt-5 text-xs opacity-25 font-mono">
          {VAULT_ADDRESS.slice(0, 14)}...{VAULT_ADDRESS.slice(-8)} | <span style={{ color: "#5B8DEF" }}>Starknet Mainnet</span>
        </div>
      </div>
    </div>
  );
};

export default VaultPage;
