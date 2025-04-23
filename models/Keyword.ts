import mongoose from 'mongoose';

export interface IKeyword {
  _id: mongoose.Types.ObjectId;
  value: string;
  count: number;
  createdAt: Date;
  updatedAt: Date;
}

const KeywordSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  count: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create indexes
KeywordSchema.index({ value: 1 });

const Keyword = mongoose.models.Keyword || mongoose.model('Keyword', KeywordSchema);

export default Keyword; 