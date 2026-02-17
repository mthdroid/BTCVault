"use client";

import { useState } from "react";
import { useAccount } from "@starknet-react/core";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";

const VAULT_ADDRESS: string = "0x0"; // Will be set after deployment
const WBTC_ADDRESS: string = "0x63d32a3fa6074e72e7a1e06fe78c46a0c8473217773e19f11d8c8cbfc4ff8ca";

const VaultPage = () => {
  const { address, status } = useAccount();
  const isConnected = status === "connected";
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - will be replaced with contract reads after deployment
  const vaultData = {
    totalAssets: "0",
    totalShares: "0",
    userShares: "0",
    userAssets: "0",
    vaultAPY: "4.18",
    vesuAllocation: "60",
    ekuboAllocation: "40",
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setIsLoading(true);
    try {
      // TODO: After deployment, implement real contract calls:
      // 1. WBTC.approve(vault_address, amount)
      // 2. BTCVault.deposit(amount)
      console.log("Deposit:", amount, "satoshis");
      alert(`Deposit of ${amount} satoshis queued. Deploy contracts first.`);
    } catch (err) {
      console.error("Deposit failed:", err);
    } finally {
      setIsLoading(false);
      setAmount("");
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setIsLoading(true);
    try {
      // TODO: After deployment, implement real contract calls:
      // BTCVault.withdraw(shares_amount)
      console.log("Withdraw:", amount, "shares");
      alert(`Withdraw of ${amount} shares queued. Deploy contracts first.`);
    } catch (err) {
      console.error("Withdraw failed:", err);
    } finally {
      setIsLoading(false);
      setAmount("");
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center grow pt-20">
        <h1 className="text-3xl font-bold mb-4">BTCVault</h1>
        <p className="opacity-70 mb-6">Connect your wallet to access the vault</p>
        <CustomConnectButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center grow pt-10 px-4">
      <div className="max-w-lg w-full">
        <h1 className="text-3xl font-bold text-center mb-2">BTCVault</h1>
        <p className="text-center opacity-60 mb-8">Deposit & Withdraw WBTC</p>

        {/* Vault Stats */}
        <div className="bg-base-100 rounded-3xl border border-gradient p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs opacity-50 uppercase">Total Assets</p>
              <p className="text-xl font-bold">{vaultData.totalAssets} sats</p>
            </div>
            <div>
              <p className="text-xs opacity-50 uppercase">Vault APY</p>
              <p className="text-xl font-bold text-success">{vaultData.vaultAPY}%</p>
            </div>
            <div>
              <p className="text-xs opacity-50 uppercase">Your Shares</p>
              <p className="text-lg font-semibold">{vaultData.userShares}</p>
            </div>
            <div>
              <p className="text-xs opacity-50 uppercase">Your Position</p>
              <p className="text-lg font-semibold">{vaultData.userAssets} sats</p>
            </div>
          </div>
        </div>

        {/* Allocation Bar */}
        <div className="bg-base-100 rounded-3xl border border-gradient p-6 mb-6">
          <p className="text-xs opacity-50 uppercase mb-3">Strategy Allocation</p>
          <div className="flex rounded-full overflow-hidden h-4 mb-2">
            <div
              className="bg-secondary"
              style={{ width: `${vaultData.vesuAllocation}%` }}
            />
            <div
              className="bg-accent"
              style={{ width: `${vaultData.ekuboAllocation}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span>Vesu {vaultData.vesuAllocation}%</span>
            <span>Ekubo {vaultData.ekuboAllocation}%</span>
          </div>
        </div>

        {/* Deposit/Withdraw Tabs */}
        <div className="bg-base-100 rounded-3xl border border-gradient p-6">
          <div className="flex gap-2 mb-6">
            <button
              className={`flex-1 btn btn-sm ${activeTab === "deposit" ? "btn-secondary" : "btn-ghost"}`}
              onClick={() => setActiveTab("deposit")}
            >
              Deposit
            </button>
            <button
              className={`flex-1 btn btn-sm ${activeTab === "withdraw" ? "btn-secondary" : "btn-ghost"}`}
              onClick={() => setActiveTab("withdraw")}
            >
              Withdraw
            </button>
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text text-xs opacity-60">
                {activeTab === "deposit" ? "Amount (satoshis)" : "Shares to burn"}
              </span>
            </label>
            <input
              type="number"
              placeholder={activeTab === "deposit" ? "Min: 100 sats" : "Enter shares amount"}
              className="input input-bordered w-full bg-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={activeTab === "deposit" ? "100" : "1"}
            />
          </div>

          {activeTab === "deposit" && amount && (
            <div className="text-xs opacity-60 mb-4">
              You will receive vault shares proportional to your deposit.
              {parseFloat(amount) < 100 && (
                <span className="text-error block mt-1">Minimum deposit is 100 satoshis</span>
              )}
            </div>
          )}

          <button
            className={`btn btn-secondary w-full ${isLoading ? "loading" : ""}`}
            onClick={activeTab === "deposit" ? handleDeposit : handleWithdraw}
            disabled={isLoading || !amount || parseFloat(amount) <= 0 || (activeTab === "deposit" && parseFloat(amount) < 100)}
          >
            {isLoading
              ? "Processing..."
              : activeTab === "deposit"
                ? "Deposit WBTC"
                : "Withdraw WBTC"}
          </button>
        </div>

        {/* Info */}
        <div className="text-center mt-6 text-xs opacity-40">
          <p>Contract: {VAULT_ADDRESS === "0x0" ? "Not deployed yet" : VAULT_ADDRESS.slice(0, 10) + "..."}</p>
          <p>Network: Starknet Sepolia</p>
        </div>
      </div>
    </div>
  );
};

export default VaultPage;
