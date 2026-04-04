import { useState, useCallback, useEffect } from "react";
import {
  createWalletClient,
  custom,
  type WalletClient,
  type Address,
  getAddress,
} from "viem";
import { arcTestnet } from "../config/chain";

export function useWallet() {
  const [address, setAddress] = useState<Address | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert("Please install a Web3 wallet (MetaMask, etc.)");
      return;
    }
    setConnecting(true);
    try {
      const [addr] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const client = createWalletClient({
        account: getAddress(addr),
        chain: arcTestnet,
        transport: custom(window.ethereum),
      });
      setAddress(getAddress(addr));
      setWalletClient(client);

      // Try to switch to Arc Testnet
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x4CE4D2" }],
        });
      } catch (e: unknown) {
        const err = e as { code?: number };
        if (err.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x4CE4D2",
                chainName: "Arc Testnet",
                rpcUrls: ["https://rpc.testnet.arc.network"],
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              },
            ],
          });
        }
      }
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setWalletClient(null);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(getAddress(accounts[0]));
      }
    };
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [disconnect]);

  return { address, walletClient, connect, disconnect, connecting };
}
