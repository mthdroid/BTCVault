import { Cog8ToothIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import { useGlobalState } from "~~/services/store/store";
import { devnet, sepolia, mainnet } from "@starknet-react/chains";
import { Faucet } from "~~/components/scaffold-stark/Faucet";
import { FaucetSepolia } from "~~/components/scaffold-stark/FaucetSepolia";
import { BlockExplorerSepolia } from "./scaffold-stark/BlockExplorerSepolia";
import { BlockExplorer } from "./scaffold-stark/BlockExplorer";
import Link from "next/link";
import Image from "next/image";
import { BlockExplorerDevnet } from "./scaffold-stark/BlockExplorerDevnet";

/**
 * Site footer
 */
export const Footer = () => {
  const nativeCurrencyPrice = useGlobalState(
    (state) => state.nativeCurrencyPrice,
  );
  const { targetNetwork } = useTargetNetwork();

  const isLocalNetwork =
    targetNetwork.id === devnet.id && targetNetwork.network === devnet.network;
  const isSepoliaNetwork =
    targetNetwork.id === sepolia.id &&
    targetNetwork.network === sepolia.network;
  const isMainnetNetwork =
    targetNetwork.id === mainnet.id &&
    targetNetwork.network === mainnet.network;

  return (
    <div className="min-h-0 bg-base-100 border-t border-accent/10">
      {/* Floating bottom bar (network tools) */}
      <div className="fixed flex justify-between items-center w-full z-10 p-4 bottom-0 left-0 pointer-events-none">
        <div className="flex flex-col md:flex-row gap-2 pointer-events-auto">
          {isSepoliaNetwork && (
            <>
              <FaucetSepolia />
              <BlockExplorerSepolia />
            </>
          )}
          {isLocalNetwork && (
            <>
              <Faucet />
              <BlockExplorerDevnet />
            </>
          )}
          {isMainnetNetwork && (
            <>
              <BlockExplorer />
            </>
          )}
          <Link
            href={"/configure"}
            passHref
            className="btn btn-sm font-normal gap-1 cursor-pointer border border-primary/20 shadow-none text-primary"
          >
            <Cog8ToothIcon className="h-4 w-4 text-primary" />
            <span>Configure Contracts</span>
          </Link>
          {nativeCurrencyPrice > 0 && (
            <div className="btn btn-sm font-normal gap-1 cursor-auto border border-primary/20 shadow-none">
              <CurrencyDollarIcon className="h-4 w-4 text-primary" />
              <span>{nativeCurrencyPrice}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Image
                src="/btcvault-removebg-preview.png"
                alt="BTCVault"
                width={32}
                height={32}
              />
              <span className="font-bold text-lg">
                <span className="text-primary">BTC</span>Vault
              </span>
            </div>
            <p className="text-sm opacity-40 leading-relaxed">
              Non-custodial Bitcoin yield vault on{" "}
              <span style={{ color: "#5B8DEF" }}>Starknet</span>. Automated DeFi
              strategies with Vesu & Ekubo.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-sm mb-3 opacity-60">Product</h4>
            <div className="flex flex-col gap-2">
              <Link
                href="/bridge"
                className="text-sm opacity-40 hover:opacity-80 hover:text-primary transition-all"
              >
                Bridge
              </Link>
              <Link
                href="/vault"
                className="text-sm opacity-40 hover:opacity-80 hover:text-primary transition-all"
              >
                Vault
              </Link>
              <Link
                href="/dashboard"
                className="text-sm opacity-40 hover:opacity-80 hover:text-primary transition-all"
              >
                Dashboard
              </Link>
              <Link
                href="/debug"
                className="text-sm opacity-40 hover:opacity-80 hover:text-primary transition-all"
              >
                Debug Contracts
              </Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-sm mb-3 opacity-60">Resources</h4>
            <div className="flex flex-col gap-2">
              <a
                href="https://github.com/mthdroid/BTCVault"
                target="_blank"
                rel="noreferrer"
                className="text-sm opacity-40 hover:opacity-80 hover:text-primary transition-all"
              >
                GitHub
              </a>
              <a
                href="https://starkscan.co/contract/0x363caa24d01b66327a26426e69c7f1feaf41c170a7e9e74ab0d6b4b7d156f51"
                target="_blank"
                rel="noreferrer"
                className="text-sm opacity-40 hover:opacity-80 hover:text-primary transition-all"
              >
                Starkscan
              </a>
              <a
                href="https://docs.starknet.io"
                target="_blank"
                rel="noreferrer"
                className="text-sm opacity-40 hover:opacity-80 hover:text-primary transition-all"
              >
                Starknet Docs
              </a>
            </div>
          </div>

          {/* Powered By */}
          <div>
            <h4 className="font-semibold text-sm mb-3 opacity-60">
              Powered by
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href="https://starknet.io"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 opacity-50 hover:opacity-90 transition-opacity"
              >
                <Image
                  src="/starknet-logo.svg"
                  alt="Starknet"
                  width={24}
                  height={24}
                />
                <span className="text-sm font-medium">Starknet</span>
              </a>
              <a
                href="https://www.xverse.app"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 opacity-50 hover:opacity-90 transition-opacity"
              >
                <div className="w-6 h-6 bg-[#1a1a2e] rounded flex items-center justify-center">
                  <Image
                    src="/xverse-logo.svg"
                    alt="Xverse"
                    width={18}
                    height={18}
                  />
                </div>
                <span className="text-sm font-medium">Xverse</span>
              </a>
              <a
                href="https://vesu.xyz"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 opacity-50 hover:opacity-90 transition-opacity"
              >
                <Image
                  src="/vesu-logo.svg"
                  alt="Vesu"
                  width={24}
                  height={24}
                  className="rounded"
                />
                <span className="text-sm font-medium">Vesu</span>
              </a>
              <a
                href="https://ekubo.org"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 opacity-50 hover:opacity-90 transition-opacity"
              >
                <Image
                  src="/ekubo-logo.svg"
                  alt="Ekubo"
                  width={24}
                  height={24}
                  className="rounded"
                />
                <span className="text-sm font-medium">Ekubo</span>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-accent/10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <p className="text-xs opacity-30">
                4 contracts on Starknet Mainnet
              </p>
              <span className="text-xs opacity-20">|</span>
              <p className="text-xs opacity-30">22 tests passing</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs opacity-20">Built with</span>
              <a
                href="https://scaffoldstark.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs opacity-30 hover:opacity-60 transition-opacity"
              >
                Scaffold-Stark
              </a>
              <span className="text-xs opacity-20">|</span>
              <span className="text-xs opacity-30">
                Starknet Hackathon 2025
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
