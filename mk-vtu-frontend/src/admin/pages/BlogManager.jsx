import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit2, Trash2, Search, CheckCircle, XCircle, 
  Image as ImageIcon, Bold, Italic, List, Link as LinkIcon, Heading
} from 'lucide-react';
import API from '../../api';
import './BlogManager.css';

const BlogManager = ({ token }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const editorRef = useRef(null);

  const defaultForm = {
    title: '',
    slug: '',
    category: 'News',
    tags: '',
    image: '',
    content: '',
    status: 'Published',
    author: 'Admin',
    metaTitle: '',
    metaDescription: ''
  };

  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = () => {
    setLoading(true);
    API.get('/api/admin/blog', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setPosts(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData({ ...formData, title, slug: editingItem ? formData.slug : slug });
  };

  const execCmd = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
        editorRef.current.focus();
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const contentHTML = editorRef.current?.innerHTML || formData.content;
    
    // Parse tags safely
    let parsedTags = [];
    if (typeof formData.tags === 'string') {
        parsedTags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
    } else if (Array.isArray(formData.tags)) {
        parsedTags = formData.tags;
    }

    const payload = { 
        ...formData, 
        content: contentHTML,
        tags: parsedTags
    };
    
    const request = editingItem 
      ? API.put(`/api/admin/blog/${editingItem._id}`, payload, { headers: { Authorization: `Bearer ${token}` } })
      : API.post('/api/admin/blog', payload, { headers: { Authorization: `Bearer ${token}` } });

    request.then(() => {
      setShowModal(false);
      setEditingItem(null);
      setFormData(defaultForm);
      fetchPosts();
    }).catch(err => alert(err.response?.data?.message || "Save failed"));
  };

  const deleteItem = (id) => {
    if(!window.confirm("Are you sure you want to delete this post?")) return;
    setDeleting(id);
    API.delete(`/api/admin/blog/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => fetchPosts())
      .catch(err => alert("Delete failed: " + (err.response?.data?.message || err.message)))
      .finally(() => setDeleting(null));
  };

  const openEditor = (item = null) => {
    if (item) {
        setEditingItem(item);
        setFormData({
            ...item,
            tags: item.tags ? item.tags.join(', ') : ''
        });
    } else {
        setEditingItem(null);
        setFormData(defaultForm);
    }
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    setUploadingImage(true);
    try {
      const res = await API.post('/api/admin/blog/upload', formDataUpload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setFormData({ ...formData, image: res.data.imageUrl });
    } catch (err) {
      alert("Failed to upload image: " + (err.response?.data?.message || err.message));
    } finally {
      setUploadingImage(false);
    }
  };

  const filteredPosts = posts.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="blog-manager-wrapper">
      <div className="manager-header">
        <div className="header-info">
          <h1>Blog & Media</h1>
          <p>Manage blog posts, announcements, and news</p>
        </div>
        <button className="add-content-btn" onClick={() => openEditor()}>
          <Plus size={20} />
          <span>Add New Post</span>
        </button>
      </div>

      <div className="blog-filters">
         <div className="search-bar">
            <Search size={18} />
            <input 
               type="text" 
               placeholder="Search posts..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
      </div>

      {loading ? (
        <div className="manager-loading">Loading posts...</div>
      ) : (
        <div className="blog-table-container">
          <table className="blog-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Author</th>
                <th>Status</th>
                <th>Views</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map(post => (
                <tr key={post._id}>
                  <td>
                     <div className="post-title-cell">
                        <img src={post.image || 'https://via.placeholder.com/40'} alt="" className="post-thumb" />
                        <span>{post.title}</span>
                     </div>
                  </td>
                  <td><span className="category-badge">{post.category}</span></td>
                  <td>{post.author}</td>
                  <td>
                     <span className={`status-badge ${post.status?.toLowerCase()}`}>
                        {post.status}
                     </span>
                  </td>
                  <td>{post.views || 0}</td>
                  <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button className="icon-btn edit" onClick={() => openEditor(post)}><Edit2 size={16} /></button>
                    <button className="icon-btn delete" onClick={() => deleteItem(post._id)} disabled={deleting === post._id}>
                       <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPosts.length === 0 && (
                 <tr>
                    <td colSpan="7" className="text-center py-8">No posts found.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content-card blog-modal">
            <h2>{editingItem ? 'Edit Post' : 'Add New Post'}</h2>
            <form onSubmit={handleSave}>
              <div className="blog-form-grid">
                  <div className="blog-main-col">
                     <div className="form-group">
                        <label>Title</label>
                        <input type="text" value={formData.title} onChange={handleTitleChange} required />
                     </div>
                     <div className="form-group">
                        <label>Content</label>
                        <div className="rich-editor-container">
                           <div className="editor-toolbar">
                              <button type="button" onClick={() => execCmd('formatBlock', 'H3')} title="Heading"><Heading size={16}/></button>
                              <button type="button" onClick={() => execCmd('bold')} title="Bold"><Bold size={16}/></button>
                              <button type="button" onClick={() => execCmd('italic')} title="Italic"><Italic size={16}/></button>
                              <button type="button" onClick={() => execCmd('insertUnorderedList')} title="Bullet List"><List size={16}/></button>
                              <button type="button" onClick={() => {
                                  const url = prompt('Enter link URL:');
                                  if(url) execCmd('createLink', url);
                              }} title="Link"><LinkIcon size={16}/></button>
                           </div>
                           <div 
                              className="editor-content"
                              contentEditable={true}
                              ref={editorRef}
                              suppressContentEditableWarning={true}
                              dangerouslySetInnerHTML={{ __html: editingItem ? editingItem.content : formData.content }}
                              onBlur={(e) => setFormData({...formData, content: e.currentTarget.innerHTML})}
                           ></div>
                        </div>
                     </div>

                     <h3 className="section-title">SEO Settings</h3>
                     <div className="form-group">
                        <label>Meta Title</label>
                        <input type="text" value={formData.metaTitle} onChange={e => setFormData({...formData, metaTitle: e.target.value})} placeholder="SEO Title" />
                     </div>
                     <div className="form-group">
                        <label>Meta Description</label>
                        <textarea value={formData.metaDescription} onChange={e => setFormData({...formData, metaDescription: e.target.value})} placeholder="SEO Description"></textarea>
                     </div>
                  </div>

                  <div className="blog-side-col">
                     <div className="publish-card">
                        <h3>Publish</h3>
                        <div className="form-group">
                           <label>Status</label>
                           <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                              <option value="Published">Published</option>
                              <option value="Draft">Draft</option>
                           </select>
                        </div>
                        <div className="form-group">
                           <label>Slug</label>
                           <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} />
                        </div>
                        <button type="submit" className="save-btn w-full">
                           {formData.status === 'Published' ? 'Publish' : 'Save Draft'}
                        </button>
                     </div>

                     <div className="publish-card mt-4">
                        <div className="form-group">
                           <label>Category</label>
                           <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                              <option value="News">News</option>
                              <option value="Offers">Offers</option>
                              <option value="Lifestyle">Lifestyle</option>
                              <option value="Sports">Sports</option>
                           </select>
                        </div>
                        <div className="form-group">
                           <label>Tags (comma separated)</label>
                           <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="data, pricing, ncc" />
                        </div>
                        <div className="form-group">
                           <label>Featured Image Upload</label>
                           <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleImageUpload} 
                              className="friendly-input"
                              disabled={uploadingImage}
                           />
                           {uploadingImage && <p style={{fontSize: '13.2px', color: '#3b82f6', marginTop: '4px'}}>Uploading image...</p>}
                           {formData.image && (
                              <div style={{ marginTop: '10px' }}>
                                <img src={formData.image} alt="Preview" className="img-preview" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                                <button 
                                   type="button" 
                                   onClick={() => setFormData({...formData, image: ''})}
                                   style={{ marginTop: '8px', fontSize: '13.2px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                   Remove Image
                                </button>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
              </div>

              <div className="modal-footer-actions right-align">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogManager;
