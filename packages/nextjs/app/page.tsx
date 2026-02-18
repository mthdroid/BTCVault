import Link from "next/link";
import Image from "next/image";

const Home = () => {

  return (
    <div className="flex items-center flex-col grow">
      {/* Hero Section */}
      <div className="w-full pt-8 pb-12 px-5 text-center relative overflow-hidden">
        {/* Dual glow: orange left + blue right */}
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(ellipse_at_top_left,_#F7931A_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(ellipse_at_top_right,_#0C0C4F_0%,_transparent_50%)]"></div>
        <div className="relative max-w-2xl mx-auto">
          {/* Powered by Starknet badge */}
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20">
            <Image src="/starknet-logo.svg" alt="Starknet" width={18} height={18} />
            <span className="text-sm font-medium" style={{ color: "#0C0C4F" }}>Live on Starknet Mainnet</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-3">
            <span className="text-primary">BTC</span>Vault
          </h1>
          <p className="text-lg opacity-70 mb-2">
            Non-custodial Bitcoin yield on <span style={{ color: "#0C0C4F" }}>Starknet</span>
          </p>
          <p className="text-sm opacity-40 mb-6 max-w-lg mx-auto">
            Bridge your BTC via Xverse, earn optimized yield through automated
            allocation between Vesu lending and Ekubo LP strategies.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/bridge" className="btn btn-primary btn-lg text-white shadow-lg shadow-primary/20">
              Bridge BTC
            </Link>
            <Link href="/vault" className="btn btn-outline border-primary/50 text-primary hover:bg-primary hover:text-white btn-lg">
              Enter Vault
            </Link>
            <Link href="/dashboard" className="btn btn-ghost btn-lg opacity-70">
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-container grow w-full px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">How it works</h2>
          <p className="text-center text-sm opacity-40 mb-10">From native BTC to DeFi yield in 4 steps</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { step: "1", title: "Connect Xverse", desc: "Connect your Xverse wallet to get both BTC and Starknet addresses in one click.", color: "bg-primary" },
              { step: "2", title: "Bridge BTC", desc: "Bridge native BTC to WBTC on Starknet via LayerSwap.", color: "bg-primary" },
              { step: "3", title: "Deposit WBTC", desc: "Deposit into the vault. The Router auto-allocates between Vesu and Ekubo.", color: "bg-accent" },
              { step: "4", title: "Earn Yield", desc: "Shares appreciate as yield accrues. Withdraw anytime to get WBTC + earned yield.", color: "bg-accent" },
            ].map((item) => (
              <div key={item.step} className="card-btc flex flex-col text-center items-center">
                <div className={`w-10 h-10 rounded-full ${item.color} text-white flex items-center justify-center text-lg font-bold mb-4`}>
                  {item.step}
                </div>
                <h3 className="font-bold text-base mb-2">{item.title}</h3>
                <p className="text-sm opacity-50">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strategies */}
        <div className="max-w-4xl mx-auto mt-20">
          <h2 className="text-2xl font-bold text-center mb-2">Dual Strategy Engine</h2>
          <p className="text-center text-sm opacity-40 mb-10">Automated yield optimization across two protocols</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-btc">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/vesu-logo.svg" alt="Vesu" width={40} height={40} className="rounded-xl" />
                <div>
                  <h3 className="font-bold text-lg">Vesu Lending</h3>
                  <p className="text-xs opacity-40">Low risk — Passive yield</p>
                </div>
              </div>
              <p className="text-sm opacity-50 mb-5">
                Deposit WBTC into Vesu V2 vToken pools (ERC-4626).
                Earn passive lending yield with auto-compounding.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="opacity-40">Type</span>
                  <span className="font-medium">Lending / Supply</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-40">Risk</span>
                  <span className="font-medium text-success">Low</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-40">Allocation</span>
                  <span className="font-medium text-primary">60%</span>
                </div>
              </div>
            </div>
            <div className="card-starknet">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/ekubo-logo.svg" alt="Ekubo" width={40} height={40} className="rounded-xl" />
                <div>
                  <h3 className="font-bold text-lg">Ekubo LP</h3>
                  <p className="text-xs opacity-40">Medium risk — Active yield</p>
                </div>
              </div>
              <p className="text-sm opacity-50 mb-5">
                Provide concentrated liquidity in WBTC pairs on Ekubo DEX.
                Higher yield potential with active management.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="opacity-40">Type</span>
                  <span className="font-medium">Liquidity Provision</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-40">Risk</span>
                  <span className="font-medium text-warning">Medium</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-40">Allocation</span>
                  <span className="font-medium text-accent">40%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Powered By Section */}
        <div className="max-w-4xl mx-auto mt-20">
          <h2 className="text-2xl font-bold text-center mb-3">Powered By</h2>
          <p className="text-center text-sm opacity-40 mb-10">The best protocols in the Starknet ecosystem</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <a href="https://starknet.io" target="_blank" rel="noreferrer" className="group relative overflow-hidden rounded-2xl bg-base-100 border border-accent/15 p-6 flex flex-col items-center justify-center text-center hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5 transition-all">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_center,_rgba(91,141,239,0.06)_0%,_transparent_70%)]"></div>
              <Image src="/starknet-logo.svg" alt="Starknet" width={48} height={48} className="mb-4 relative z-10" />
              <span className="font-bold text-sm relative z-10">Starknet</span>
              <span className="text-xs opacity-30 mt-1 relative z-10">L2 Network</span>
            </a>
            <a href="https://www.xverse.app" target="_blank" rel="noreferrer" className="group relative overflow-hidden rounded-2xl bg-base-100 border border-primary/15 p-6 flex flex-col items-center justify-center text-center hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_center,_rgba(247,147,26,0.06)_0%,_transparent_70%)]"></div>
              <div className="w-12 h-12 bg-[#1a1a2e] rounded-xl flex items-center justify-center mb-4 relative z-10">
                <Image src="/xverse-logo.svg" alt="Xverse" width={32} height={32} />
              </div>
              <span className="font-bold text-sm relative z-10">Xverse</span>
              <span className="text-xs opacity-30 mt-1 relative z-10">BTC Wallet</span>
            </a>
            <a href="https://vesu.xyz" target="_blank" rel="noreferrer" className="group relative overflow-hidden rounded-2xl bg-base-100 border border-primary/15 p-6 flex flex-col items-center justify-center text-center hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_center,_rgba(247,147,26,0.06)_0%,_transparent_70%)]"></div>
              <Image src="/vesu-logo.svg" alt="Vesu" width={48} height={48} className="rounded-xl mb-4 relative z-10" />
              <span className="font-bold text-sm relative z-10">Vesu</span>
              <span className="text-xs opacity-30 mt-1 relative z-10">Lending Protocol</span>
            </a>
            <a href="https://ekubo.org" target="_blank" rel="noreferrer" className="group relative overflow-hidden rounded-2xl bg-base-100 border border-accent/15 p-6 flex flex-col items-center justify-center text-center hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5 transition-all">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_center,_rgba(91,141,239,0.06)_0%,_transparent_70%)]"></div>
              <Image src="/ekubo-logo.svg" alt="Ekubo" width={48} height={48} className="rounded-xl mb-4 relative z-10" />
              <span className="font-bold text-sm relative z-10">Ekubo</span>
              <span className="text-xs opacity-30 mt-1 relative z-10">DEX Protocol</span>
            </a>
          </div>
          <p className="text-xs opacity-20 mt-10 text-center">
            4 smart contracts deployed on Starknet Mainnet | 22 tests passing
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
