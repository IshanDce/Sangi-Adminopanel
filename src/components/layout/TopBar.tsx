import React from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  title = 'SANGI Operations Control',
  subtitle,
  onRefresh,
  isRefreshing = false,
}) => {
  const navigate = useNavigate();

  return (
    <header style={{
      height: 'var(--header-height)',
      background: 'var(--white)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 800 }}>{title}</h1>
        {subtitle && (
          <p style={{ fontSize: '12.5px', color: 'var(--secondary-text)', marginTop: 2 }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary btn-sm"
            title="Refresh current data"
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-anim' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        )}

        <button
          onClick={() => navigate('/notifications')}
          className="btn btn-secondary btn-sm"
          title="Compose Announcement"
        >
          <Bell size={14} color="var(--primary-green)" />
          <span>Send Push</span>
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--very-light-green)',
          border: '1px solid var(--border-green)',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--dark-green)',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-green)' }}></span>
          <span>Live Operations</span>
        </div>
      </div>
    </header>
  );
};
