import express from 'express';

const router = express.Router();

interface BudgetData {
  pubkey: string;
  savings: number;
  goals: string[];
}

const budgetStore: Record<string, BudgetData> = {};

// Save or update savings
router.post('/save', (req, res) => {
  const { pubkey, savings, goals } = req.body;
  if (!pubkey || isNaN(savings)) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  budgetStore[pubkey] = {
    pubkey,
    savings,
    goals: goals || [],
  };

  res.json({ success: true, data: budgetStore[pubkey] });
});

// Get savings data
router.get('/:pubkey', (req, res) => {
  const data = budgetStore[req.params.pubkey];
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

export default router;
