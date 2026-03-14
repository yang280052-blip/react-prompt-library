import React from 'react';
import { motion } from 'framer-motion';
import { ZONES } from '../utils/zoneConfig';

const CategoryNav = ({ activeZone, onZoneChange }) => {
  return (
    <div className="category-nav-wrapper">
      {ZONES.map(zone => {
        const isActive = activeZone === zone.id;
        return (
          <button
            key={zone.id}
            onClick={() => onZoneChange(zone.id)}
            className="category-nav-item"
            style={{ color: isActive ? (zone.color || '#fff') : 'var(--text-muted)' }}
          >
            {isActive && (
              <motion.div
                layoutId="zone-active-bg"
                className="category-nav-active-bg"
                style={{
                  background: zone.colorGlow || 'rgba(255,255,255,0.08)',
                  border: `1px solid ${zone.borderColor}`,
                }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <span className="category-nav-label">{zone.label}</span>
            {isActive && zone.color && (
              <motion.div
                layoutId="zone-underline"
                className="category-nav-underline"
                style={{
                  background: zone.color,
                  boxShadow: `0 0 10px ${zone.color}`,
                }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryNav;
