import mongoose from 'mongoose';

const loginLogSchema = new mongoose.Schema({
  timestamp: Number,
  ip: String,
}, { _id: false });

const userSchema = new mongoose.Schema({
  pubkey: { type: String, required: true, unique: true },
  email: { type: String },
  verified: { type: Boolean, default: false },
  tier: { type: String, default: 'Free' },
  loginHistory: [loginLogSchema],
});

export default mongoose.model('User', userSchema);
