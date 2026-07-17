import mongoose, { Schema, model, models } from 'mongoose';

export interface IBlogPost {
  title: string;
  content: string;
  image: string;
  slug: string;
  createdAt: Date;
}

const BlogPostSchema = new Schema<IBlogPost>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
}, {
  timestamps: true,
});

const BlogPost = models.BlogPost || model<IBlogPost>('BlogPost', BlogPostSchema);

export default BlogPost;
