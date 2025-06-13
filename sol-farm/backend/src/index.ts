import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, clusterApiUrl, sendAndConfirmTransaction } from '@solana/web3.js';
import cors from 'cors';
import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import mongoose from 'mongoose';

import budgetRoutes from './budget';
import { User } from './models/User';



// ------ Setup ------

mongoose.connect('mongodb+srv://peduriatwork:RBEvqtKGIatuyNsv@cluster0.udeax5u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('MongoDB connected'))
  .catch(console.error);

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
const FARM_KEYPAIR = Keypair.fromSecretKey(
  Buffer.from(JSON.parse(fs.readFileSync('farm-wallet.json', 'utf8')))
);
const FARM_WALLET = FARM_KEYPAIR.publicKey;

interface TxRecord {
  type: 'airdrop' | 'deposit' | 'withdraw';
  amount: number;
  timestamp: number;
  txSig?: string;
}
const history: Record<string, TxRecord[]> = {};

// ------ Express Setup ------

const app = express();
app.use(cors());
app.use(express.json());
app.use('/budget', budgetRoutes);

// ✅ Email/Email verification
app.post('/user/email', async (req, res) => {
  const { pubkey, email } = req.body as { pubkey: string; email: string };
  if (!pubkey || !email) return res.status(400).json({ error: 'Invalid input' });

  const code = crypto.randomBytes(3).toString('hex');
  const user = await User.findOneAndUpdate(
    { pubkey },
    { email, verified: false, verificationCode: code },
    { upsert: true, new: true }
  );

  console.log(`🔐 Verification code for ${email}: ${code}`);
  res.json({ success: true });
});

app.post('/user/verify', async (req, res) => {
  const { pubkey, code } = req.body as { pubkey: string; code: string };
  if (!pubkey || !code) return res.status(400).json({ error: 'Invalid input' });

  const user = await User.findOne({ pubkey });
  if (user && user.verificationCode === code) {
    user.verified = true;
    user.verificationCode = '';
    await user.save();
    return res.json({ success: true });
  }
  res.status(400).json({ error: 'Invalid code' });
});

// ✅ Tier endpoints
app.get('/tier/:pubkey', async (req, res) => {
  const u = await User.findOne({ pubkey: req.params.pubkey });
  res.json({ tier: u?.tier || 'Free', verified: u?.verified || false, email: u?.email });
});
app.post('/tier', async (req, res) => {
  const { pubkey, tier } = req.body as { pubkey: string; tier: string };
  if (!pubkey || !['Free', 'Advanced', 'Prime'].includes(tier)) return res.status(400).json({ error: 'Invalid' });
  const u = await User.findOneAndUpdate({ pubkey }, { tier }, { upsert: true, new: true });
  res.json({ success: true, tier: u!.tier });
});

// ✅ Balance
app.get('/balance/:pubkey', async (req, res) => {
  try {
    const lamports = await connection.getBalance(new PublicKey(req.params.pubkey));
    res.json({ balance: lamports / LAMPORTS_PER_SOL });
  } catch {
    res.status(400).json({ error: 'Invalid pubkey' });
  }
});

// ✅ Airdrop
app.post('/airdrop/:pubkey', async (req, res) => {
  try {
    const sig = await connection.requestAirdrop(new PublicKey(req.params.pubkey), LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig);
    history[req.params.pubkey]?.push({ type: 'airdrop', amount: 1, timestamp: Date.now(), txSig: sig });
    res.json({ signature: sig });
  } catch {
    res.status(500).json({ error: 'Failed' });
  }
});

// ✅ Deposit (in-memory log)
app.post('/deposit', (req, res) => {
  const { pubkey, amount } = req.body as { pubkey: string; amount: number };
  history[pubkey] = history[pubkey] || [];
  history[pubkey].push({ type: 'deposit', amount, timestamp: Date.now() });
  res.json({ success: true });
});

// ✅ Withdraw (real Sol)
app.post('/withdraw', async (req, res) => {
  const { pubkey, amount } = req.body as { pubkey: string; amount: number };
  if (!pubkey || !amount) return res.status(400).json({ error: 'Invalid' });

  try {
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: FARM_WALLET,
        toPubkey: new PublicKey(pubkey),
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );
    const sig = await sendAndConfirmTransaction(connection, tx, [FARM_KEYPAIR]);
    history[pubkey].push({ type: 'withdraw', amount, timestamp: Date.now(), txSig: sig });
    res.json({ success: true, signature: sig });
  } catch {
    res.status(500).json({ error: 'Withdrawal failed' });
  }
});

// ✅ History
app.get('/history/:pubkey', (req, res) => res.json({ history: history[req.params.pubkey] || [] }));

// ✅ Root
app.get('/', (_r, res) => res.send('SolFarm API running with MongoDB'));

app.listen(4000, () => console.log('🚀 Backend listening on 4000'));
