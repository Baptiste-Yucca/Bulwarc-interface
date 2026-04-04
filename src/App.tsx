import { useState } from "react";
import { useWallet } from "./hooks/useWallet";
import { useShields } from "./hooks/useShields";
import { Header } from "./components/Header";
import { CreateShield } from "./components/CreateShield";
import { ShieldList } from "./components/ShieldList";
import { ShieldDetail } from "./components/ShieldDetail";
import type { CurrencyMode } from "./config/display";
import "./App.css";

type Tab = "shields" | "create";

function App() {
  const { address, walletClient, connect, disconnect, connecting } = useWallet();
  const { shields, oraclePrice, loading, refresh } = useShields();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("shields");
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>("EUR/USD");

  const selectedShield = selectedId !== null
    ? shields.find((s) => s.id === selectedId) ?? null
    : null;

  return (
    <div className="app">
      <Header
        address={address}
        connecting={connecting}
        onConnect={connect}
        onDisconnect={disconnect}
        oraclePrice={oraclePrice}
        currencyMode={currencyMode}
        onToggleCurrency={() =>
          setCurrencyMode((m) => (m === "EUR/USD" ? "USD/EUR" : "EUR/USD"))
        }
      />

      <nav className="tabs">
        <button
          className={`tab ${tab === "shields" ? "active" : ""}`}
          onClick={() => setTab("shields")}
        >
          Shields
        </button>
        <button
          className={`tab ${tab === "create" ? "active" : ""}`}
          onClick={() => setTab("create")}
        >
          + New Shield
        </button>
      </nav>

      <main className="main">
        {tab === "create" && (
          <CreateShield
            walletClient={walletClient}
            currencyMode={currencyMode}
            onSuccess={() => {
              refresh();
              setTab("shields");
            }}
          />
        )}

        {tab === "shields" && (
          <div className="shields-layout">
            <ShieldList
              shields={shields}
              loading={loading}
              selectedId={selectedId}
              onSelect={setSelectedId}
              currencyMode={currencyMode}
            />
            {selectedShield && (
              <ShieldDetail
                shield={selectedShield}
                walletClient={walletClient}
                address={address}
                oraclePrice={oraclePrice}
                currencyMode={currencyMode}
                onSuccess={refresh}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
