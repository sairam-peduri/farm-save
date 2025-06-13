import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { Router } from 'express';

const farmRouter = Router();
const connection = new Connection('https://api.devnet.solana.com');

// Replace with your actual farm wallet (recipient)
const FARM_WALLET = new PublicKey('YourFarmWalletPublicKey');

farmRouter.post('/deposit', async (req, res) => {
  const { pubkey, amount } = req.body;
  if (!pubkey || !amount) return res.status(400).send('Missing pubkey or amount');

  try {
    const userPublicKey = new PublicKey(pubkey);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: FARM_WALLET,
        lamports: Number(amount) * LAMPORTS_PER_SOL,
      })
    );

    // ⚠️ This transaction must be signed client-side by the user's wallet
    const serializedTx = transaction.serialize({ requireAllSignatures: false });
    const base64Tx = serializedTx.toString('base64');

    res.json({ transaction: base64Tx });
  } catch (err) {
    console.error(err);
    res.status(500).send('Transaction creation failed');
  }
});

export default farmRouter;
