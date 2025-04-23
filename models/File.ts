import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
    unique: true,
  },
  folderPath: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  extension: {
    type: String,
    required: true,
  },
  keywords: [{
    type: String,
  }],
  thumbnailPath: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.File || mongoose.model('File', FileSchema); 