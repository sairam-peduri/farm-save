import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

const app = express();
app.use(cors(), express.json());

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// MongoDB Connection
mongoose.connect('mongodb+srv://peduriatwork:RBEvqtKGIatuyNsv@cluster0.udeax5u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Schemas
const loginSchema = new mongoose.Schema({ wallet: String, timestamp: Number, ip: String }, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  wallets: [String],
  verified: Boolean,
  tier: { type: String, default: 'Free' },
  loginHistory: [loginSchema],
});

const budgetSchema = new mongoose.Schema({
  pubkey: String,
  amount: Number,
  timestamp: Number,
});

const User = mongoose.model('User', userSchema);
const Budget = mongoose.model('Budget', budgetSchema);

// Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'solfarmmain76@gmail.com',
    pass: 'cloq cuyc clcz wsle', // Replace with secure app password
  },
});

// In-Memory Storage
const balances: Record<string, number> = {};
const history: Record<string, any[]> = {};

// 🔐 Register/Login Email with Wallet
app.post('/user/email', async (req, res) => {
  const { pubkey, email } = req.body;
  if (!pubkey || !email) return res.status(400).json({ error: 'Missing pubkey/email' });

  const ip = req.ip;
  const existingUser = await User.findOne({ email });

  // Check if wallet is linked to a different email
  const walletExists = await User.findOne({ wallets: pubkey, email: { $ne: email } });
  if (walletExists) {
    return res.status(403).json({ error: 'Wallet already linked to another email' });
  }

  if (!existingUser) {
    const newUser = new User({
      email,
      verified: true,
      wallets: [pubkey],
      loginHistory: [{ wallet: pubkey, timestamp: Date.now(), ip }],
    });
    await newUser.save();

    await transporter.sendMail({
      from: 'solfarmmain76@gmail.com',
      to: email,
      subject: '🎉 Welcome to SolFarm!',
      html: `<h2>Welcome to SolFarm!</h2><p>Your wallet <b>${pubkey}</b> is now registered.</p>`,
    });

    return res.json({ success: true, message: 'Registered and logged in' });
  }

  // Add new wallet to existing user if not already added
  if (!existingUser.wallets.includes(pubkey)) {
    existingUser.wallets.push(pubkey);
  }

  existingUser.loginHistory.push({ wallet: pubkey, timestamp: Date.now(), ip });
  await existingUser.save();

  res.json({ success: true, message: 'Logged in' });
});

// 🧾 Get Profile by Email
app.get('/user/profile/:email', async (req, res) => {
  const user = await User.findOne({ email: req.params.email });
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    email: user.email,
    wallets: user.wallets,
    tier: user.tier,
    verified: user.verified,
    loginHistory: user.loginHistory,
  });
});

// 🧾 Tier Info by Wallet
app.get('/tier/:pubkey', async (req, res) => {
  const user = await User.findOne({ wallets: req.params.pubkey });
  if (!user) return res.json({ tier: 'Free', verified: false });
  res.json({ tier: user.tier, verified: user.verified, email: user.email });
});

// Update Tier
app.post('/tier', async (req, res) => {
  const { pubkey, tier } = req.body;
  if (!pubkey || !tier) return res.status(400).json({ error: 'Missing info' });

  const user = await User.findOne({ wallets: pubkey });
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.tier = tier;
  await user.save();
  res.json({ success: true });
});

// 💰 Deposit
app.post('/deposit', (req, res) => {
  const { pubkey, amount } = req.body;
  if (!pubkey || isNaN(amount) || amount <= 0)
    return res.status(400).json({ error: 'Invalid amount' });

  balances[pubkey] = (balances[pubkey] || 0) + amount;
  history[pubkey] = history[pubkey] || [];
  history[pubkey].push({ type: 'deposit', amount, timestamp: Date.now() });

  res.json({ success: true, balance: balances[pubkey] });
});

// 💸 Withdraw
app.post('/withdraw', (req, res) => {
  const { pubkey, amount } = req.body;
  const current = balances[pubkey] || 0;

  if (!pubkey || isNaN(amount) || amount <= 0)
    return res.status(400).json({ error: 'Invalid amount' });
  if (amount > current)
    return res.status(400).json({ error: 'Insufficient funds' });

  balances[pubkey] = current - amount;
  history[pubkey].push({ type: 'withdraw', amount, timestamp: Date.now() });

  res.json({ success: true, balance: balances[pubkey] });
});

// 📊 Budget Tracking
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

// 🕓 History
app.get('/history/:pubkey', (req, res) => {
  res.json({ history: history[req.params.pubkey] || [] });
});

// 💵 Solana Wallet Balance
app.get('/balance/:pubkey', async (req, res) => {
  try {
    const pub = new PublicKey(req.params.pubkey);
    const lamports = await connection.getBalance(pub);
    res.json({ balance: lamports / LAMPORTS_PER_SOL });
  } catch {
    res.status(400).json({ error: 'Invalid pubkey' });
  }
});

// 🎁 Airdrop
app.post('/airdrop/:pubkey', async (req, res) => {
  try {
    const pub = new PublicKey(req.params.pubkey);
    const sig = await connection.requestAirdrop(pub, LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig);

    history[req.params.pubkey] = history[req.params.pubkey] || [];
    history[req.params.pubkey].push({ type: 'airdrop', amount: 1, timestamp: Date.now(), txSig: sig });

    res.json({ signature: sig });
  } catch {
    res.status(500).json({ error: 'Airdrop failed' });
  }
});

// Start Server
app.listen(4000, () => console.log('🚀 Backend running on http://localhost:4000'));
