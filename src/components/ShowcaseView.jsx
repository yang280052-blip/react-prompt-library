import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import ShowcaseCard from './ShowcaseCard';
import { motion } from 'framer-motion';
import { Sparkles, Search } from 'lucide-react';

const ShowcaseView = () => {
  const [showcases, setShowcases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchShowcases();
  }, []);

  const fetchShowcases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('showcases')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setShowcases(data || []);
    } catch (error) {
      console.error('Error fetching showcases:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredShowcases = showcases.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.prompt_content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <header style={{ textAlign: 'left', marginBottom: '64px', maxWidth: '800px' }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '8px', 
            padding: '6px 12px', background: 'rgba(217, 70, 239, 0.1)', 
            color: 'var(--accent-magenta)', borderRadius: '6px', fontSize: '0.75rem', 
            fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em',
            marginBottom: '16px'
          }}
        >
          <Sparkles size={14} /> 案例库
        </motion.div>
        <h1 className="hero-title">
          <span className="gradient-text-modern">案例库</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', lineHeight: '1.6' }}>
          探索最具创意的提示词实战案例。一张图片，一个指令，开启无限可能。
        </p>
      </header>

      {/* Showcase Search */}
      <div style={{ position: 'relative', marginBottom: '48px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="搜索案例标题或提示词..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '52px', background: 'var(--card-bg)', height: '54px' }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-magenta)', borderRadius: '50%', margin: '0 auto' }}
          />
        </div>
      ) : filteredShowcases.length === 0 ? (
        <div className="cyber-card" style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>
          暂时没有找到相关的案例
        </div>
      ) : (
        <div className="showcase-grid">
          {filteredShowcases.map((showcase, index) => (
            <ShowcaseCard 
              key={showcase.id} 
              showcase={showcase} 
              index={index}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ShowcaseView;
