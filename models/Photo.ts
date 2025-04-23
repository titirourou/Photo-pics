import mongoose from 'mongoose';

export interface IPhoto {
  _id: mongoose.Types.ObjectId;
  path: string;
  name: string;
  keywords: string[];
  thumbnailPath?: string;
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
    size?: number;
    takenAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const photoSchema = new mongoose.Schema<IPhoto>(
  {
    path: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    keywords: { type: [String], default: [] },
    thumbnailPath: String,
    metadata: {
      width: Number,
      height: Number,
      format: String,
      size: Number,
      takenAt: Date,
    },
  },
  { timestamps: true }
);

// Create indexes
photoSchema.index({ path: 1 });
photoSchema.index({ keywords: 1 });

const Photo = mongoose.models.Photo || mongoose.model<IPhoto>('Photo', photoSchema);

export default Photo; 