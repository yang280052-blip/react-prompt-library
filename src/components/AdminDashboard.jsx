import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Auth from './Auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  FileText, 
  BarChart3, 
  LogOut, 
  Globe, 
  Lock, 
  Edit3, 
  Trash2, 
  Download,
  User,
  ShieldCheck,
  ChevronRight,
  Save,
  X,
  Image as ImageIcon,
  Upload
} from 'lucide-react';

const AdminDashboard = ({ session }) => {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [activeTab, setActiveTab] = useState('prompts'); // 'prompts' | 'analytics'
  const [users, setUsers] = useState([]);
  
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Showcase States
  const [showcases, setShowcases] = useState([]);
  const [showcaseTitle, setShowcaseTitle] = useState('');
  const [showcasePrompt, setShowcasePrompt] = useState('');
  const [imageUploads, setImageUploads] = useState([]); // [{ file: File | null, url: string, caption: string, id: string }]
  const [uploading, setUploading] = useState(false);
  const [editingShowcaseId, setEditingShowcaseId] = useState(null);

  useEffect(() => {
    if (session) {
      checkAdminStatus();
      fetchUsers();
      fetchShowcases();
    }
  }, [session]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
        
      if (error) throw error;
      const adminFlag = data?.is_admin || false;
      setIsAdmin(adminFlag);
      fetchPrompts(adminFlag);
    } catch (error) {
      console.error('Error checking admin status:', error.message);
      setIsAdmin(false); 
      fetchPrompts(false);
    }
  };

  const fetchPrompts = async (adminFlag = isAdmin) => {
    setLoading(true);
    try {
      let query = supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!adminFlag) {
        query = query.eq('user_id', session.user.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error('Error fetching prompts:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setContent('');
    setCategory('');
    setIsPublic(true);
    
    setShowcaseTitle('');
    setShowcasePrompt('');
    setImageUploads([]);
    setEditingShowcaseId(null);
    setShowForm(false);
  };

  const editPrompt = (p) => {
    if (!isAdmin && p.user_id !== session.user.id) return;
    setEditingId(p.id);
    setTitle(p.title);
    setDescription(p.description || '');
    setContent(p.content);
    setCategory(p.category);
    setIsPublic(p.is_public ?? true);
    setShowForm(true);
  };

  const savePrompt = async (e) => {
    e.preventDefault();
    const promptData = { title, description, content, category, is_public: isPublic, user_id: session.user.id };
    
    try {
      if (editingId) {
        const { error } = await supabase.from('prompts').update(promptData).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('prompts').insert([promptData]);
        if (error) throw error;
      }
      resetForm();
      fetchPrompts();
    } catch (error) {
      alert('保存失败: ' + error.message);
    }
  };

  const deletePrompt = async (id, ownerId) => {
    if (!isAdmin && ownerId !== session.user.id) return;
    if (!window.confirm('确定要永久删除这条提示词吗？')) return;
    
    try {
      const { error } = await supabase.from('prompts').delete().eq('id', id);
      if (error) throw error;
      fetchPrompts();
    } catch (error) {
      alert('删除失败: ' + error.message);
    }
  };
  
  const fetchShowcases = async (adminFlag = isAdmin) => {
    try {
      let query = supabase
        .from('showcases')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!adminFlag) {
        query = query.eq('user_id', session.user.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setShowcases(data || []);
    } catch (error) {
      console.error('Error fetching showcases:', error.message);
    }
  };

  const saveShowcase = async (e) => {
    e.preventDefault();
    if (imageUploads.length === 0 && !editingShowcaseId) {
      alert('请选择至少一张图片上传');
      return;
    }

    setUploading(true);
    try {
      const finalImages = [];
      
      // Handle each image in the uploads array
      for (const item of imageUploads) {
        if (item.file) {
          // It's a new file to upload
          const fileExt = item.file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${session.user.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('showcase-images')
            .upload(filePath, item.file);
            
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('showcase-images')
            .getPublicUrl(filePath);
            
          finalImages.push({ url: publicUrl, caption: item.caption });
        } else if (item.url) {
          // It's an existing image (editing mode)
          finalImages.push({ url: item.url, caption: item.caption });
        }
      }

      const showcaseData = { 
        title: showcaseTitle, 
        prompt_content: showcasePrompt, 
        images: finalImages,
        image_url: finalImages.length > 0 ? finalImages[0].url : '' // Compatibility for old code
      };
      
      if (editingShowcaseId) {
        const { error } = await supabase.from('showcases').update(showcaseData).eq('id', editingShowcaseId);
        if (error) throw error;
      } else {
        showcaseData.user_id = session.user.id;
        const { error } = await supabase.from('showcases').insert([showcaseData]);
        if (error) throw error;
      }

      resetForm();
      fetchShowcases();
      alert('案例保存成功！');
    } catch (error) {
      alert('保存失败: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteShowcase = async (id, ownerId) => {
    if (!isAdmin && ownerId !== session.user.id) return;
    if (!window.confirm('确定要删除这个案例吗？')) return;
    
    try {
      const { error } = await supabase.from('showcases').delete().eq('id', id);
      if (error) throw error;
      fetchShowcases();
    } catch (error) {
      alert('删除失败: ' + error.message);
    }
  };

  const editShowcase = (s) => {
    setEditingShowcaseId(s.id);
    setShowcaseTitle(s.title);
    setShowcasePrompt(s.prompt_content);
    
    // Load existing images
    const existingImages = s.images ? [...s.images] : [];
    if (existingImages.length === 0 && s.image_url) {
      existingImages.push({ url: s.image_url, caption: '' });
    }
    
    setImageUploads(existingImages.map((img, idx) => ({
      id: `existing-${idx}`,
      url: img.url,
      caption: img.caption || '',
      file: null
    })));
    
    setActiveTab('showcases');
    setShowForm(true);
    // Smooth scroll to form
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newUploads = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      url: URL.createObjectURL(file),
      caption: ''
    }));
    setImageUploads(prev => [...prev, ...newUploads]);
  };

  const removeImage = (id) => {
    setImageUploads(prev => prev.filter(item => item.id !== id));
  };

  const updateCaption = (id, caption) => {
    setImageUploads(prev => prev.map(item => item.id === id ? { ...item, caption } : item));
  };

  if (!session) return <Auth />;

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      {/* Premium Dashboard Header */}
      <header className="cyber-card" style={{ padding: '32px', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            width: '56px', height: '56px', borderRadius: '14px', 
            background: 'rgba(255,255,255,0.05)', display: 'flex', 
            justifyContent: 'center', alignItems: 'center', color: isAdmin ? 'var(--accent-cyan)' : 'var(--text-main)',
            border: '1px solid var(--border-ultra-thin)'
          }}>
            {isAdmin ? <ShieldCheck size={32} /> : <User size={32} />}
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>
              {isAdmin ? '系统管理中心' : '创作工作台'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <span style={{ 
                width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', 
                boxShadow: '0 0 10px #22c55e' 
              }}></span>
              {session.user.email}
            </div>
          </div>
        </div>
        <button onClick={handleSignOut} className="btn-cyber-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LogOut size={18} /> 退出
        </button>
      </header>

      {/* Main Control Row */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setActiveTab('prompts')}
            className={activeTab === 'prompts' ? 'btn-cyber-primary' : 'btn-cyber-outline'}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
          >
            <FileText size={18} /> 我的内容
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('analytics')}
              className={activeTab === 'analytics' ? 'btn-cyber-primary' : 'btn-cyber-outline'}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
            >
              <BarChart3 size={18} /> 数据概览
            </button>
          )}
          <button 
            onClick={() => setActiveTab('showcases')}
            className={activeTab === 'showcases' ? 'btn-cyber-primary' : 'btn-cyber-outline'}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
          >
            <ImageIcon size={18} /> 案例库管理
          </button>
        </div>
        
        {!showForm && (activeTab === 'prompts' || activeTab === 'showcases') && (
          <button onClick={() => setShowForm(true)} className="btn-cyber-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} /> {activeTab === 'prompts' ? '新增提示词' : '发布新案例'}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Form Overlay */}
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="cyber-card" 
            style={{ padding: '32px', marginBottom: '40px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.5rem' }}>
                {activeTab === 'prompts' ? (editingId ? '编辑提示词' : '发布新提示词') : (editingShowcaseId ? '编辑案例库' : '发布新案例库项目')}
              </h3>
              <button onClick={resetForm} style={{ background: 'none', color: 'var(--text-muted)' }}><X size={24} /></button>
            </div>
            
            {activeTab === 'prompts' ? (
              <form onSubmit={savePrompt} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>标题</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="输入引人注目的标题..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>分类</label>
                    <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} required placeholder="例如：绘画, 写作, 编程..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>简短描述</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="一句话介绍作用..." rows={2} style={{ resize: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                    <input 
                      type="checkbox" id="public-check" checked={isPublic} 
                      onChange={(e) => setIsPublic(e.target.checked)} 
                      style={{ width: '20px', height: '20px' }}
                    />
                    <label htmlFor="public-check" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
                      {isPublic ? <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>🌐 公开分享到社区</span> : '🔒 设为私有'}
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>提示词正文</label>
                  <textarea 
                    value={content} onChange={(e) => setContent(e.target.value)} 
                    required placeholder="在此输入完整的提示词指令..." 
                    style={{ flex: 1, minHeight: '200px', fontFamily: 'monospace' }} 
                  />
                  <button type="submit" className="btn-cyber-primary" style={{ marginTop: '24px', height: '54px', fontSize: '1rem' }}>
                    {editingId ? '更新内容' : '立即发布'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={saveShowcase} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>案例标题</label>
                    <input 
                      type="text" 
                      value={showcaseTitle} 
                      onChange={(e) => setShowcaseTitle(e.target.value)} 
                      required 
                      placeholder="例如：赛博朋克风格城市..." 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>上传效果图（支持多张）</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {imageUploads.map((item) => (
                        <div key={item.id} className="cyber-card" style={{ padding: '12px', display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
                          <img src={item.url} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} alt="Preview" />
                          <div style={{ flex: 1 }}>
                            <input 
                              type="text" 
                              placeholder="添加图片注释..." 
                              value={item.caption} 
                              onChange={(e) => updateCaption(item.id, e.target.value)}
                              style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                            />
                          </div>
                          <button type="button" onClick={() => removeImage(item.id)} style={{ background: 'none', color: '#ef4444' }}><X size={16} /></button>
                        </div>
                      ))}
                      
                      <div style={{ 
                        border: '2px dashed var(--border-ultra-thin)', 
                        borderRadius: '12px', 
                        padding: '20px', 
                        textAlign: 'center',
                        background: 'rgba(0,0,0,0.2)',
                        cursor: 'pointer'
                      }} onClick={() => document.getElementById('image-upload').click()}>
                        <Plus size={24} style={{ color: 'var(--accent-magenta)', marginBottom: '4px' }} />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>添加图片</p>
                        <input 
                          id="image-upload" 
                          type="file" 
                          accept="image/*" 
                          multiple
                          onChange={handleImageChange} 
                          style={{ display: 'none' }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>对应的提示词</label>
                  <textarea 
                    value={showcasePrompt} 
                    onChange={(e) => setShowcasePrompt(e.target.value)} 
                    required 
                    placeholder="在此输入生成该图片所用的提示词..." 
                    style={{ flex: 1, minHeight: '200px', fontFamily: 'monospace' }} 
                  />
                  <button 
                    type="submit" 
                    disabled={uploading}
                    className="btn-cyber-primary" 
                    style={{ 
                      marginTop: '24px', height: '54px', fontSize: '1rem',
                      background: 'linear-gradient(135deg, var(--accent-magenta), #6366f1)',
                      color: '#fff'
                    }}
                  >
                    {uploading ? '正在极速同步...' : (editingShowcaseId ? '保存更改' : '发布案例')}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}

        {/* Content Tab */}
        {activeTab === 'prompts' && (
          <motion.div 
            key="prompts-tab"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100%, 1fr))', gap: '16px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>正在同步数据...</div>
              ) : prompts.length === 0 ? (
                <div className="cyber-card" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>您的库暂时为空</div>
              ) : (
                prompts.map((p) => (
                  <motion.div 
                    layout
                    key={p.id} 
                    className="cyber-card" 
                    style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <h4 style={{ fontSize: '1.2rem' }}>{p.title}</h4>
                        <span className="hud-tag">
                          {p.category}
                        </span>
                        {p.is_public ? <Globe size={14} className="neon-text-cyan" /> : <Lock size={14} className="neon-text-magenta" />}
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '800px' }}>
                        {p.content}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginLeft: '32px' }}>
                      <button onClick={() => editPrompt(p)} style={{ background: 'none', color: 'var(--text-main)' }}><Edit3 size={20} /></button>
                      <button onClick={() => deletePrompt(p.id, p.user_id)} style={{ background: 'none', color: '#ef4444' }}><Trash2 size={20} /></button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {isAdmin && activeTab === 'analytics' && (
          <motion.div 
            key="analytics-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="cyber-card"
            style={{ padding: '40px' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '48px' }}>
              <div className="cyber-card" style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase' }}>总注册用户</div>
                <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{users.length}</div>
              </div>
              <div className="cyber-card" style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase' }}>总提示词数量</div>
                <div style={{ fontSize: '2.5rem', fontWeight: '800' }} className="neon-text-cyan">{prompts.length}</div>
              </div>
              <div className="cyber-card" style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase' }}>系统状态</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '12px' }} className="neon-text-cyan">运行良好 (STABLE)</div>
              </div>
            </div>

            <h3 style={{ marginBottom: '24px', fontSize: '1.25rem' }}>活跃用户详细信息</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-ultra-thin)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '16px' }}>UID (SHA)</th>
                    <th style={{ padding: '16px' }}>账户名称</th>
                    <th style={{ padding: '16px' }}>权限级别</th>
                    <th style={{ padding: '16px' }}>最后更新</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-ultra-thin)', fontSize: '0.95rem' }}>
                      <td style={{ padding: '16px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.id.substring(0, 8)}</td>
                      <td style={{ padding: '16px', fontWeight: '600' }}>{u.username}</td>
                      <td style={{ padding: '16px' }}>
                        {u.is_admin ? 
                          <span style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={16} /> ADMIN</span> : 
                          <span style={{ color: 'var(--text-muted)' }}>CREATOR</span>
                        }
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        {/* Showcase Tab */}
        {activeTab === 'showcases' && (
          <motion.div 
            key="showcases-tab"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
              {showcases.length === 0 ? (
                <div className="cyber-card" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)', gridColumn: '1/-1' }}>您的案例库暂时为空</div>
              ) : (
                showcases.map((s) => (
                  <motion.div 
                    layout
                    key={s.id} 
                    className="cyber-card" 
                    style={{ padding: 0, display: 'flex', overflow: 'hidden' }}
                  >
                    <div style={{ width: '120px', height: '120px', flexShrink: 0 }}>
                      <img src={s.images?.[0]?.url || s.image_url} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '20px', flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ overflow: 'hidden' }}>
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.prompt_content}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginLeft: '20px' }}>
                        <button onClick={() => editShowcase(s)} style={{ background: 'none', color: 'var(--text-main)' }}><Edit3 size={18} /></button>
                        <button onClick={() => deleteShowcase(s.id, s.user_id)} style={{ background: 'none', color: '#ef4444' }}><Trash2 size={18} /></button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
