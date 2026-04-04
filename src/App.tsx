import { useState } from "react";
import { useWallet } from "./hooks/useWallet";
import { useShields } from "./hooks/useShields";
import { Header } from "./components/Header";
import { OrderBook } from "./components/OrderBook";
import { ShieldDetail } from "./components/ShieldDetail";
import { CreateShield } from "./components/CreateShield";
import { MySalary } from "./components/MySalary";
import { ShieldList } from "./components/ShieldList";
import type { CurrencyMode } from "./config/display";
import "./App.css";

type Modal = "none" | "detail" | "create" | "my-shields" | "my-salary";

function App() {
  const { address, walletClient, connect, disconnect, connecting } = useWallet();
  const { shields, oraclePrice, loading, refresh } = useShields();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [modal, setModal] = useState<Modal>("none");
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>("EUR/USD");

  const selectedShield = selectedId !== null
    ? shields.find((s) => s.id === selectedId) ?? null
    : null;

  const myShields = address
    ? shields.filter((s) => s.subscriber.toLowerCase() === address.toLowerCase())
    : [];

  const mySalaryShields = address
    ? shields.filter((s) => s.status === 3 && s.subscriber.toLowerCase() === address.toLowerCase())
    : [];

  const openDetail = (id: number) => {
    setSelectedId(id);
    setModal("detail");
  };

  const closeModal = () => {
    setModal("none");
    setSelectedId(null);
  };

  return (
    <div className="min-h-screen bg-bg text-slate-200 font-sans relative">
      {/* Header */}
      <Header
        address={address}
        connecting={connecting}
        onConnect={connect}
        onDisconnect={disconnect}
        currencyMode={currencyMode}
        onToggleCurrency={() => setCurrencyMode((m) => (m === "EUR/USD" ? "USD/EUR" : "EUR/USD"))}
      />

      {/* Main content: Order Book */}
      <main className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-dim uppercase tracking-[0.2em] font-mono">
            Order Book
          </h2>
          <div className="flex items-center gap-2 text-[10px] text-dim font-mono">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse-dot" />
            {shields.filter((s) => s.status <= 2).length} active shields
          </div>
        </div>

        <OrderBook
          shields={shields}
          loading={loading}
          onSelect={openDetail}
          currencyMode={currencyMode}
        />
      </main>

      {/* Bottom action bar — only when connected */}
      {address && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-accent/15 bg-bg/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3">
            <button
              onClick={() => setModal("create")}
              className="px-5 py-2 bg-accent hover:bg-accent/80 text-black font-bold rounded-lg text-sm transition-all cursor-pointer"
            >
              + Create Shield
            </button>
            <button
              onClick={() => setModal("my-shields")}
              className="px-4 py-2 border border-cyan/30 text-cyan rounded-lg text-sm font-mono hover:bg-cyan/10 transition-all cursor-pointer"
            >
              My Shields ({myShields.length})
            </button>
            <button
              onClick={() => setModal("my-salary")}
              className="px-4 py-2 border border-neon-green/30 text-neon-green rounded-lg text-sm font-mono hover:bg-neon-green/10 transition-all cursor-pointer"
            >
              My Salary
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {modal === "detail" && selectedShield && (
        <ShieldDetail
          shield={selectedShield}
          walletClient={walletClient}
          address={address}
          oraclePrice={oraclePrice}
          currencyMode={currencyMode}
          onSuccess={() => { refresh(); closeModal(); }}
          onClose={closeModal}
        />
      )}

      {modal === "create" && (
        <CreateShield
          walletClient={walletClient}
          currencyMode={currencyMode}
          onSuccess={() => { refresh(); closeModal(); }}
          onClose={closeModal}
        />
      )}

      {modal === "my-shields" && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeModal}>
          <div className="glass rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 animate-glow-pulse" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-cyan glow-cyan font-mono">My Shields</h2>
              <button onClick={closeModal} className="text-dim hover:text-white text-xl leading-none cursor-pointer">&times;</button>
            </div>
            <ShieldList
              shields={myShields}
              loading={loading}
              selectedId={null}
              onSelect={(id) => { closeModal(); setTimeout(() => openDetail(id), 100); }}
              currencyMode={currencyMode}
              emptyMessage="You haven't created any shields yet."
            />
          </div>
        </div>
      )}

      {modal === "my-salary" && (
        <MySalary
          shields={mySalaryShields}
          loading={loading}
          currencyMode={currencyMode}
          onClose={closeModal}
        />
      )}

      {/* Bottom padding so content doesn't get hidden behind bottom bar */}
      <div className="h-16" />
    </div>
  );
}

export default App;
