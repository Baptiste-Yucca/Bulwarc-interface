import { useState } from "react";
import { useWallet } from "./hooks/useWallet";
import { useShields } from "./hooks/useShields";
import { Sidebar, type Page } from "./components/Sidebar";
import { CreateShield } from "./components/CreateShield";
import { ShieldList } from "./components/ShieldList";
import { ShieldDetail } from "./components/ShieldDetail";
import { MySalary } from "./components/MySalary";
import type { CurrencyMode } from "./config/display";
import "./App.css";

function App() {
  const { address, walletClient, connect, disconnect, connecting } = useWallet();
  const { shields, oraclePrice, loading, refresh } = useShields();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [page, setPage] = useState<Page>("all-offers");
  const [creating, setCreating] = useState(false);
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>("EUR/USD");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const selectedShield = selectedId !== null
    ? shields.find((s) => s.id === selectedId) ?? null
    : null;

  const myShields = address
    ? shields.filter((s) => s.subscriber.toLowerCase() === address.toLowerCase())
    : [];

  const mySalaryShields = address
    ? shields.filter(
        (s) =>
          s.status === 3 &&
          s.subscriber.toLowerCase() === address.toLowerCase()
      )
    : [];

  const short = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return (
    <div className={`app-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar
        activePage={page}
        onNavigate={(p) => {
          setPage(p);
          setCreating(false);
          setSelectedId(null);
        }}
        currencyMode={currencyMode}
        onToggleCurrency={() =>
          setCurrencyMode((m) => (m === "EUR/USD" ? "USD/EUR" : "EUR/USD"))
        }
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="hamburger"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Menu"
            >
              <span /><span /><span />
            </button>
            <h2 className="page-title">
              {page === "your-shields" && "Your Shields"}
              {page === "all-offers" && "All Offers"}
              {page === "my-salary" && "My Salary"}
            </h2>
          </div>
          <div className="topbar-right">
            {address ? (
              <div className="wallet-info">
                <span className="address-badge">{short}</span>
                <button className="btn btn-outline btn-sm" onClick={disconnect}>
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                className="btn btn-primary"
                onClick={connect}
                disabled={connecting}
              >
                {connecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </header>

        <main className="content">
          {page === "your-shields" && (
            <>
              <div className="content-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => setCreating(!creating)}
                >
                  {creating ? "Cancel" : "+ New Shield"}
                </button>
              </div>

              {creating && (
                <CreateShield
                  walletClient={walletClient}
                  currencyMode={currencyMode}
                  onSuccess={() => {
                    refresh();
                    setCreating(false);
                  }}
                />
              )}

              <div className="shields-layout">
                <ShieldList
                  shields={myShields}
                  loading={loading}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  currencyMode={currencyMode}
                  emptyMessage="You haven't created any shields yet."
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
            </>
          )}

          {page === "all-offers" && (
            <div className="shields-layout">
              <ShieldList
                shields={shields}
                loading={loading}
                selectedId={selectedId}
                onSelect={setSelectedId}
                currencyMode={currencyMode}
                emptyMessage="No shields on the market yet."
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

          {page === "my-salary" && (
            <MySalary
              shields={mySalaryShields}
              loading={loading}
              currencyMode={currencyMode}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
