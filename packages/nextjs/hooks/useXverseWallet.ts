"use client";

import { useState, useCallback, useEffect } from "react";

interface BtcAddress {
  address: string;
  publicKey: string;
  purpose: string;
  addressType: string;
}

interface WalletProvider {
  id: string;
  name: string;
  icon: string;
}

export function useXverseWallet() {
  const [btcAddress, setBtcAddress] = useState<BtcAddress | null>(null);
  const [starknetAddress, setStarknetAddress] = useState<BtcAddress | null>(
    null,
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<WalletProvider[]>([]);

  // Detect available wallet providers on mount
  useEffect(() => {
    (async () => {
      try {
        const { getProviders, removeDefaultProvider } =
          await import("sats-connect");
        // Clear any stuck default provider (fixes UniSat stuck issue)
        removeDefaultProvider();
        const detected = getProviders();
        if (detected && detected.length > 0) {
          setProviders(
            detected.map((p: any) => ({
              id: p.id ?? "",
              name: p.name ?? "Unknown Wallet",
              icon: p.icon ?? "",
            })),
          );
        }
      } catch {
        // sats-connect not available or no providers
      }
    })();
  }, []);

  const connect = useCallback(async (providerId?: string) => {
    setIsConnecting(true);
    setError(null);
    try {
      const { request, AddressPurpose, getProviders } =
        await import("sats-connect");

      // If no providerId specified, detect and use first available
      if (!providerId) {
        const detected = getProviders();
        if (detected && detected.length > 0) {
          providerId = detected[0].id;
        }
      }

      // Try wallet_connect first (Xverse supports this)
      let addresses: any[] = [];
      let connected = false;

      try {
        const res = await request(
          "wallet_connect",
          {
            message: "Connect to BTCVault - Earn yield on your Bitcoin",
            addresses: [AddressPurpose.Payment, AddressPurpose.Starknet],
          },
          providerId,
        );
        if (res.status === "success") {
          addresses = (res as any).result?.addresses ?? [];
          connected = true;
        }
      } catch {
        // wallet_connect not supported by this provider
      }

      // Fallback: try getAddresses (more widely supported)
      if (!connected) {
        try {
          const res = await request(
            "getAddresses",
            {
              purposes: [AddressPurpose.Payment],
              message: "Connect to BTCVault",
            },
            providerId,
          );
          if (res.status === "success") {
            addresses = (res as any).result?.addresses ?? [];
            connected = true;
          }
        } catch {
          // getAddresses not supported either
        }
      }

      // Fallback: try window.unisat directly for UniSat wallet
      if (
        !connected &&
        typeof window !== "undefined" &&
        (window as any).unisat
      ) {
        try {
          const accounts = await (window as any).unisat.requestAccounts();
          if (accounts && accounts.length > 0) {
            const pubkey = await (window as any).unisat.getPublicKey();
            addresses = [
              {
                address: accounts[0],
                publicKey: pubkey || "",
                purpose: "payment",
                addressType: "p2wpkh",
              },
            ];
            connected = true;
          }
        } catch (e: any) {
          console.error("UniSat direct connect failed:", e);
        }
      }

      if (!connected || addresses.length === 0) {
        setError("No wallet found. Please install Xverse or UniSat extension.");
        return;
      }

      const payment =
        addresses.find(
          (a: any) =>
            a.purpose === "payment" || a.purpose === AddressPurpose.Payment,
        ) ?? addresses[0];

      const starknet =
        addresses.find(
          (a: any) =>
            a.purpose === "starknet" || a.purpose === AddressPurpose.Starknet,
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
        setError("Please install Xverse or UniSat wallet extension");
      } else {
        setError(err?.message ?? "Failed to connect wallet");
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const { default: Wallet, removeDefaultProvider } =
        await import("sats-connect");
      removeDefaultProvider();
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
    providers,
  };
}
