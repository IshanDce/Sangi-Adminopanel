import React, { useState, useEffect, useRef } from 'react';
import { 
  Landmark, 
  Search, 
  Copy, 
  Check, 
  Users, 
  Wallet, 
  QrCode, 
  Phone, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle,
  Radio
} from 'lucide-react';
import { AdminShell } from '../components/layout/AdminShell';
import { api } from '../services/api';

interface BankAccountItem {
  _id?: string;
  id?: string;
  userId?: string;
  fullName?: string;
  name?: string;
  phone?: string;
  email?: string;
  role: 'customer' | 'staff';
  walletBalance?: number;
  isBlocked?: boolean;
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  hasBank?: boolean;
  hasUpi?: boolean;
  isFullyLinked?: boolean;
  bankAccount?: {
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
  updatedAt?: string;
}

export const BankAccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<BankAccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());
  const [timeAgo, setTimeAgo] = useState('just now');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'staff' | 'customer'>('all');
  const [filterType, setFilterType] = useState<'all' | 'both' | 'upi' | 'bank'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  const fetchBankAccounts = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    } else {
      setIsSyncing(true);
    }

    try {
      const res = await api.getBankAccounts();
      if (res?.success && isMountedRef.current) {
        setAccounts(res.accounts || []);
        setLastSyncedAt(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch bank accounts directory:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsSyncing(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchBankAccounts(false);

    // ⚡ Live Auto-sync Polling: Fetches updates every 5 seconds silently without needing refresh
    const pollInterval = setInterval(() => {
      fetchBankAccounts(true);
    }, 5000);

    // Update relative time display every second
    const timeInterval = setInterval(() => {
      const diffSec = Math.floor((Date.now() - lastSyncedAt.getTime()) / 1000);
      if (diffSec < 3) {
        setTimeAgo('just now');
      } else if (diffSec < 60) {
        setTimeAgo(`${diffSec}s ago`);
      } else {
        const min = Math.floor(diffSec / 60);
        setTimeAgo(`${min}m ago`);
      }
    }, 1000);

    // Also sync on window focus
    const handleFocus = () => fetchBankAccounts(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      isMountedRef.current = false;
      clearInterval(pollInterval);
      clearInterval(timeInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
      } else {
        // Fallback for HTTP IP address contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedKey(key);
      setTimeout(() => {
        if (isMountedRef.current) setCopiedKey(null);
      }, 2000);
    } catch (e) {
      console.warn('Failed to copy text:', e);
    }
  };

  const filteredAccounts = accounts.filter((item) => {
    const matchesRole = filterRole === 'all' || item.role === filterRole;

    const acc = item.bankAccount || item || {};
    const accountNumber = acc.accountNumber || item.accountNumber || '';
    const ifscCode = acc.ifscCode || item.ifscCode || '';
    const upiId = acc.upiId || item.upiId || '';
    const bankName = acc.bankName || item.bankName || '';
    const accountHolderName = acc.accountHolderName || item.accountHolderName || item.fullName || '';

    const hasBank = Boolean(accountNumber && accountNumber.trim() !== '');
    const hasUpi = Boolean(upiId && upiId.trim() !== '');

    let matchesType = true;
    if (filterType === 'both') matchesType = hasBank && hasUpi;
    else if (filterType === 'upi') matchesType = hasUpi;
    else if (filterType === 'bank') matchesType = hasBank;

    const query = search.toLowerCase().trim();
    if (!query) return matchesRole && matchesType;

    const matchesSearch = 
      (item.fullName || item.name || '').toLowerCase().includes(query) ||
      (item.phone || '').toLowerCase().includes(query) ||
      accountNumber.toLowerCase().includes(query) ||
      ifscCode.toLowerCase().includes(query) ||
      upiId.toLowerCase().includes(query) ||
      bankName.toLowerCase().includes(query) ||
      accountHolderName.toLowerCase().includes(query);

    return matchesRole && matchesType && matchesSearch;
  });

  const totalWithBoth = accounts.filter(a => {
    const acc = a.bankAccount || a;
    return Boolean((acc.accountNumber || a.accountNumber) && (acc.upiId || a.upiId));
  }).length;

  const totalWithUpi = accounts.filter(a => {
    const acc = a.bankAccount || a;
    return Boolean(acc.upiId || a.upiId);
  }).length;

  const totalWithBank = accounts.filter(a => {
    const acc = a.bankAccount || a;
    return Boolean(acc.accountNumber || a.accountNumber);
  }).length;

  return (
    <AdminShell
      title="Bank Details & UPI Directory"
      subtitle="Live directory of verified Bank Accounts and UPI IDs uploaded by customers and staff (Rule #9)"
      onRefresh={() => fetchBankAccounts(false)}
      isRefreshing={isLoading || isSyncing}
    >
      <div className="admin-page-container">
        {/* 1. Stat Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div>
              <div className="stat-label">Total Accounts Uploaded</div>
              <div className="stat-value">{accounts.length}</div>
              <div className="stat-subtitle">All registered beneficiaries</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#F0FDF4', color: '#16A34A' }}>
              <Landmark size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Both Bank & UPI Linked</div>
              <div className="stat-value" style={{ color: '#16A34A' }}>{totalWithBoth}</div>
              <div className="stat-subtitle">100% Payout Ready</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#DCFCE7', color: '#15803D' }}>
              <ShieldCheck size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Bank Accounts</div>
              <div className="stat-value">{totalWithBank}</div>
              <div className="stat-subtitle">Direct NEFT/IMPS accounts</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#E0F2FE', color: '#0369A1' }}>
              <Wallet size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">UPI ID Destinations</div>
              <div className="stat-value" style={{ color: '#D97706' }}>{totalWithUpi}</div>
              <div className="stat-subtitle">Instant VPA payouts</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#FEF3C7', color: '#D97706' }}>
              <QrCode size={24} />
            </div>
          </div>
        </div>

        {/* 2. Live Sync Bar & Action Toolbar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 16px',
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          marginBottom: 16
        }}>
          {/* Live Auto-Sync Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#166534'
            }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#22C55E',
                boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.35)',
                display: 'inline-block'
              }} />
              <span>Live Auto-Sync Active (5s)</span>
            </div>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              {isSyncing ? 'Syncing updates...' : `Synced ${timeAgo}`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button 
              onClick={() => fetchBankAccounts(false)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12.5px' }}
              title="Force sync now"
            >
              <RefreshCw size={13} className={isSyncing ? 'spin-anim' : ''} />
              <span>Sync Now</span>
            </button>
          </div>
        </div>

        {/* 3. Filter Pills & Search */}
        <div className="action-toolbar" style={{ marginTop: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <div className="tab-pills">
              {(['all', 'staff', 'customer'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`tab-btn ${filterRole === role ? 'active' : ''}`}
                  style={{ textTransform: 'capitalize' }}
                >
                  {role === 'all' ? 'All Roles' : `${role}s`}
                </button>
              ))}
            </div>

            <div className="tab-pills">
              {(['all', 'both', 'upi', 'bank'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`tab-btn ${filterType === t ? 'active' : ''}`}
                  style={{ fontSize: '12px' }}
                >
                  {t === 'all' ? 'All Methods' : t === 'both' ? 'Both Linked' : t === 'upi' ? 'UPI Only' : 'Bank Only'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search name, phone, account #, IFSC, UPI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 4. Table */}
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>User & Contact</th>
                  <th style={{ width: '30%' }}>Bank Account Details (NEFT/IMPS)</th>
                  <th style={{ width: '22%' }}>UPI ID (Instant Payout)</th>
                  <th style={{ width: '13%' }}>Payout Readiness</th>
                  <th style={{ width: '13%' }}>Wallet Balance</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && accounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      <RefreshCw size={24} className="spin-anim" style={{ margin: '0 auto 8px', color: '#16A34A' }} />
                      <div>Loading bank directory...</div>
                    </td>
                  </tr>
                ) : filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <Landmark size={36} color="#16A34A" />
                        <h4>No accounts found</h4>
                        <p>No bank or UPI accounts match your current query.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((item) => {
                    const acc = item.bankAccount || item || {};
                    const isStaff = item.role === 'staff';
                    const userName = item.fullName || item.name || 'User';
                    const accountKey = item._id || item.id || `acc_${item.phone}`;

                    const accountNumber = acc.accountNumber || item.accountNumber || '';
                    const ifscCode = acc.ifscCode || item.ifscCode || '';
                    const upiId = acc.upiId || item.upiId || '';
                    const bankName = acc.bankName || item.bankName || 'Bank';
                    const accountHolderName = acc.accountHolderName || item.accountHolderName || userName;

                    const hasBank = Boolean(accountNumber && accountNumber.trim() !== '');
                    const hasUpi = Boolean(upiId && upiId.trim() !== '');

                    return (
                      <tr key={accountKey}>
                        {/* 1. User & Contact */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '13.5px' }}>
                              {userName}
                            </div>
                            <span style={{
                              fontSize: '9.5px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: isStaff ? '#EDE9FE' : '#E0F2FE',
                              color: isStaff ? '#6D28D9' : '#0369A1',
                              textTransform: 'uppercase',
                              letterSpacing: '0.4px'
                            }}>
                              {item.role}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <Phone size={11} color="#16A34A" />
                            <span style={{ fontFamily: 'monospace' }}>{item.phone || 'No phone'}</span>
                          </div>
                        </td>

                        {/* 2. Bank Details (NEFT/IMPS) */}
                        <td>
                          {hasBank ? (
                            <div style={{
                              background: '#F8FAFC',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: '1px solid #E2E8F0'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                                  {bankName}
                                </span>
                                <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                                  Holder: <strong style={{ color: '#1E293B' }}>{accountHolderName}</strong>
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: '10.5px', color: '#64748B' }}>A/C:</span>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F172A', fontSize: '13px' }}>
                                    {accountNumber}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(accountNumber, `ac_${accountKey}`)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 2 }}
                                    title="Copy Account Number"
                                  >
                                    {copiedKey === `ac_${accountKey}` ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                                  </button>
                                </div>

                                {ifscCode && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderLeft: '1px solid #CBD5E1', paddingLeft: 8 }}>
                                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>IFSC:</span>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#334155', fontSize: '12px' }}>
                                      {ifscCode}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(ifscCode, `ifsc_${accountKey}`)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 2 }}
                                      title="Copy IFSC"
                                    >
                                      {copiedKey === `ifsc_${accountKey}` ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '5px 9px',
                              borderRadius: '6px',
                              background: '#F1F5F9',
                              color: '#94A3B8',
                              fontSize: '11.5px'
                            }}>
                              <AlertCircle size={12} />
                              <span>Bank account not linked</span>
                            </div>
                          )}
                        </td>

                        {/* 3. UPI Details (Instant) */}
                        <td>
                          {hasUpi ? (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                              background: '#DCFCE7',
                              border: '1px solid #BBF7D0',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              minWidth: '180px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <QrCode size={13} color="#15803D" />
                                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '12.5px', color: '#14532D' }}>
                                  {upiId}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(upiId, `upi_${accountKey}`)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16A34A', padding: 2 }}
                                title="Copy UPI ID"
                              >
                                {copiedKey === `upi_${accountKey}` ? <Check size={13} color="#15803D" /> : <Copy size={13} />}
                              </button>
                            </div>
                          ) : (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '5px 9px',
                              borderRadius: '6px',
                              background: '#F1F5F9',
                              color: '#94A3B8',
                              fontSize: '11.5px'
                            }}>
                              <AlertCircle size={12} />
                              <span>UPI ID not linked</span>
                            </div>
                          )}
                        </td>

                        {/* 4. Payout Readiness Status */}
                        <td>
                          {hasBank && hasUpi ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: '#DCFCE7',
                              color: '#15803D',
                              fontWeight: 700,
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              border: '1px solid #86EFAC'
                            }}>
                              <Check size={11} /> Both Linked
                            </span>
                          ) : hasBank ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: '#E0F2FE',
                              color: '#0369A1',
                              fontWeight: 700,
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              border: '1px solid #BAE6FD'
                            }}>
                              <Landmark size={11} /> Bank Only
                            </span>
                          ) : hasUpi ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: '#F3E8FF',
                              color: '#7E22CE',
                              fontWeight: 700,
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              border: '1px solid #E9D5FF'
                            }}>
                              <QrCode size={11} /> UPI Only
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '11px',
                              color: '#94A3B8',
                              fontStyle: 'italic'
                            }}>
                              None
                            </span>
                          )}
                        </td>

                        {/* 5. Wallet Balance */}
                        <td>
                          <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#15803D' }}>
                            ₹{Number(item.walletBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};
