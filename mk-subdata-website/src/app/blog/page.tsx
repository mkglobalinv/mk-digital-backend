"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, ArrowRight, Zap as Lightning, Search, Flame, LayoutGrid, List as ListIcon } from 'lucide-react';

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  
  const categories = ['All', 'News', 'Offers', 'Lifestyle', 'Sports'];

  useEffect(() => {
    fetchPosts();
    fetchTrending();
  }, [activeCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const url = activeCategory === 'All' 
        ? 'http://localhost:3000/api/announcements?limit=20'
        : `http://localhost:3000/api/announcements?category=${activeCategory}&limit=20`;
      
      const res = await fetch(url);
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/announcements?sort=trending&limit=5');
      const data = await res.json();
      setTrending(data);
    } catch (err) {
      console.error(err);
    }
  };

  const featuredPost = posts.length > 0 ? posts[0] : null;
  const gridPosts = posts.length > 1 ? posts.slice(1) : [];

  const extractExcerpt = (html: any) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || "";
    return text.length > 120 ? text.substring(0, 120) + "..." : text;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="fixed top-0 w-full z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold">
              <Lightning size={20} fill="white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">9JASUB</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-bold text-slate-500 hover:text-slate-900">Home</Link>
            <Link href="/services" className="text-sm font-bold text-slate-500 hover:text-slate-900">Services</Link>
            <Link href="https://app.9jasub.com/login" className="px-5 py-2.5 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
           <div>
             <h1 className="text-5xl font-black text-slate-900 tracking-tight">Our <span className="text-blue-600">Blog</span></h1>
             <p className="text-slate-500 font-medium mt-2">Latest news, updates, and offers.</p>
           </div>
           
           <div className="flex gap-2 p-1 bg-slate-200/50 rounded-full">
             {categories.map(cat => (
               <button 
                 key={cat}
                 onClick={() => setActiveCategory(cat)}
                 className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                   activeCategory === cat 
                   ? 'bg-white text-blue-600 shadow-sm' 
                   : 'text-slate-500 hover:text-slate-900'
                 }`}
               >
                 {cat}
               </button>
             ))}
           </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500 font-bold">Loading insights...</div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-12">
            
            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-12">
              
              {/* Featured Post */}
              {featuredPost && (
                <Link href={`/blog/${featuredPost.slug}`} className="block group">
                  <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                    <div className="h-[400px] w-full bg-slate-100 relative overflow-hidden">
                       {featuredPost.image ? (
                         <img src={featuredPost.image} alt={featuredPost.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                       ) : (
                         <div className="w-full h-full bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center">
                            <Lightning size={64} className="text-blue-200" />
                         </div>
                       )}
                       <div className="absolute top-6 left-6 px-4 py-1.5 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-full">
                         {featuredPost.category}
                       </div>
                    </div>
                    <div className="p-8 md:p-10 space-y-4">
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                        <span className="flex items-center gap-1"><Clock size={14} /> {new Date(featuredPost.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>By {featuredPost.author}</span>
                      </div>
                      <h2 className="text-3xl md:text-4xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                        {featuredPost.title}
                      </h2>
                      <p className="text-lg text-slate-500 leading-relaxed font-medium">
                        {extractExcerpt(featuredPost.content)}
                      </p>
                      <div className="pt-4 flex items-center gap-2 text-blue-600 font-bold">
                        Read Full Story <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Grid Posts */}
              {gridPosts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-black text-slate-900">Latest Posts</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    {gridPosts.map(post => (
                      <Link key={post._id} href={`/blog/${post.slug}`} className="block group">
                        <div className="bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all h-full flex flex-col">
                          <div className="h-48 w-full bg-slate-100 relative overflow-hidden">
                             {post.image ? (
                               <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                             ) : (
                               <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                  <Lightning size={32} className="text-slate-300" />
                               </div>
                             )}
                             <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-full">
                               {post.category}
                             </div>
                          </div>
                          <div className="p-6 flex flex-col flex-1">
                            <div className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
                               <Clock size={12} /> {new Date(post.createdAt).toLocaleDateString()}
                            </div>
                            <h4 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-3 leading-snug">
                              {post.title}
                            </h4>
                            <p className="text-sm text-slate-500 font-medium line-clamp-2 mt-auto">
                              {extractExcerpt(post.content)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {!featuredPost && gridPosts.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <Search size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">No posts found</h3>
                  <p className="text-slate-500 mt-2">Check back later for updates in this category.</p>
                </div>
              )}

            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              {/* Trending Posts */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                    <Flame size={20} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Trending Posts</h3>
                </div>
                
                <div className="space-y-6">
                  {trending.map((post: any, index: number) => (
                    <Link key={post._id} href={`/blog/${post.slug}`} className="flex gap-4 group">
                      <div className="text-4xl font-black text-slate-100 group-hover:text-blue-100 transition-colors w-8">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug text-sm mb-2">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>{post.category}</span>
                          <span>•</span>
                          <span>{post.views || 0} Views</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Newsletter Banner */}
              <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-40 h-40 bg-blue-500 rounded-full blur-[50px] opacity-50" />
                 <h3 className="text-2xl font-black mb-4 relative z-10">Never miss an update.</h3>
                 <p className="text-slate-400 text-sm font-medium mb-6 relative z-10">Get the latest VTU news, data rate slashes, and platform updates sent directly to your inbox.</p>
                 <div className="flex relative z-10">
                   <input type="email" placeholder="Email address" className="w-full bg-white/10 border border-white/10 rounded-l-xl px-4 py-3 text-sm outline-none focus:border-blue-500" />
                   <button className="bg-blue-600 px-4 py-3 rounded-r-xl font-bold text-sm hover:bg-blue-700 transition-colors">Join</button>
                 </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
