import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"));

export async function getBalance(pubkey: string): Promise<number> {
  const publicKey = new PublicKey(pubkey);
  const balanceLamports = await connection.getBalance(publicKey);
  return balanceLamports / 1e9; // Convert lamports to SOL
}
