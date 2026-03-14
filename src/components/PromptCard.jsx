import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Heart, ExternalLink, Lock, X } from 'lucide-react';

const PromptCard = ({ prompt, session, isFavorited: initialFavorited, onFavoriteToggle, index }) => {
  const [copied, setCopied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(initialFavorited || false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setIsFavorited(initialFavorited);
  }, [initialFavorited]);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFavorite = async (e) => {
    e.stopPropagation();
    if (!session) {
      alert("请先登录才能收藏内容哦！");
      return;
    }
    
    setLoading(true);
    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .match({ user_id: session.user.id, prompt_id: prompt.id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: session.user.id, prompt_id: prompt.id });
        if (error) throw error;
      }
      setIsFavorited(!isFavorited);
      if (onFavoriteToggle) onFavoriteToggle(prompt.id, !isFavorited);
    } catch (error) {
      console.error("Error toggling favorite:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="cyber-card"
        onClick={() => setShowModal(true)}
        style={{ 
          padding: '28px', 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%', 
          cursor: 'pointer'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              color: 'var(--text-main)', 
              padding: '4px 10px', 
              borderRadius: '6px', 
              fontSize: '0.7rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: '1px solid var(--border-ultra-thin)'
            }}>
              {prompt.category}
            </span>
            
            {!prompt.is_public && (
              <span style={{ 
                background: 'rgba(217, 70, 239, 0.1)', 
                color: 'var(--accent-magenta)', 
                padding: '4px 10px', 
                borderRadius: '6px', 
                fontSize: '0.7rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                border: '1px solid var(--accent-magenta-glow)'
              }}>
                <Lock size={12} /> 私有
              </span>
            )}
          </div>

          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleFavorite}
            disabled={loading}
            style={{ 
              background: 'none',
              border: 'none',
              color: isFavorited ? 'var(--accent-magenta)' : 'var(--text-muted)',
              cursor: 'pointer',
              zIndex: 2,
              padding: '4px'
            }}
          >
            <Heart size={20} fill={isFavorited ? "currentColor" : "none"} strokeWidth={2} />
          </motion.button>
        </div>

        <h3 style={{ fontSize: '1.4rem', marginBottom: '12px', color: '#fff', lineHeight: '1.2' }}>
          {prompt.title}
        </h3>

        {prompt.description && (
          <p style={{ 
            color: 'var(--text-muted)', 
            fontSize: '0.9rem', 
            marginBottom: '20px',
            lineHeight: '1.5',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {prompt.description}
          </p>
        )}
        
        <div style={{ flex: 1, marginBottom: '24px' }}>
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.2)', 
            borderRadius: '8px', 
            padding: '16px',
            border: '1px solid var(--border-ultra-thin)'
          }}>
            <p style={{ 
              color: 'var(--text-main)', 
              fontSize: '0.875rem', 
              lineHeight: '1.6',
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontFamily: 'monospace',
              opacity: 0.8
            }}>
              {prompt.content}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCopy}
            className={copied ? "btn-cyber-outline" : "btn-cyber-primary"}
            style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "已复制" : "复制"}
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ 
              width: '42px', height: '42px', 
              borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              color: 'var(--text-muted)', border: '1px solid var(--border-ultra-thin)'
            }}
          >
            <ExternalLink size={18} />
          </motion.button>
        </div>
      </motion.div>

      {/* Modern Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(10px)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              zIndex: 1000, padding: '24px'
            }}
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="cyber-card"
              style={{
                width: '100%', maxWidth: '800px', maxHeight: '92vh',
                display: 'flex', flexDirection: 'column', position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ 
                padding: '32px', borderBottom: '1px solid var(--border-ultra-thin)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h2 style={{ fontSize: '1.75rem', color: '#fff' }}>{prompt.title}</h2>
                    <span style={{ 
                      background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', 
                      padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700'
                    }}>
                      {prompt.category}
                    </span>
                  </div>
                  {prompt.description && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>{prompt.description}</p>
                  )}
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  style={{ background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={{ padding: '20px', overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-ultra-thin)',
                  borderRadius: '12px', padding: '24px', position: 'relative'
                }}>
                  <pre style={{ 
                    margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word',
                    fontFamily: 'monospace', color: '#fff', fontSize: '1.1rem', lineHeight: '1.7'
                  }}>
                    {prompt.content}
                  </pre>
                </div>
              </div>

              <div style={{ 
                padding: '24px 32px', borderTop: '1px solid var(--border-ultra-thin)',
                display: 'flex', justifyContent: 'flex-end', gap: '16px'
              }}>
                <button onClick={() => setShowModal(false)} className="btn-cyber-outline">关闭</button>
                <button 
                  onClick={handleCopy}
                  className={copied ? "btn-cyber-outline" : "btn-cyber-primary"}
                  style={{ minWidth: '140px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? "已复制" : "复制全部"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PromptCard;
