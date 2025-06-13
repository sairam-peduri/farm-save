import { Connection, LAMPORTS_PER_SOL, PublicKey, clusterApiUrl } from '@solana/web3.js';
import cors from 'cors';
import express from 'express';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Use Solana Devnet
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// ✅ GET Balance
app.get('/balance/:pubkey', async (req, res) => {
  try {
    const pubkey = new PublicKey(req.params.pubkey);
    const balance = await connection.getBalance(pubkey);
    res.json({ balance: balance / LAMPORTS_PER_SOL });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Invalid public key' });
  }
});

// ✅ POST Airdrop 1 SOL
app.post('/airdrop/:pubkey', async (req, res) => {
  try {
    const pubkey = new PublicKey(req.params.pubkey);
    const signature = await connection.requestAirdrop(pubkey, LAMPORTS_PER_SOL);
    await connection.confirmTransaction(signature, 'confirmed');
    res.json({ success: true, signature });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Airdrop failed' });
  }
});

// ✅ Simulated Deposit Farm Route
app.post('/farm/deposit', async (req, res) => {
  const { pubkey, amount } = req.body;

  if (!pubkey || !amount || isNaN(amount)) {
    return res.status(400).json({ error: 'Invalid pubkey or amount' });
  }

  // Simulate storing yield info in a DB (not implemented)
  console.log(`📥 Deposit from ${pubkey} — Amount: ${amount} SOL`);

  const estimatedYield = amount * 0.05; // 5% yield simulation
  res.json({ success: true, estimatedYield });
});

// ✅ Server Start
app.listen(PORT, () => {
  console.log(`🚀 SolFarm backend running on http://localhost:${PORT}`);
});
