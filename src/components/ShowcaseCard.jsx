import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ExternalLink, X, Image as ImageIcon } from 'lucide-react';

const ShowcaseCard = ({ showcase, index }) => {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(showcase.prompt_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%', 
          cursor: 'pointer',
          padding: 0,
          border: '1px solid var(--border-ultra-thin)',
        }}
      >
        {/* Image Preview */}
        <div style={{ 
          width: '100%', 
          aspectRatio: '16/10', 
          overflow: 'hidden',
          position: 'relative',
          background: 'rgba(0,0,0,0.4)'
        }}>
          <img 
            src={showcase.image_url} 
            alt={showcase.title}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              transition: 'transform 0.5s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          />
          <div style={{ 
            position: 'absolute', 
            bottom: 0, left: 0, right: 0,
            padding: '20px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end'
          }}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              {showcase.title}
            </h3>
          </div>
        </div>

        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <ImageIcon size={14} />
            优秀案例
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ 
              width: '36px', height: '36px', 
              borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              color: 'var(--text-muted)', border: '1px solid var(--border-ultra-thin)'
            }}
          >
            <ExternalLink size={16} />
          </motion.button>
        </div>
      </motion.div>

      {/* Showcase Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="cyber-card"
              style={{
                width: '100%', maxWidth: '1000px', maxHeight: '90vh',
                display: 'grid', gridTemplateColumns: '1.2fr 1fr', 
                position: 'relative', overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowModal(false)}
                style={{ 
                  position: 'absolute', top: '20px', right: '20px', 
                  zIndex: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', 
                  borderRadius: '50%', width: '40px', height: '40px',
                  display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}
              >
                <X size={20} />
              </button>

              {/* Left Column: Image */}
              <div style={{ height: '100%', background: '#000', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                <img 
                  src={showcase.image_url} 
                  alt={showcase.title}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>

              {/* Right Column: Prompt Info */}
              <div style={{ display: 'flex', flexDirection: 'column', padding: '32px', overflowY: 'auto' }}>
                <h2 style={{ fontSize: '1.75rem', color: '#fff', marginBottom: '8px' }}>{showcase.title}</h2>
                <div style={{ 
                  color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 'bold', 
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' 
                }}>
                  Prompt Showcase
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    提示词指令
                  </label>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-ultra-thin)',
                    borderRadius: '12px', padding: '24px', position: 'relative'
                  }}>
                    <pre style={{ 
                      margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word',
                      fontFamily: 'monospace', color: '#fff', fontSize: '1rem', lineHeight: '1.6'
                    }}>
                      {showcase.prompt_content}
                    </pre>
                  </div>
                </div>

                <div style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
                  <button 
                    onClick={handleCopy}
                    className={copied ? "btn-cyber-outline" : "btn-cyber-primary"}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? "已复制" : "复制提示词"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ShowcaseCard;
