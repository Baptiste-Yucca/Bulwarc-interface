import { useState, useEffect } from "react";
import { publicClient } from "../config/client";
import { BULWARC_ADDRESS } from "../config/contracts";

interface Props {
  onClose: () => void;
}

const TREASURY_ABI = [
  {
    type: "function", name: "treasuryUSDC", inputs: [],
    outputs: [{ name: "", type: "uint256" }], stateMutability: "view",
  },
  {
    type: "function", name: "treasuryEURC", inputs: [],
    outputs: [{ name: "", type: "uint256" }], stateMutability: "view",
  },
  {
    type: "function", name: "feeBps", inputs: [],
    outputs: [{ name: "", type: "uint256" }], stateMutability: "view",
  },
] as const;

const fmt6 = (v: bigint) => (Number(v) / 1e6).toFixed(2);

export function Treasury({ onClose }: Props) {
  const [usdc, setUsdc] = useState<bigint | null>(null);
  const [eurc, setEurc] = useState<bigint | null>(null);
  const [feeBps, setFeeBps] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [u, e, f] = await Promise.all([
          publicClient.readContract({ address: BULWARC_ADDRESS, abi: TREASURY_ABI, functionName: "treasuryUSDC" }),
          publicClient.readContract({ address: BULWARC_ADDRESS, abi: TREASURY_ABI, functionName: "treasuryEURC" }),
          publicClient.readContract({ address: BULWARC_ADDRESS, abi: TREASURY_ABI, functionName: "feeBps" }),
        ]);
        setUsdc(u);
        setEurc(e);
        setFeeBps(f);
      } catch (err) {
        console.error("Treasury fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass rounded-2xl max-w-sm w-full p-6 animate-glow-pulse" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-accent glow-amber font-mono">Protocol Treasury</h2>
          <button onClick={onClose} className="text-dim hover:text-white text-xl leading-none cursor-pointer">&times;</button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-dim text-sm font-mono animate-pulse">Loading...</div>
        ) : (
          <div className="space-y-4">
            {/* Fee rate */}
            <div className="bg-bg/60 rounded-xl p-4 text-center">
              <div className="text-[10px] uppercase tracking-widest text-dim font-mono mb-1">Fee Rate</div>
              <div className="text-2xl font-bold font-mono text-accent glow-amber">
                {feeBps !== null ? `${Number(feeBps) / 100}%` : "-"}
              </div>
              <div className="text-[10px] text-dim font-mono mt-1">Applied on both premium and collateral</div>
            </div>

            {/* Balances */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg/60 rounded-xl p-4 text-center">
                <div className="text-[10px] uppercase tracking-widest text-dim font-mono mb-1">USDC</div>
                <div className="text-lg font-bold font-mono text-cyan glow-cyan">
                  {usdc !== null ? fmt6(usdc) : "-"}
                </div>
              </div>
              <div className="bg-bg/60 rounded-xl p-4 text-center">
                <div className="text-[10px] uppercase tracking-widest text-dim font-mono mb-1">EURC</div>
                <div className="text-lg font-bold font-mono text-neon-pink glow-pink">
                  {eurc !== null ? fmt6(eurc) : "-"}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="text-[10px] text-dim font-mono text-center leading-relaxed">
              Fees are collected from subscribers (on fund) and guardians (on match) in the token they deposit. Treasury accumulates in both USDC and EURC.
            </div>

            {/* Contract link */}
            <a
              href={`https://testnet.arcscan.app/address/${BULWARC_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-xs text-accent hover:underline font-mono"
            >
              View contract on ArcScan &rarr;
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
