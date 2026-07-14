import mongoose from 'mongoose';

const RecordSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  profileName: { type: String, default: '' },
  sellerName: { type: String, default: '' },
  clientName: { type: String, default: '' },
  clientUrl: { type: String, default: '' },
  serviceLine: { type: String, default: '' },
  amount: { type: Number, default: 0 }, // For achieved USD amounts
  status: { type: String, required: true }, // E.g., 'Brief', 'Converted', 'Cancel', etc.
  month: { type: String }, // Stores the original tab name, e.g. "July_26"
  
  // Distinguishes between rows that came from the "Main" pipeline tab vs the "Achieved" revenue tab
  type: { type: String, enum: ['MAIN', 'ACHIEVED'], default: 'MAIN' },
}, { timestamps: true });

export default mongoose.models.Record || mongoose.model('Record', RecordSchema);
