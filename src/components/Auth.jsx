import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock, ShieldAlert, CheckCircle2 } from 'lucide-react';

const Auth = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('注册成功！');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="cyber-card" 
        style={{ width: '100%', maxWidth: '440px', padding: '48px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '16px', 
            background: 'rgba(255,255,255,0.05)', display: 'flex', 
            justifyContent: 'center', alignItems: 'center', 
            margin: '0 auto 24px', color: 'var(--accent-cyan)',
            border: '1px solid var(--border-ultra-thin)'
          }}>
            {isLogin ? <LogIn size={32} /> : <UserPlus size={32} />}
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }} className="gradient-text-modern">
            {isLogin ? '系统登入' : '创建开发者账户'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {isLogin ? '连接到您的私有提示词核心' : '加入全球提示词创作者社区'}
          </p>
        </div>
        
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="电子邮件地址"
              required
              style={{ paddingLeft: '48px' }}
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="安全密码"
              required
              minLength={6}
              style={{ paddingLeft: '48px' }}
            />
          </div>
          
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}
              >
                <ShieldAlert size={14} /> {error}
              </motion.div>
            )}
            {message && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontSize: '0.85rem', background: 'rgba(34, 197, 94, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}
              >
                <CheckCircle2 size={14} /> {message}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit" 
            className="btn-cyber-primary" 
            style={{ height: '54px', fontSize: '1rem', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? '正在授信...' : (isLogin ? '立即连接' : '完成注册')}
          </button>
        </form>
        
        <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {isLogin ? "还没有权限凭证？ " : "已有访问权限？ "}
          <button 
            type="button" 
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setMessage('');
            }}
            style={{ 
              background: 'none', 
              color: 'var(--accent-cyan)', 
              fontWeight: 'bold',
              borderBottom: '1px dashed var(--accent-cyan)',
              padding: '0 0 2px 0',
              borderRadius: 0
            }}
          >
            {isLogin ? '申请加入' : '返回登录'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
