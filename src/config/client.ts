import { createPublicClient, http } from "viem";
import { arcTestnet } from "./chain";

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});
