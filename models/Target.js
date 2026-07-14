import mongoose from 'mongoose';

const TargetSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Seller name or Profile name
  targetAmount: { type: Number, required: true },
  month: { type: String, required: true }, // e.g., 'july_26'
}, { timestamps: true });

export default mongoose.models.Target || mongoose.model('Target', TargetSchema);
