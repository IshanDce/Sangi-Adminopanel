import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  ShieldCheck,
  CalendarDays,
  Sparkles,
  ArrowDownToLine,
  Landmark,
  BellRing,
  LogOut,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../services/authContext';

interface SidebarProps {
  pendingKycCount?: number;
  pendingWithdrawalsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  pendingKycCount = 0,
  pendingWithdrawalsCount = 0,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/staff', label: 'Staff Directory', icon: Briefcase },
    {
      to: '/kyc-approval',
      label: 'KYC Verification',
      icon: ShieldCheck,
      badge: pendingKycCount > 0 ? pendingKycCount : undefined,
      badgeColor: 'badge-warning',
    },
    { to: '/bookings', label: 'Bookings & GPS', icon: CalendarDays },
    { to: '/services', label: 'Services & Pricing', icon: Sparkles },
    {
      to: '/withdrawals',
      label: 'Withdrawals',
      icon: ArrowDownToLine,
      badge: pendingWithdrawalsCount > 0 ? pendingWithdrawalsCount : undefined,
      badgeColor: 'badge-danger',
    },
    { to: '/bank-accounts', label: 'Bank Directory', icon: Landmark },
    { to: '/notifications', label: 'Notifications', icon: BellRing },
  ];

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      background: 'var(--sidebar-gradient)',
      color: 'var(--white)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: 'var(--shadow-xl)',
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-md)',
          background: 'var(--primary-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.4)',
        }}>
          <Shield size={22} color="#FFFFFF" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{
            fontSize: '19px',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            SANGI <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(34, 197, 94, 0.2)',
              color: 'var(--secondary-green)',
              fontWeight: 700,
              letterSpacing: '0.08em',
            }}>ADMIN</span>
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
            Operations & Control
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav style={{
        flex: 1,
        padding: '16px 12px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'rgba(255, 255, 255, 0.4)',
          padding: '8px 12px 4px',
        }}>
          Main Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--white)' : 'rgba(255, 255, 255, 0.72)',
                background: isActive ? 'var(--primary-green)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13.5px',
                textDecoration: 'none',
                transition: 'var(--transition-fast)',
                boxShadow: isActive ? '0 4px 14px rgba(22, 163, 74, 0.45)' : 'none',
              })}
            >
              <Icon size={18} strokeWidth={2} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge !== undefined && (
                <span className={`badge ${item.badgeColor || 'badge-success'}`} style={{ fontSize: '11px', padding: '2px 7px' }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'rgba(255, 255, 255, 0.4)',
          padding: '16px 12px 4px',
        }}>
          Quick Links
        </div>

        <a
          href="http://13.140.190.198:5000/health"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '13px',
            textDecoration: 'none',
          }}
        >
          <ExternalLink size={16} />
          <span>API Health Status</span>
        </a>
      </nav>

      {/* User Footer Card */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(0, 0, 0, 0.25)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '15px',
          }}>
            {user?.fullName?.charAt(0) || 'A'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.fullName || 'SANGI Admin'}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }}></span>
              Online
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: '#F87171',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition-fast)',
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
