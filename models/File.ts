import mongoose from 'mongoose';

export interface IFile {
  _id: mongoose.Types.ObjectId;
  path: string;
  filename: string;
  folderPath: string;
  extension: string;
  size: number;
  thumbnailPath: string;
  keywords: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new mongoose.Schema({
  path: {
    type: String,
    required: true,
    unique: true
  },
  filename: {
    type: String,
    required: true
  },
  folderPath: {
    type: String,
    required: true
  },
  extension: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  thumbnailPath: {
    type: String,
    required: true
  },
  keywords: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Keyword'
  }]
}, {
  timestamps: true
});

// Create indexes
FileSchema.index({ path: 1 });
FileSchema.index({ folderPath: 1 });
FileSchema.index({ keywords: 1 });

const File = mongoose.models.File || mongoose.model('File', FileSchema);

export default File; 