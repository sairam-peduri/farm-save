import { Connection, PublicKey } from "@solana/web3.js";
import * as dotenv from "dotenv";
dotenv.config();

const connection = new Connection(process.env.RPC_URL!, "confirmed");

export async function getSOLBalance(pubkeyStr: string) {
  const pubkey = new PublicKey(pubkeyStr);
  const balance = await connection.getBalance(pubkey);
  return balance / 1e9; // in SOL
}
