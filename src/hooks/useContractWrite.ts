import { useCallback, useState } from "react";
import type { WalletClient, Address } from "viem";
import { publicClient } from "../config/client";
import {
  BULWARC_ADDRESS,
  BULWARC_ABI,
  ERC20_ABI,
  USDC_ADDRESS,
  EURC_ADDRESS,
} from "../config/contracts";

export function useContractWrite(walletClient: WalletClient | null) {
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
      await publicClient.waitForTransactionReceipt({ hash });
    },
    [walletClient]
  );

  const exec = useCallback(
    async (
      functionName: string,
      args: unknown[],
      approve?: { token: Address; amount: bigint }
    ) => {
      if (!walletClient?.account) throw new Error("Not connected");
      setPending(true);
      try {
        if (approve && approve.amount > 0n) {
          await approveToken(approve.token, approve.amount);
        }
        // Simulate first to get a clear revert reason
        const { request } = await publicClient.simulateContract({
          address: BULWARC_ADDRESS,
          abi: BULWARC_ABI,
          functionName,
          args,
          account: walletClient.account,
        } as any);
        const hash = await walletClient.writeContract(request as any);
        await publicClient.waitForTransactionReceipt({ hash });
      } catch (err) {
        console.error(`[BulwArc] ${functionName} failed:`, err);
        throw err;
      } finally {
        setPending(false);
      }
    },
    [walletClient, approveToken]
  );

  return { exec, pending, USDC_ADDRESS, EURC_ADDRESS };
}
