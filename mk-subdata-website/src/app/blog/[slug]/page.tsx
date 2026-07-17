"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, Clock, Zap as Lightning, Facebook, Twitter, Link2, MessageCircle
} from 'lucide-react';

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchPost();
      incrementViews();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/announcements/${slug}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setPost(data);
      fetchRelated(data.category, data._id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async () => {
    try {
      await fetch(`http://localhost:3000/api/announcements/${slug}/view`, { method: 'POST' });
    } catch (e) {}
  };

  const fetchRelated = async (category: any, excludeId: any) => {
    try {
      const res = await fetch(`http://localhost:3000/api/announcements?category=${category}&limit=4`);
      const data = await res.json();
      setRelated(data.filter((p: any) => p._id !== excludeId).slice(0, 3));
    } catch (err) {
      console.error(err);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const extractExcerpt = (html: any) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || "";
    return text.length > 80 ? text.substring(0, 80) + "..." : text;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 font-bold text-lg animate-pulse">Loading post...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-6">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">
           <Lightning size={32} />
        </div>
        <h1 className="text-3xl font-black text-slate-900">Post Not Found</h1>
        <Link href="/blog" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors">
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] bg-white/90 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors">
            <ArrowLeft size={20} /> Back to Blog
          </Link>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold">
              <Lightning size={20} fill="white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900 hidden sm:block">9JASUB</span>
          </Link>
        </div>
      </nav>

      {/* Article Header */}
      <header className="pt-40 pb-16 px-6 max-w-4xl mx-auto text-center">
        <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-widest rounded-full mb-8">
          {post.category}
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight mb-8">
          {post.title}
        </h1>
        <div className="flex items-center justify-center gap-4 text-sm font-bold text-slate-500">
          <span>By <span className="text-slate-900">{post.author}</span></span>
          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
          <span className="flex items-center gap-1.5"><Clock size={16} /> {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
          <span>{post.views || 0} Views</span>
        </div>
      </header>

      {/* Featured Image */}
      <div className="max-w-6xl mx-auto px-6 mb-16">
        <div className="w-full aspect-[21/9] bg-slate-100 rounded-[40px] overflow-hidden relative">
          {post.image ? (
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50">
               <Lightning size={80} className="text-blue-200" />
            </div>
          )}
        </div>
      </div>

      {/* Article Body */}
      <main className="max-w-3xl mx-auto px-6 pb-24">
        {/* Share Buttons (Floating on desktop, top on mobile) */}
        <div className="flex gap-4 mb-12 py-6 border-y border-slate-100 justify-center">
           <span className="font-bold text-slate-400 mr-2 flex items-center">Share:</span>
           <a href={`https://wa.me/?text=${encodeURIComponent(post.title + ' ' + window.location.href)}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors">
              <MessageCircle size={18} />
           </a>
           <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors">
              <Twitter size={18} />
           </a>
           <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center hover:bg-blue-100 transition-colors">
              <Facebook size={18} />
           </a>
           <button onClick={copyLink} className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors">
              <Link2 size={18} />
           </button>
        </div>

        {/* Content Render */}
        <article 
          className="prose prose-lg prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-blue-600 prose-img:rounded-3xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-16 pt-8 border-t border-slate-100 flex flex-wrap gap-2">
            <span className="text-sm font-bold text-slate-400 py-2 mr-2">Tags:</span>
            {post.tags.map((tag: any, i: any) => (
              <span key={i} className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-lg">
                {tag}
              </span>
            ))}
          </div>
        )}
      </main>

      {/* Related Posts */}
      {related.length > 0 && (
        <section className="bg-slate-50 py-24 px-6 border-t border-slate-200">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-3xl font-black text-slate-900 mb-12">More in {post.category}</h3>
            <div className="grid md:grid-cols-3 gap-8">
              {related.map(rPost => (
                <Link key={rPost._id} href={`/blog/${rPost.slug}`} className="block group">
                  <div className="bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all h-full flex flex-col">
                    <div className="h-48 w-full bg-slate-100 relative overflow-hidden">
                       {rPost.image ? (
                         <img src={rPost.image} alt={rPost.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                       ) : (
                         <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                            <Lightning size={32} className="text-slate-300" />
                         </div>
                       )}
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h4 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-3 leading-snug">
                        {rPost.title}
                      </h4>
                      <p className="text-sm text-slate-500 font-medium line-clamp-2 mt-auto">
                        {extractExcerpt(rPost.content)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
