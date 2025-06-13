import { Connection, LAMPORTS_PER_SOL, PublicKey, clusterApiUrl } from '@solana/web3.js';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';

const app = express();
app.use(cors(), express.json());
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// MongoDB connection
mongoose.connect('mongodb+srv://peduriatwork:RBEvqtKGIatuyNsv@cluster0.udeax5u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
} as any).then(() => console.log('✅ Connected to MongoDB')).catch(console.error);

// MongoDB Schemas
const userSchema = new mongoose.Schema({
  pubkey: String,
  email: String,
  verified: Boolean,
  tier: { type: String, default: 'Free' },
});

const budgetSchema = new mongoose.Schema({
  pubkey: String,
  amount: Number,
  timestamp: Number,
});

const User = mongoose.model('User', userSchema);
const Budget = mongoose.model('Budget', budgetSchema);

// In-memory storage
const balances: Record<string, number> = {};
const history: Record<string, any[]> = {};

// Routes

app.get('/balance/:pubkey', async (req, res) => {
  try {
    const pub = new PublicKey(req.params.pubkey);
    const lamports = await connection.getBalance(pub);
    res.json({ balance: lamports / LAMPORTS_PER_SOL });
  } catch {
    res.status(400).json({ error: 'Invalid pubkey' });
  }
});

app.post('/airdrop/:pubkey', async (req, res) => {
  try {
    const pub = new PublicKey(req.params.pubkey);
    const sig = await connection.requestAirdrop(pub, LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig);
    if (!history[req.params.pubkey]) history[req.params.pubkey] = [];
    history[req.params.pubkey].push({
      type: 'airdrop',
      amount: 1,
      timestamp: Date.now(),
      txSig: sig,
    });
    res.json({ signature: sig });
  } catch {
    res.status(500).json({ error: 'Airdrop failed' });
  }
});

app.post('/deposit', (req, res) => {
  const { pubkey, amount } = req.body;
  if (!pubkey || isNaN(amount) || amount <= 0)
    return res.status(400).json({ error: 'Invalid amount' });

  balances[pubkey] = (balances[pubkey] || 0) + amount;
  history[pubkey] = history[pubkey] || [];
  history[pubkey].push({
    type: 'deposit',
    amount,
    timestamp: Date.now(),
  });
  res.json({ success: true, balance: balances[pubkey] });
});

app.post('/withdraw', (req, res) => {
  const { pubkey, amount } = req.body;
  const current = balances[pubkey] || 0;
  if (!pubkey || isNaN(amount) || amount <= 0)
    return res.status(400).json({ error: 'Invalid amount' });
  if (amount > current)
    return res.status(400).json({ error: 'Insufficient funds' });

  balances[pubkey] = current - amount;
  history[pubkey].push({
    type: 'withdraw',
    amount,
    timestamp: Date.now(),
  });
  res.json({ success: true, balance: balances[pubkey] });
});

app.get('/history/:pubkey', (req, res) => {
  res.json({ history: history[req.params.pubkey] || [] });
});

// 👤 Save Gmail-verified user
app.post('/user/email', async (req, res) => {
  const { pubkey, email } = req.body;
  if (!pubkey || !email) return res.status(400).json({ error: 'Missing info' });

  let user = await User.findOne({ pubkey });
  if (!user) user = new User({ pubkey, email, verified: true }); // Gmail = trusted
  else user.email = email;

  await user.save();
  res.json({ success: true });
});

// 📊 Tier-related routes
app.get('/tier/:pubkey', async (req, res) => {
  const user = await User.findOne({ pubkey: req.params.pubkey });
  if (!user) return res.json({ tier: 'Free', verified: false });
  res.json({ tier: user.tier, verified: user.verified, email: user.email });
});

app.post('/tier', async (req, res) => {
  const { pubkey, tier } = req.body;
  if (!pubkey || !tier) return res.status(400).json({ error: 'Missing info' });
  let user = await User.findOne({ pubkey });
  if (!user) user = new User({ pubkey, tier });
  else user.tier = tier;
  await user.save();
  res.json({ success: true });
});

// 💼 Budget routes
app.post('/budget/add', async (req, res) => {
  const { pubkey, amount } = req.body;
  if (!pubkey || isNaN(amount)) return res.status(400).json({ error: 'Invalid input' });

  await Budget.create({ pubkey, amount, timestamp: Date.now() });
  res.json({ success: true });
});

app.get('/budget/:pubkey', async (req, res) => {
  const records = await Budget.find({ pubkey: req.params.pubkey }).sort({ timestamp: -1 });
  res.json({ budget: records });
});

app.listen(4000, () => console.log('🚀 SolFarm backend running at http://localhost:4000'));
