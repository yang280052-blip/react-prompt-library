import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Auth from './Auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, FileText, BarChart3, LogOut, Globe, Lock,
  Edit3, Trash2, User, ShieldCheck, X, Image as ImageIcon
} from 'lucide-react';

const ZONE_OPTIONS = [
  { value: '人设', label: '人设区 — 角色/职业/性格' },
  { value: '场景', label: '场景区 — 环境/构图/光影' },
  { value: '风格', label: '风格区 — 画质/画风/艺术家' },
];

const AdminDashboard = ({ session }) => {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('prompts');
  const [users, setUsers] = useState([]);

  // Prompt form state
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [promptImages, setPromptImages] = useState([]); // [{ id, file|null, url, caption }]

  // Showcase form state
  const [showcases, setShowcases] = useState([]);
  const [showcaseTitle, setShowcaseTitle] = useState('');
  const [showcasePrompt, setShowcasePrompt] = useState('');
  const [imageUploads, setImageUploads] = useState([]);
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
        .from('profiles').select('is_admin').eq('id', session.user.id).single();
      if (error) throw error;
      const adminFlag = data?.is_admin || false;
      setIsAdmin(adminFlag);
      fetchPrompts(adminFlag);
      fetchShowcases(adminFlag);
    } catch (error) {
      console.error('Error checking admin status:', error.message);
      setIsAdmin(false);
      fetchPrompts(false);
      fetchShowcases(false);
    }
  };

  const fetchPrompts = async (adminFlag = isAdmin) => {
    setLoading(true);
    try {
      let query = supabase.from('prompts').select('*').order('created_at', { ascending: false });
      if (!adminFlag) query = query.eq('user_id', session.user.id);
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
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error.message);
    }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); };

  const resetForm = () => {
    setEditingId(null);
    setTitle(''); setDescription(''); setContent(''); setCategory(''); setIsPublic(true);
    setPromptImages([]);
    setShowcaseTitle(''); setShowcasePrompt(''); setImageUploads([]); setEditingShowcaseId(null);
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
    const imgs = p.images && p.images.length > 0 ? p.images : [];
    setPromptImages(imgs.map((img, idx) => ({ id: `existing-${idx}`, url: img.url, caption: img.caption || '', file: null })));
    setShowForm(true);
  };

  // ── Prompt image handlers ──
  const handlePromptImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newUploads = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file, url: URL.createObjectURL(file), caption: ''
    }));
    setPromptImages(prev => [...prev, ...newUploads]);
  };
  const removePromptImage = (id) => setPromptImages(prev => prev.filter(i => i.id !== id));
  const updatePromptCaption = (id, caption) => setPromptImages(prev => prev.map(i => i.id === id ? { ...i, caption } : i));

  const savePrompt = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const finalImages = [];
      for (const item of promptImages) {
        if (item.file) {
          const fileExt = item.file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
          const filePath = `prompts/${session.user.id}/${fileName}`;
          const { error: uploadError } = await supabase.storage.from('showcase-images').upload(filePath, item.file);
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage.from('showcase-images').getPublicUrl(filePath);
          finalImages.push({ url: publicUrl, caption: item.caption });
        } else if (item.url) {
          finalImages.push({ url: item.url, caption: item.caption });
        }
      }

      const promptData = {
        title, description, content, category, is_public: isPublic,
        user_id: session.user.id, images: finalImages
      };

      if (editingId) {
        const { error } = await supabase.from('prompts').update(promptData).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('prompts').insert([promptData]);
        if (error) {
          // Fallback if images column doesn't exist yet
          if (error.message.includes('column "images"')) {
            const fallback = { ...promptData }; delete fallback.images;
            const retry = await supabase.from('prompts').insert([fallback]);
            if (retry.error) throw retry.error;
          } else throw error;
        }
      }
      resetForm();
      fetchPrompts();
    } catch (error) {
      alert('保存失败: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const deletePrompt = async (id, ownerId) => {
    if (!isAdmin && ownerId !== session.user.id) return;
    if (!window.confirm('确定要永久删除这条提示词吗？')) return;
    try {
      const { error } = await supabase.from('prompts').delete().eq('id', id);
      if (error) throw error;
      fetchPrompts();
    } catch (error) { alert('删除失败: ' + error.message); }
  };

  // ── Showcase handlers ──
  const fetchShowcases = async (adminFlag = isAdmin) => {
    try {
      let query = supabase.from('showcases').select('*').order('created_at', { ascending: false });
      if (!adminFlag) query = query.eq('user_id', session.user.id);
      const { data, error } = await query;
      if (error) throw error;
      setShowcases(data || []);
    } catch (error) { console.error('Error fetching showcases:', error.message); }
  };

  const saveShowcase = async (e) => {
    e.preventDefault();
    if (imageUploads.length === 0 && !editingShowcaseId) { alert('请选择至少一张图片上传'); return; }
    setUploading(true);
    try {
      const finalImages = [];
      for (const item of imageUploads) {
        if (item.file) {
          const fileExt = item.file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
          const filePath = `${session.user.id}/${fileName}`;
          const { error: uploadError } = await supabase.storage.from('showcase-images').upload(filePath, item.file);
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage.from('showcase-images').getPublicUrl(filePath);
          finalImages.push({ url: publicUrl, caption: item.caption });
        } else if (item.url) {
          finalImages.push({ url: item.url, caption: item.caption });
        }
      }
      const showcaseData = {
        title: showcaseTitle, prompt_content: showcasePrompt,
        images: finalImages,
        image_url: finalImages.length > 0 ? finalImages[0].url : ''
      };
      let { error } = editingShowcaseId
        ? await supabase.from('showcases').update(showcaseData).eq('id', editingShowcaseId)
        : await supabase.from('showcases').insert([{ ...showcaseData, user_id: session.user.id }]);
      if (error) {
        if (error.message.includes('column "images"')) {
          const fallbackData = { ...showcaseData }; delete fallbackData.images;
          const retry = editingShowcaseId
            ? await supabase.from('showcases').update(fallbackData).eq('id', editingShowcaseId)
            : await supabase.from('showcases').insert([{ ...fallbackData, user_id: session.user.id }]);
          if (retry.error) throw retry.error;
        } else throw error;
      }
      alert('案例已成功同步到云端！');
      resetForm();
      fetchShowcases();
    } catch (error) {
      alert('操作失败: ' + error.message);
    } finally { setUploading(false); }
  };

  const deleteShowcase = async (id, ownerId) => {
    if (!isAdmin && ownerId !== session.user.id) return;
    if (!window.confirm('确定要删除这个案例吗？')) return;
    try {
      const { error } = await supabase.from('showcases').delete().eq('id', id);
      if (error) throw error;
      fetchShowcases();
    } catch (error) { alert('删除失败: ' + error.message); }
  };

  const editShowcase = (s) => {
    setEditingShowcaseId(s.id);
    setShowcaseTitle(s.title);
    setShowcasePrompt(s.prompt_content);
    const existingImages = s.images ? [...s.images] : [];
    if (existingImages.length === 0 && s.image_url) existingImages.push({ url: s.image_url, caption: '' });
    setImageUploads(existingImages.map((img, idx) => ({ id: `existing-${idx}`, url: img.url, caption: img.caption || '', file: null })));
    setActiveTab('showcases');
    setShowForm(true);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageUploads(prev => [...prev, ...files.map(file => ({ id: Math.random().toString(36).substr(2, 9), file, url: URL.createObjectURL(file), caption: '' }))]);
  };
  const removeImage = (id) => setImageUploads(prev => prev.filter(item => item.id !== id));
  const updateCaption = (id, caption) => setImageUploads(prev => prev.map(item => item.id === id ? { ...item, caption } : item));

  if (!session) return <Auth />;

  // Shared image upload row component
  const ImageUploadArea = ({ items, onAdd, onRemove, onCaption, inputId }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {items.map(item => (
        <div key={item.id} className="cyber-card" style={{ padding: '10px', display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
          <img src={item.url} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} alt="Preview" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <input type="text" placeholder="添加图片注释..." value={item.caption} onChange={e => onCaption(item.id, e.target.value)} style={{ padding: '6px 10px', fontSize: '0.85rem' }} />
          </div>
          <button type="button" onClick={() => onRemove(item.id)} style={{ background: 'none', color: '#ef4444', flexShrink: 0 }}><X size={16} /></button>
        </div>
      ))}
      <div
        style={{ border: '2px dashed var(--border-ultra-thin)', borderRadius: '10px', padding: '16px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', cursor: 'pointer' }}
        onClick={() => document.getElementById(inputId).click()}
      >
        <Plus size={20} style={{ color: 'var(--accent-magenta)', marginBottom: '4px' }} />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>添加图片</p>
        <input id={inputId} type="file" accept="image/*" multiple onChange={onAdd} style={{ display: 'none' }} />
      </div>
    </div>
  );

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      {/* Header */}
      <header className="cyber-card" style={{ padding: '28px 32px', marginBottom: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: isAdmin ? 'var(--accent-cyan)' : 'var(--text-main)', border: '1px solid var(--border-ultra-thin)' }}>
            {isAdmin ? <ShieldCheck size={28} /> : <User size={28} />}
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{isAdmin ? '系统管理中心' : '创作工作台'}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></span>
              {session.user.email}
            </div>
          </div>
        </div>
        <button onClick={handleSignOut} className="btn-cyber-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LogOut size={16} /> 退出
        </button>
      </header>

      {/* Tab + Action Row */}
      <div className="admin-control-row" style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="admin-tabs" style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setActiveTab('prompts')} className={activeTab === 'prompts' ? 'btn-cyber-primary' : 'btn-cyber-outline'} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}>
            <FileText size={16} /> 我的内容
          </button>
          {isAdmin && (
            <button onClick={() => setActiveTab('analytics')} className={activeTab === 'analytics' ? 'btn-cyber-primary' : 'btn-cyber-outline'} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}>
              <BarChart3 size={16} /> 数据概览
            </button>
          )}
          <button onClick={() => setActiveTab('showcases')} className={activeTab === 'showcases' ? 'btn-cyber-primary' : 'btn-cyber-outline'} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}>
            <ImageIcon size={16} /> 案例库管理
          </button>
        </div>
        {!showForm && (activeTab === 'prompts' || activeTab === 'showcases') && (
          <button onClick={() => setShowForm(true)} className="btn-cyber-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> {activeTab === 'prompts' ? '新增提示词' : '发布新案例'}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Form Panel */}
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="cyber-card" style={{ padding: '28px', marginBottom: '36px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1.4rem' }}>
                {activeTab === 'prompts' ? (editingId ? '编辑提示词' : '发布新提示词') : (editingShowcaseId ? '编辑案例' : '发布新案例')}
              </h3>
              <button onClick={resetForm} style={{ background: 'none', color: 'var(--text-muted)' }}><X size={22} /></button>
            </div>

            {activeTab === 'prompts' ? (
              /* ── Prompt Form ── */
              <form onSubmit={savePrompt} className="form-2col">
                {/* Left: Meta + Images */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>标题</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="输入引人注目的标题..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>分区</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} required style={{ cursor: 'pointer' }}>
                      <option value="">选择所属分区...</option>
                      {ZONE_OPTIONS.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>简短描述</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="一句话介绍作用..." rows={2} style={{ resize: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>效果图（可选）</label>
                    <ImageUploadArea items={promptImages} onAdd={handlePromptImageChange} onRemove={removePromptImage} onCaption={updatePromptCaption} inputId="prompt-image-upload" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="checkbox" id="public-check" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                    <label htmlFor="public-check" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
                      {isPublic ? <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>🌐 公开分享到社区</span> : '🔒 设为私有'}
                    </label>
                  </div>
                </div>
                {/* Right: Content + Submit */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>提示词正文</label>
                  <textarea value={content} onChange={e => setContent(e.target.value)} required placeholder="在此输入完整的提示词指令..." style={{ flex: 1, minHeight: '240px', fontFamily: 'monospace' }} />
                  <button type="submit" disabled={uploading} className="btn-cyber-primary" style={{ marginTop: '20px', height: '50px', fontSize: '0.95rem' }}>
                    {uploading ? '正在同步...' : (editingId ? '更新内容' : '立即发布')}
                  </button>
                </div>
              </form>
            ) : (
              /* ── Showcase Form ── */
              <form onSubmit={saveShowcase} className="form-2col-lg">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>案例标题</label>
                    <input type="text" value={showcaseTitle} onChange={e => setShowcaseTitle(e.target.value)} required placeholder="例如：赛博朋克风格城市..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>上传效果图（支持多张）</label>
                    <ImageUploadArea items={imageUploads} onAdd={handleImageChange} onRemove={removeImage} onCaption={updateCaption} inputId="showcase-image-upload" />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>对应的提示词</label>
                  <textarea value={showcasePrompt} onChange={e => setShowcasePrompt(e.target.value)} required placeholder="在此输入生成该图片所用的提示词..." style={{ flex: 1, minHeight: '200px', fontFamily: 'monospace' }} />
                  <button type="submit" disabled={uploading} className="btn-cyber-primary" style={{ marginTop: '20px', height: '50px', fontSize: '0.95rem', background: 'linear-gradient(135deg, var(--accent-magenta), #6366f1)', color: '#fff' }}>
                    {uploading ? '正在极速同步...' : (editingShowcaseId ? '保存更改' : '发布案例')}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}

        {/* Prompts Tab */}
        {activeTab === 'prompts' && (
          <motion.div key="prompts-tab" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>正在同步数据...</div>
              ) : prompts.length === 0 ? (
                <div className="cyber-card" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>您的库暂时为空</div>
              ) : prompts.map(p => (
                <motion.div layout key={p.id} className="cyber-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '1.1rem' }}>{p.title}</h4>
                      <span className="hud-tag">{p.category}</span>
                      {p.is_public ? <Globe size={14} className="neon-text-cyan" /> : <Lock size={14} className="neon-text-magenta" />}
                      {p.images && p.images.length > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--accent-magenta)', background: 'rgba(217,70,239,0.1)', padding: '2px 7px', borderRadius: '4px', border: '1px solid rgba(217,70,239,0.3)' }}>📷 {p.images.length}张图</span>}
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '700px' }}>{p.content}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                    <button onClick={() => editPrompt(p)} style={{ background: 'none', color: 'var(--text-main)' }}><Edit3 size={18} /></button>
                    <button onClick={() => deletePrompt(p.id, p.user_id)} style={{ background: 'none', color: '#ef4444' }}><Trash2 size={18} /></button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {isAdmin && activeTab === 'analytics' && (
          <motion.div key="analytics-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cyber-card" style={{ padding: '40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '48px' }}>
              <div className="cyber-card" style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase' }}>总注册用户</div>
                <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{users.length}</div>
              </div>
              <div className="cyber-card" style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase' }}>总提示词数量</div>
                <div style={{ fontSize: '2.5rem', fontWeight: '800' }} className="neon-text-cyan">{prompts.length}</div>
              </div>
              <div className="cyber-card" style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase' }}>系统状态</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', marginTop: '12px' }} className="neon-text-cyan">STABLE</div>
              </div>
            </div>
            <h3 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>活跃用户详细信息</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-ultra-thin)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <th style={{ padding: '14px' }}>UID</th><th style={{ padding: '14px' }}>账户名称</th><th style={{ padding: '14px' }}>权限</th><th style={{ padding: '14px' }}>注册时间</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-ultra-thin)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '14px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.id.substring(0, 8)}</td>
                      <td style={{ padding: '14px', fontWeight: '600' }}>{u.username}</td>
                      <td style={{ padding: '14px' }}>{u.is_admin ? <span style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={14} /> ADMIN</span> : <span style={{ color: 'var(--text-muted)' }}>CREATOR</span>}</td>
                      <td style={{ padding: '14px', color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Showcase Tab */}
        {activeTab === 'showcases' && (
          <motion.div key="showcases-tab" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="showcase-grid" style={{ gap: '20px' }}>
              {showcases.length === 0 ? (
                <div className="cyber-card" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)', gridColumn: '1/-1' }}>您的案例库暂时为空</div>
              ) : showcases.map(s => (
                <motion.div layout key={s.id} className="cyber-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ width: '110px', height: '110px', flexShrink: 0 }}>
                      <img src={s.images?.[0]?.url || s.image_url} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '14px 18px', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h4 style={{ fontSize: '1rem', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.prompt_content}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '10px 14px', borderTop: '1px solid var(--border-ultra-thin)', background: 'rgba(255,255,255,0.02)' }}>
                    <button onClick={() => editShowcase(s)} style={{ background: 'rgba(6,182,212,0.1)', color: 'var(--accent-cyan)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(6,182,212,0.2)' }}>
                      <Edit3 size={13} /> 编辑
                    </button>
                    <button onClick={() => deleteShowcase(s.id, s.user_id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <Trash2 size={13} /> 删除
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
