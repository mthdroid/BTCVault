"use client";

import { useState, useCallback } from "react";

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
      const { default: Wallet, AddressPurpose } = await import("sats-connect");

      // Try wallet_connect with Starknet first
      let addresses: any[] = [];
      try {
        const res = await Wallet.request("wallet_connect", {
          message: "Connect to BTCVault - Earn yield on your Bitcoin",
          addresses: [AddressPurpose.Payment, AddressPurpose.Starknet],
        });
        if (res.status === "success") {
          addresses = (res as any).result?.addresses ?? [];
        } else if ((res as any).error?.code === -32001 || (res as any).error?.message?.includes("not supported")) {
          // Method not supported, try without Starknet
          const res2 = await Wallet.request("wallet_connect", {
            message: "Connect to BTCVault - Earn yield on your Bitcoin",
            addresses: [AddressPurpose.Payment],
          });
          if (res2.status === "success") {
            addresses = (res2 as any).result?.addresses ?? [];
          } else {
            // Fall back to getAddresses
            const res3 = await Wallet.request("getAddresses", {
              purposes: [AddressPurpose.Payment],
              message: "Connect to BTCVault",
            });
            if (res3.status === "success") {
              addresses = (res3 as any).result?.addresses ?? (res3 as any).result ?? [];
            } else {
              setError((res3 as any).error?.message ?? "Connection rejected");
              return;
            }
          }
        } else {
          setError((res as any).error?.message ?? "Connection rejected");
          return;
        }
      } catch {
        // wallet_connect completely failed, try getAddresses
        try {
          const res = await Wallet.request("getAddresses", {
            purposes: [AddressPurpose.Payment],
            message: "Connect to BTCVault",
          });
          if (res.status === "success") {
            addresses = (res as any).result?.addresses ?? (res as any).result ?? [];
          } else {
            setError((res as any).error?.message ?? "Connection rejected");
            return;
          }
        } catch (innerErr: any) {
          setError(innerErr?.message ?? "Failed to connect wallet");
          return;
        }
      }

      const payment = addresses.find((a: any) =>
        a.purpose === AddressPurpose.Payment || a.purpose === "payment"
      ) ?? null;
      const starknet = addresses.find((a: any) =>
        a.purpose === AddressPurpose.Starknet || a.purpose === "starknet"
      ) ?? null;

      if (!payment) {
        setError("No Bitcoin payment address found");
        return;
      }

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
