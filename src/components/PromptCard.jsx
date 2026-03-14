import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Heart, Lock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getZone } from '../utils/zoneConfig';

const PromptCard = ({ prompt, session, isFavorited: initialFavorited, onFavoriteToggle, index }) => {
  const [copied, setCopied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(initialFavorited || false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  const zone = getZone(prompt.category);
  const images = prompt.images && prompt.images.length > 0 ? prompt.images : [];
  const hasImages = images.length > 0;

  useEffect(() => { setIsFavorited(initialFavorited); }, [initialFavorited]);

  const handleCopy = (e) => {
    e && e.stopPropagation();
    navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFavorite = async (e) => {
    e.stopPropagation();
    if (!session) { alert('请先登录才能收藏内容哦！'); return; }
    setLoading(true);
    try {
      if (isFavorited) {
        const { error } = await supabase.from('favorites').delete().match({ user_id: session.user.id, prompt_id: prompt.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('favorites').insert({ user_id: session.user.id, prompt_id: prompt.id });
        if (error) throw error;
      }
      setIsFavorited(!isFavorited);
      if (onFavoriteToggle) onFavoriteToggle(prompt.id, !isFavorited);
    } catch (error) {
      console.error('Error toggling favorite:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const nextImage = (e) => { e.stopPropagation(); setCurrentIdx(p => (p + 1) % images.length); };
  const prevImage = (e) => { e.stopPropagation(); setCurrentIdx(p => (p - 1 + images.length) % images.length); };

  const zoneBorderClass = zone ? `zone-border-${prompt.category}` : '';

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={`cyber-card ${zoneBorderClass}`}
        onClick={() => setShowModal(true)}
        style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer' }}
      >
        {/* Header Image (if any) */}
        {hasImages && (
          <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', position: 'relative', background: '#000', borderRadius: '12px 12px 0 0', flexShrink: 0 }}>
            <img
              src={images[0].url}
              alt={prompt.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
              onMouseOver={e => e.target.style.transform = 'scale(1.04)'}
              onMouseOut={e => e.target.style.transform = 'scale(1)'}
            />
            {images.length > 1 && (
              <div style={{ position: 'absolute', top: '8px', right: '8px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold' }}>
                1 / {images.length}
              </div>
            )}
          </div>
        )}

        {/* Card Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Top Row: badges + favorite */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                background: zone ? `${zone.colorGlow}` : 'rgba(255,255,255,0.05)',
                color: zone ? zone.color : 'var(--text-muted)',
                padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                border: `1px solid ${zone ? zone.borderColor : 'var(--border-ultra-thin)'}`,
              }}>
                {prompt.category}
              </span>
              {!prompt.is_public && (
                <span style={{
                  background: 'rgba(217,70,239,0.1)', color: 'var(--accent-magenta)',
                  padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  border: '1px solid var(--accent-magenta-glow)'
                }}>
                  <Lock size={12} /> 私有
                </span>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={toggleFavorite} disabled={loading}
              style={{ background: 'none', border: 'none', color: isFavorited ? 'var(--accent-magenta)' : 'var(--text-muted)', cursor: 'pointer', padding: '4px', zIndex: 2 }}
            >
              <Heart size={20} fill={isFavorited ? 'currentColor' : 'none'} strokeWidth={2} />
            </motion.button>
          </div>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#fff', lineHeight: '1.2' }}>{prompt.title}</h3>

          {prompt.description && (
            <p style={{
              color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px', lineHeight: '1.5',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>
              {prompt.description}
            </p>
          )}

          <div style={{ flex: 1, marginBottom: '20px' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '14px', border: '1px solid var(--border-ultra-thin)' }}>
              <p style={{
                color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.6', margin: 0,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                fontFamily: 'monospace', opacity: 0.8
              }}>
                {prompt.content}
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleCopy}
            className={copied ? 'btn-cyber-outline' : 'btn-cyber-primary'}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? '已复制' : '复制'}
          </motion.button>
        </div>
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay"
            style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)',
              backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center',
              zIndex: 1000, padding: '24px'
            }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={hasImages ? `cyber-card modal-showcase-layout ${zoneBorderClass}` : `cyber-card ${zoneBorderClass}`}
              style={hasImages ? {} : { width: '100%', maxWidth: '800px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', position: 'relative' }}
              onClick={e => e.stopPropagation()}
            >
              {hasImages ? (
                <>
                  {/* Left: Image Carousel */}
                  <div className="modal-showcase-image">
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', position: 'relative' }}>
                      <img src={images[currentIdx].url} alt={prompt.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      {images.length > 1 && (
                        <>
                          <button onClick={prevImage} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><ChevronLeft size={22} /></button>
                          <button onClick={nextImage} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><ChevronRight size={22} /></button>
                        </>
                      )}
                    </div>
                    <div style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.04)', borderTop: '1px solid var(--border-ultra-thin)' }}>
                      <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', margin: 0, textAlign: 'center' }}>{images[currentIdx].caption || '暂无注释'}</p>
                      {images.length > 1 && (
                        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          {images.map((_, i) => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === currentIdx ? (zone?.color || 'var(--accent-cyan)') : 'rgba(255,255,255,0.2)' }} />)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Prompt Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', padding: '28px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, background: 'rgba(0,0,0,0.4)', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><X size={18} /></button>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <span style={{ background: zone ? zone.colorGlow : 'rgba(255,255,255,0.05)', color: zone ? zone.color : 'var(--text-muted)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', border: `1px solid ${zone ? zone.borderColor : 'var(--border-ultra-thin)'}` }}>{prompt.category}</span>
                    </div>
                    <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '8px', lineHeight: '1.2' }}>{prompt.title}</h2>
                    {prompt.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '20px' }}>{prompt.description}</p>}
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>提示词指令</label>
                      <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-ultra-thin)', borderRadius: '12px', padding: '20px' }}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'monospace', color: '#fff', fontSize: '0.95rem', lineHeight: '1.7' }}>{prompt.content}</pre>
                      </div>
                    </div>
                    <div style={{ marginTop: '24px' }}>
                      <button onClick={handleCopy} className={copied ? 'btn-cyber-outline' : 'btn-cyber-primary'} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? '已复制' : '复制提示词'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ padding: '28px 32px', borderBottom: '1px solid var(--border-ultra-thin)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <h2 style={{ fontSize: '1.7rem', color: '#fff' }}>{prompt.title}</h2>
                        <span style={{ background: zone ? zone.colorGlow : 'rgba(255,255,255,0.05)', color: zone ? zone.color : 'var(--text-muted)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700', border: `1px solid ${zone ? zone.borderColor : 'var(--border-ultra-thin)'}` }}>{prompt.category}</span>
                      </div>
                      {prompt.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{prompt.description}</p>}
                    </div>
                    <button onClick={() => setShowModal(false)} style={{ background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', flexShrink: 0 }}><X size={24} /></button>
                  </div>
                  <div style={{ padding: '24px', overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-ultra-thin)', borderRadius: '12px', padding: '24px' }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'monospace', color: '#fff', fontSize: '1rem', lineHeight: '1.7' }}>{prompt.content}</pre>
                    </div>
                  </div>
                  <div style={{ padding: '20px 28px', borderTop: '1px solid var(--border-ultra-thin)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button onClick={() => setShowModal(false)} className="btn-cyber-outline">关闭</button>
                    <button onClick={handleCopy} className={copied ? 'btn-cyber-outline' : 'btn-cyber-primary'} style={{ minWidth: '140px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? '已复制' : '复制全部'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PromptCard;
