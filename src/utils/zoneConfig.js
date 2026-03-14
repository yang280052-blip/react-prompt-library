// Zone definitions — single source of truth used across all components
export const ZONES = [
  { id: 'all',  label: '全部',   color: null,      colorGlow: null,                       borderColor: 'rgba(255,255,255,0.15)' },
  { id: '人设', label: '人设区', color: '#06b6d4', colorGlow: 'rgba(6,182,212,0.15)',    borderColor: 'rgba(6,182,212,0.4)' },
  { id: '场景', label: '场景区', color: '#22c55e', colorGlow: 'rgba(34,197,94,0.15)',    borderColor: 'rgba(34,197,94,0.4)' },
  { id: '风格', label: '风格区', color: '#d946ef', colorGlow: 'rgba(217,70,239,0.15)',   borderColor: 'rgba(217,70,239,0.4)' },
];

// Returns zone config for a given category string, or null if not a known zone
export const getZone = (category) => ZONES.find(z => z.id === category && z.id !== 'all') || null;
