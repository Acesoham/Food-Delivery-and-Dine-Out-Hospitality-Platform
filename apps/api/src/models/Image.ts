import mongoose, { Schema, Document } from 'mongoose';

export interface ImageDocument extends Document {
  data: Buffer;
  contentType: string;
  uploadedBy: mongoose.Types.ObjectId;
  relatedId: mongoose.Types.ObjectId;
  relatedType: 'restaurant' | 'menuItem';
  createdAt: Date;
}

const imageSchema = new Schema<ImageDocument>(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    relatedId: { type: Schema.Types.ObjectId, required: true },
    relatedType: { type: String, enum: ['restaurant', 'menuItem'], required: true },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

imageSchema.index({ relatedId: 1, relatedType: 1 });
imageSchema.index({ uploadedBy: 1 });

export const Image = mongoose.model<ImageDocument>('Image', imageSchema);
