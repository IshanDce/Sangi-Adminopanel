import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface AdminShellProps {
  title?: string;
  subtitle?: string;
  pendingKycCount?: number;
  pendingWithdrawalsCount?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({
  title = 'SANGI Operations Control',
  subtitle,
  pendingKycCount,
  pendingWithdrawalsCount,
  onRefresh,
  isRefreshing,
  children,
}) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Sidebar
        pendingKycCount={pendingKycCount}
        pendingWithdrawalsCount={pendingWithdrawalsCount}
      />
      <div style={{
        marginLeft: 'var(--sidebar-width)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}>
        <TopBar
          title={title}
          subtitle={subtitle}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
        <main style={{ padding: '28px 32px', flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
};
