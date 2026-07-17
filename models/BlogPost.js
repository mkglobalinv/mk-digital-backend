import mongoose from 'mongoose';

const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true }, // Will now store rich HTML
  image: { type: String, required: true }, // Acts as featuredImage
  slug: { type: String, required: true, unique: true },
  
  // New fields for modern media/marketing system
  category: { type: String, default: 'News' },
  tags: { type: [String], default: [] },
  status: { type: String, enum: ['Draft', 'Published'], default: 'Published' }, // Default Published so old posts still show
  views: { type: Number, default: 0 },
  author: { type: String, default: 'Admin' },
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' }
}, {
  timestamps: true,
});

export default mongoose.model('BlogPost', blogPostSchema);
