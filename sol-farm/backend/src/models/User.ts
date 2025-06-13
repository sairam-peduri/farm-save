import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  pubkey: { type: String, required: true, unique: true },
  tier: { type: String, enum: ['Free', 'Advanced', 'Prime'], default: 'Free' },
  email: { type: String },
  verified: { type: Boolean, default: false },
  verificationCode: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model('User', userSchema);
