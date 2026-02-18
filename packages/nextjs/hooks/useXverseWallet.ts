"use client";

import { useState, useCallback } from "react";

// Types matching sats-connect v4
interface XverseAddress {
  address: string;
  publicKey: string;
  purpose: string;
  addressType: string;
}

export function useXverseWallet() {
  const [btcAddress, setBtcAddress] = useState<XverseAddress | null>(null);
  const [starknetAddress, setStarknetAddress] = useState<XverseAddress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      // Dynamic import to avoid SSR issues
      const { default: Wallet, AddressPurpose } = await import("sats-connect");

      const res = await Wallet.request("wallet_connect", {
        message: "Connect to BTCVault - Earn yield on your Bitcoin",
        addresses: [AddressPurpose.Payment, AddressPurpose.Starknet],
      });

      if (res.status === "error") {
        setError((res as any).error?.message ?? "Connection rejected");
        return;
      }

      const addresses = (res as any).result?.addresses ?? [];
      const payment = addresses.find((a: any) => a.purpose === AddressPurpose.Payment) ?? null;
      const starknet = addresses.find((a: any) => a.purpose === AddressPurpose.Starknet) ?? null;

      setBtcAddress(payment);
      setStarknetAddress(starknet);
      setIsConnected(true);
    } catch (err: any) {
      if (err?.message?.includes("No Bitcoin wallet installed")) {
        setError("Please install Xverse wallet extension");
      } else {
        setError(err?.message ?? "Failed to connect Xverse wallet");
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const { default: Wallet } = await import("sats-connect");
      await Wallet.disconnect();
    } catch {}
    setBtcAddress(null);
    setStarknetAddress(null);
    setIsConnected(false);
  }, []);

  return {
    connect,
    disconnect,
    btcAddress,
    starknetAddress,
    isConnected,
    isConnecting,
    error,
  };
}
