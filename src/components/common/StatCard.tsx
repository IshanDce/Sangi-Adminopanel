import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'green' | 'blue' | 'amber' | 'red';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'green',
  onClick,
}) => {
  const colorMap = {
    green: {
      bg: 'var(--very-light-green)',
      text: 'var(--primary-green)',
      border: 'var(--border-green)',
    },
    blue: {
      bg: '#E0F2FE',
      text: '#0284C7',
      border: 'rgba(2, 132, 199, 0.25)',
    },
    amber: {
      bg: '#FEF3C7',
      text: '#D97706',
      border: 'rgba(217, 119, 6, 0.25)',
    },
    red: {
      bg: '#FEE2E2',
      text: '#DC2626',
      border: 'rgba(220, 38, 38, 0.25)',
    },
  };

  const scheme = colorMap[color];

  return (
    <div
      onClick={onClick}
      className="card"
      style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--secondary-text)', marginBottom: 6 }}>
          {title}
        </div>
        <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--dark-text)' }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ fontSize: '12px', color: 'var(--muted-text)', marginTop: 4 }}>
            {subtitle}
          </div>
        )}
      </div>

      <div style={{
        width: 48,
        height: 48,
        borderRadius: 'var(--radius-md)',
        background: scheme.bg,
        border: `1px solid ${scheme.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: scheme.text,
      }}>
        <Icon size={24} />
      </div>
    </div>
  );
};
