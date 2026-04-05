import { useState, useMemo } from "react";
import { useWallet } from "./hooks/useWallet";
import { useShields } from "./hooks/useShields";
import { useTxToast } from "./hooks/useTxToast";
import { Header } from "./components/Header";
import { OrderBook } from "./components/OrderBook";
import { ShieldDetail } from "./components/ShieldDetail";
import { CreateShield } from "./components/CreateShield";
import { MySalary } from "./components/MySalary";
import { MyShields } from "./components/MyShields";
import { FilterModal, DEFAULT_FILTERS, type Filters } from "./components/FilterModal";
import { Billing } from "./components/Billing";
import { CallFlow } from "./components/CallFlow";
import { TxToasts } from "./components/TxToasts";
import type { CurrencyMode } from "./config/display";
import type { TxCallbacks } from "./hooks/useContractWrite";
import "./App.css";

type Modal = "none" | "detail" | "create" | "my-shields" | "my-salary" | "billing" | "filters" | "callflow";

function App() {
  const { address, walletClient, connect, disconnect, connecting } = useWallet();
  const { shields, oraclePrice, loading, refresh } = useShields();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [modal, setModal] = useState<Modal>("none");
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>("EUR/USD");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const { toasts, addToast, updateToast } = useTxToast();

  const txCallbacks: TxCallbacks = useMemo(() => ({
    onTxSent: addToast,
    onTxConfirmed: (id: number) => updateToast(id, "ok"),
    onTxFailed: (id: number) => updateToast(id, "error"),
  }), [addToast, updateToast]);

  const selectedShield = selectedId !== null
    ? shields.find((s) => s.id === selectedId) ?? null
    : null;

  const myShields = address
    ? shields.filter((s) => s.subscriber.toLowerCase() === address.toLowerCase())
    : [];

  const mySalaryShields = address
    ? shields.filter((s) => s.status === 3 && s.subscriber.toLowerCase() === address.toLowerCase())
    : [];

  // Billable = funded shields (status >= 1, i.e. not CREATED)
  const myBillableShields = address
    ? shields.filter((s) => s.status >= 1 && s.subscriber.toLowerCase() === address.toLowerCase())
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
      {/* Tx notifications */}
      <TxToasts toasts={toasts} />

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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setModal("filters")}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-[10px] text-dim font-mono hover:border-accent/40 hover:text-accent transition-all cursor-pointer"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {(filters.sortBy !== "strike" || !filters.descending || filters.direction !== "all" || filters.hiddenStatuses.size > 0) && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </button>
            <div className="flex items-center gap-2 text-[10px] text-dim font-mono">
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse-dot" />
              {shields.filter((s) => s.status <= 2).length} active
            </div>
          </div>
        </div>

        <OrderBook
          shields={shields}
          loading={loading}
          onSelect={openDetail}
          currencyMode={currencyMode}
          filters={filters}
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
            {myBillableShields.length > 0 && (
              <button
                onClick={() => setModal("billing")}
                className="px-4 py-2 border border-accent/30 text-accent rounded-lg text-sm font-mono hover:bg-accent/10 transition-all cursor-pointer"
              >
                Billing
              </button>
            )}
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
          txCallbacks={txCallbacks}
          onSuccess={() => { refresh(); closeModal(); }}
          onClose={closeModal}
          onViewFlow={(id) => { setSelectedId(id); setModal("callflow"); }}
        />
      )}

      {modal === "create" && (
        <CreateShield
          walletClient={walletClient}
          currencyMode={currencyMode}
          txCallbacks={txCallbacks}
          onSuccess={() => { refresh(); closeModal(); }}
          onClose={closeModal}
        />
      )}

      {modal === "my-shields" && (
        <MyShields
          shields={myShields}
          loading={loading}
          currencyMode={currencyMode}
          onSelect={(id) => { closeModal(); setTimeout(() => openDetail(id), 100); }}
          onClose={closeModal}
        />
      )}

      {modal === "my-salary" && (
        <MySalary
          shields={mySalaryShields}
          loading={loading}
          currencyMode={currencyMode}
          onClose={closeModal}
        />
      )}

      {modal === "callflow" && selectedShield && (
        <CallFlow
          shield={selectedShield}
          currencyMode={currencyMode}
          onClose={closeModal}
        />
      )}

      {modal === "billing" && (
        <Billing
          shields={myBillableShields}
          currencyMode={currencyMode}
          onClose={closeModal}
        />
      )}

      {modal === "filters" && (
        <FilterModal
          filters={filters}
          onChange={setFilters}
          onClose={closeModal}
        />
      )}

      {/* Bottom padding so content doesn't get hidden behind bottom bar */}
      <div className="h-16" />
    </div>
  );
}

export default App;
