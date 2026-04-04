import { useCallback, useState } from "react";
import type { WalletClient, Address } from "viem";
import { publicClient } from "../config/client";
import {
  BULWARC_ADDRESS,
  BULWARC_ABI,
  ERC20_ABI,
} from "../config/contracts";

export interface TxCallbacks {
  onTxSent: (hash: string, label: string) => number;
  onTxConfirmed: (id: number) => void;
  onTxFailed: (id: number) => void;
}

export function useContractWrite(walletClient: WalletClient | null, tx?: TxCallbacks) {
  const [pending, setPending] = useState(false);

  const approveToken = useCallback(
    async (token: Address, amount: bigint) => {
      if (!walletClient?.account) throw new Error("Not connected");
      const hash = await walletClient.writeContract({
        address: token,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [BULWARC_ADDRESS, amount],
      });
      const toastId = tx?.onTxSent(hash, "Approve token");
      await publicClient.waitForTransactionReceipt({ hash });
      if (toastId != null) tx?.onTxConfirmed(toastId);
    },
    [walletClient, tx]
  );

  const exec = useCallback(
    async (
      functionName: string,
      args: unknown[],
      approve?: { token: Address; amount: bigint }
    ) => {
      if (!walletClient?.account) throw new Error("Not connected");
      setPending(true);
      let toastId: number | undefined;
      try {
        if (approve && approve.amount > 0n) {
          await approveToken(approve.token, approve.amount);
        }
        const { request } = await publicClient.simulateContract({
          address: BULWARC_ADDRESS,
          abi: BULWARC_ABI,
          functionName,
          args,
          account: walletClient.account,
        } as any);
        const hash = await walletClient.writeContract(request as any);
        toastId = tx?.onTxSent(hash, functionName);
        await publicClient.waitForTransactionReceipt({ hash });
        if (toastId != null) tx?.onTxConfirmed(toastId);
      } catch (err) {
        console.error(`[BulwArc] ${functionName} failed:`, err);
        if (toastId != null) tx?.onTxFailed(toastId);
        throw err;
      } finally {
        setPending(false);
      }
    },
    [walletClient, approveToken, tx]
  );

  return { exec, pending };
}
