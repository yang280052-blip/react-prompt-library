import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import PromptCard from './components/PromptCard'
import AdminDashboard from './components/AdminDashboard'
import Auth from './components/Auth'
import CategoryNav from './components/CategoryNav'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Heart, Sparkles, LogIn, Settings, Image as ImageIcon } from 'lucide-react'
import ShowcaseView from './components/ShowcaseView'
import './index.css'

function App() {
  const [session, setSession] = useState(null)
  const [currentView, setCurrentView] = useState('public')
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeZone, setActiveZone] = useState('all')
  const [favorites, setFavorites] = useState([])
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchFavorites(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchFavorites(session.user.id)
        if (currentView === 'auth') setCurrentView('admin')
      } else {
        setFavorites([])
        setShowFavoritesOnly(false)
        if (currentView === 'admin') setCurrentView('auth')
      }
    })

    fetchPublicPrompts()
    return () => subscription.unsubscribe()
  }, [currentView])

  const fetchPublicPrompts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('prompts').select('*').eq('is_public', true).order('created_at', { ascending: false })
      if (error) throw error
      setPrompts(data || [])
    } catch (error) {
      console.error('Error fetching prompts:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchFavorites = async (userId) => {
    try {
      const { data, error } = await supabase.from('favorites').select('prompt_id').eq('user_id', userId)
      if (error) throw error
      setFavorites(data.map(f => f.prompt_id))
    } catch (error) {
      console.error('Error fetching favorites:', error.message)
    }
  }

  const handleFavoriteToggle = (promptId, isNowFavorited) => {
    if (isNowFavorited) setFavorites(prev => [...prev, promptId])
    else setFavorites(prev => prev.filter(id => id !== promptId))
  }

  const navigateToAdmin = () => setCurrentView(session ? 'admin' : 'auth')

  // Filter logic — zone replaces category, 'all' shows everything
  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesZone = activeZone === 'all' || p.category === activeZone
    const matchesFavorite = showFavoritesOnly ? favorites.includes(p.id) : true
    return matchesSearch && matchesZone && matchesFavorite
  })

  // Search suggestions (all zones)
  const searchSuggestions = searchQuery.length > 0
    ? prompts.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.content.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6)
    : []

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10, 10, 12, 0.75)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-ultra-thin)'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px' }}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
            onClick={() => { setCurrentView('public'); setShowFavoritesOnly(false); }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-magenta))', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#000' }}>
              <Sparkles size={20} strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: '1.2rem', margin: 0 }} className="gradient-text-modern">PROMPT LIB</h1>
          </motion.div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <button
              onClick={() => { setCurrentView('showcase'); setShowFavoritesOnly(false); }}
              style={{ background: 'none', border: 'none', color: currentView === 'showcase' ? 'var(--accent-magenta)' : 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ImageIcon size={16} /> 案例库
            </button>
            <button
              onClick={() => { setCurrentView('public'); setShowFavoritesOnly(false); setActiveZone('all'); }}
              style={{ background: 'none', border: 'none', color: currentView === 'public' && !showFavoritesOnly ? '#fff' : 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              提示词库
            </button>
            {session && (
              <button
                onClick={() => { setCurrentView('public'); setShowFavoritesOnly(true); }}
                style={{ background: 'none', border: 'none', color: showFavoritesOnly ? 'var(--accent-magenta)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '0.9rem' }}
              >
                <Heart size={16} fill={showFavoritesOnly ? 'var(--accent-magenta)' : 'none'} /> 收藏
              </button>
            )}
            <button
              onClick={navigateToAdmin}
              className="btn-cyber-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', borderColor: currentView === 'admin' ? 'var(--accent-cyan)' : 'var(--border-ultra-thin)' }}
            >
              {session ? <Settings size={16} /> : <LogIn size={16} />}
              {session ? '控制台' : '登录'}
            </button>
          </div>
        </div>
      </nav>

      <main className="container app-main">
        <AnimatePresence mode="wait">

          {/* ── 提示词库 PUBLIC VIEW ── */}
          {currentView === 'public' && (
            <motion.div
              key="public-view"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Hero Header */}
              <header style={{ textAlign: 'left', marginBottom: '56px', maxWidth: '760px' }}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(6,182,212,0.1)', color: 'var(--accent-cyan)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}
                >
                  <Sparkles size={14} /> 发现潜能
                </motion.div>
                <h1 className="hero-title">
                  极致高效的 <br />
                  <span className="gradient-text-modern">PROMPT 管理系统</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', lineHeight: '1.6' }}>
                  为未来而构建。探索、组织并瞬间激发您的 AI 创作灵感。
                </p>
              </header>

              {/* Search + CategoryNav */}
              <div style={{ marginBottom: '40px' }}>
                {/* Search */}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <Search size={20} style={{ position: 'absolute', left: '16px', top: '17px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="快速搜索提示词..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    style={{ paddingLeft: '52px', background: 'var(--card-bg)', height: '54px', width: '100%' }}
                  />

                  {/* HUD Dropdown */}
                  <AnimatePresence>
                    {isSearchFocused && searchQuery.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        className="hud-dropdown"
                        style={{ position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 200 }}
                      >
                        <div className="hud-section-label">匹配的提示词</div>
                        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                          {searchSuggestions.length > 0 ? searchSuggestions.map(p => (
                            <div key={p.id} className="hud-item" onClick={() => { setSearchQuery(p.title); setIsSearchFocused(false); }}>
                              <Sparkles size={14} className="neon-text-cyan" />
                              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                              <span className="hud-tag">{p.category}</span>
                            </div>
                          )) : (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>未找到相关提示词</div>
                          )}
                        </div>
                        <div style={{ position: 'fixed', inset: 0, zIndex: -1 }} onClick={() => setIsSearchFocused(false)} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Zone Nav */}
                <CategoryNav activeZone={activeZone} onZoneChange={zone => { setActiveZone(zone); setShowFavoritesOnly(false); }} />
              </div>

              {/* Results Grid */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', margin: '0 auto' }} />
                </div>
              ) : filteredPrompts.length === 0 ? (
                <div className="cyber-card" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
                  没有找到相关的提示词
                </div>
              ) : (
                <motion.div layout className="prompt-grid">
                  {filteredPrompts.map((prompt, index) => (
                    <PromptCard
                      key={prompt.id} prompt={prompt} session={session}
                      isFavorited={favorites.includes(prompt.id)}
                      onFavoriteToggle={handleFavoriteToggle} index={index}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── 案例库 VIEW ── */}
          {currentView === 'showcase' && <ShowcaseView key="showcase-view" />}

          {/* ── AUTH VIEW ── */}
          {currentView === 'auth' && (
            <motion.div key="auth-view" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <Auth onLogin={() => setCurrentView('admin')} />
            </motion.div>
          )}

          {/* ── ADMIN VIEW ── */}
          {currentView === 'admin' && session && (
            <motion.div key="admin-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AdminDashboard session={session} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
