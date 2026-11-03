import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowDownToLine, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Copy, 
  Check, 
  Phone, 
  Landmark, 
  QrCode, 
  Zap, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { AdminShell } from '../components/layout/AdminShell';
import { Modal } from '../components/common/Modal';
import { api } from '../services/api';

interface WithdrawalItem {
  _id: string;
  withdrawalNumber?: string;
  userId?: {
    _id?: string;
    fullName?: string;
    phone?: string;
    email?: string;
    role?: string;
    walletBalance?: number;
    bankAccount?: any;
  } | string;
  user?: {
    _id?: string;
    fullName?: string;
    phone?: string;
    email?: string;
    role?: string;
    walletBalance?: number;
  };
  userRole?: string;
  amount: number;
  payoutMethod?: 'bank' | 'upi';
  accountDetails?: {
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  utrReference?: string;
  rejectionReason?: string;
  adminNotes?: string;
  createdAt: string;
}

export const WithdrawalsPage: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());
  const [timeAgo, setTimeAgo] = useState('just now');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [filterMethod, setFilterMethod] = useState<'all' | 'upi' | 'bank'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal states
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<WithdrawalItem | null>(null);
  const [utrReference, setUtrReference] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const isMountedRef = useRef(true);

  const fetchWithdrawals = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    } else {
      setIsSyncing(true);
    }

    try {
      const res = await api.getWithdrawals({
        status: filterStatus === 'all' ? undefined : filterStatus,
        limit: 50,
      });
      if (res?.success && isMountedRef.current) {
        setWithdrawals(res.withdrawals || []);
        setTotalCount(res.pagination?.total ?? (res.withdrawals?.length || 0));
        setLastSyncedAt(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsSyncing(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchWithdrawals(false);

    // ⚡ Live Auto-sync Polling: Fetches new requests or status changes every 5 seconds silently
    const pollInterval = setInterval(() => {
      fetchWithdrawals(true);
    }, 5000);

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

    const handleFocus = () => fetchWithdrawals(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      isMountedRef.current = false;
      clearInterval(pollInterval);
      clearInterval(timeInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [filterStatus]);

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

  const handleOpenApprove = (req: WithdrawalItem) => {
    setSelectedReq(req);
    setUtrReference('');
    setAdminNotes('');
    setIsApproveOpen(true);
  };

  const handleOpenReject = (req: WithdrawalItem) => {
    setSelectedReq(req);
    setRejectionReason('');
    setIsRejectOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedReq || !utrReference.trim()) return;
    setActionLoading(true);
    try {
      const res = await api.approveWithdrawal(selectedReq._id, utrReference.trim(), adminNotes.trim());
      if (res?.success) {
        setIsApproveOpen(false);
        fetchWithdrawals(false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedReq || !rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await api.rejectWithdrawal(selectedReq._id, rejectionReason.trim());
      if (res?.success) {
        setIsRejectOpen(false);
        fetchWithdrawals(false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reject withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    const userObj = w.user || (typeof w.userId === 'object' ? w.userId : null) || {};
    const acc = w.accountDetails || {};
    const method = w.payoutMethod || (acc.upiId && !acc.accountNumber ? 'upi' : 'bank');

    if (filterMethod !== 'all' && method !== filterMethod) {
      return false;
    }

    const query = search.toLowerCase().trim();
    if (!query) return true;

    return (
      (w.withdrawalNumber || '').toLowerCase().includes(query) ||
      (userObj.fullName || '').toLowerCase().includes(query) ||
      (userObj.phone || '').toLowerCase().includes(query) ||
      (acc.accountNumber || '').toLowerCase().includes(query) ||
      (acc.upiId || '').toLowerCase().includes(query) ||
      (acc.ifscCode || '').toLowerCase().includes(query) ||
      (acc.bankName || '').toLowerCase().includes(query) ||
      (acc.accountHolderName || '').toLowerCase().includes(query) ||
      String(w.amount).includes(query)
    );
  });

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const approvedCount = withdrawals.filter(w => w.status === 'approved').length;
  const rejectedCount = withdrawals.filter(w => w.status === 'rejected').length;

  return (
    <AdminShell
      title="Payout & Withdrawal Requests"
      subtitle="Process customer refunds and staff earnings payouts with transparent UTR recording"
      onRefresh={() => fetchWithdrawals(false)}
      isRefreshing={isLoading || isSyncing}
    >
      <div className="admin-page-container">
        {/* 1. Stat Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div>
              <div className="stat-label">Pending Approval</div>
              <div className="stat-value" style={{ color: '#D97706' }}>{pendingCount}</div>
              <div className="stat-subtitle">Awaiting bank/UPI transfer</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#FEF3C7', color: '#D97706' }}>
              <Clock size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Approved & Disbursed</div>
              <div className="stat-value" style={{ color: '#16A34A' }}>{approvedCount}</div>
              <div className="stat-subtitle">Confirmed with UTR</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#DCFCE7', color: '#15803D' }}>
              <CheckCircle size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Rejected & Refunded</div>
              <div className="stat-value" style={{ color: '#DC2626' }}>{rejectedCount}</div>
              <div className="stat-subtitle">Refunded to user wallet</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#FEE2E2', color: '#DC2626' }}>
              <XCircle size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Total Requests</div>
              <div className="stat-value">{totalCount}</div>
              <div className="stat-subtitle">All-time payouts</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
              <ArrowDownToLine size={24} />
            </div>
          </div>
        </div>

        {/* 2. Live Sync Status Bar */}
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
              {isSyncing ? 'Checking requests...' : `Synced ${timeAgo}`}
            </span>
          </div>

          <button 
            onClick={() => fetchWithdrawals(false)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12.5px' }}
            title="Force refresh"
          >
            <RefreshCw size={13} className={isSyncing ? 'spin-anim' : ''} />
            <span>Sync Now</span>
          </button>
        </div>

        {/* 3. Action Toolbar */}
        <div className="action-toolbar" style={{ marginTop: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <div className="tab-pills">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`tab-btn ${filterStatus === s ? 'active' : ''}`}
                  style={{ textTransform: 'capitalize' }}
                >
                  {s === 'all' ? 'All Status' : s}
                </button>
              ))}
            </div>

            <div className="tab-pills">
              {(['all', 'upi', 'bank'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setFilterMethod(m)}
                  className={`tab-btn ${filterMethod === m ? 'active' : ''}`}
                  style={{ fontSize: '12px' }}
                >
                  {m === 'all' ? 'All Methods' : m === 'upi' ? '⚡ UPI Only' : '🏦 Bank Only'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search user, phone, amount, IFSC, UPI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 4. Withdrawals Table */}
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '13%' }}>Ref & Date</th>
                  <th style={{ width: '18%' }}>Beneficiary</th>
                  <th style={{ width: '10%' }}>Amount</th>
                  <th style={{ width: '14%' }}>Chosen Method</th>
                  <th style={{ width: '27%' }}>Destination Payout Details</th>
                  <th style={{ width: '10%' }}>Status</th>
                  <th style={{ width: '8%' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      <RefreshCw size={24} className="spin-anim" style={{ margin: '0 auto 8px', color: '#16A34A' }} />
                      <div>Loading withdrawal requests...</div>
                    </td>
                  </tr>
                ) : filteredWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <ArrowDownToLine size={36} color="#16A34A" />
                        <h4>No withdrawal requests found</h4>
                        <p>No records match your selected filter criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredWithdrawals.map((w) => {
                    const userObj = w.user || (typeof w.userId === 'object' ? w.userId : null) || {};
                    const userName = userObj.fullName || 'User';
                    const userRole = userObj.role || w.userRole || 'customer';
                    const isStaff = userRole === 'staff';
                    const acc = w.accountDetails || {};
                    const method = w.payoutMethod || (acc.upiId && !acc.accountNumber ? 'upi' : 'bank');
                    const isUpi = method === 'upi';

                    return (
                      <tr key={w._id}>
                        {/* Ref & Date */}
                        <td>
                          <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F172A', fontSize: '12.5px' }}>
                            {w.withdrawalNumber || `WTH-${w._id.slice(-6).toUpperCase()}`}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: 2 }}>
                            {new Date(w.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </td>

                        {/* Beneficiary */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '13px' }}>
                              {userName}
                            </span>
                            <span style={{
                              fontSize: '9.5px',
                              fontWeight: 800,
                              padding: '2px 5px',
                              borderRadius: '4px',
                              background: isStaff ? '#EDE9FE' : '#E0F2FE',
                              color: isStaff ? '#6D28D9' : '#0369A1',
                              textTransform: 'uppercase',
                            }}>
                              {userRole}
                            </span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Phone size={11} color="#16A34A" />
                            <span style={{ fontFamily: 'monospace' }}>{userObj.phone || 'No phone'}</span>
                          </div>
                        </td>

                        {/* Amount */}
                        <td>
                          <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A' }}>
                            ₹{Number(w.amount).toLocaleString('en-IN')}
                          </div>
                        </td>

                        {/* Chosen Method Badge */}
                        <td>
                          {isUpi ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: '#DCFCE7',
                              color: '#15803D',
                              border: '1px solid #86EFAC',
                              fontWeight: 800,
                              fontSize: '11.5px',
                              padding: '3px 8px',
                              borderRadius: '6px'
                            }}>
                              <Zap size={12} /> UPI Payout
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: '#E0F2FE',
                              color: '#0369A1',
                              border: '1px solid #BAE6FD',
                              fontWeight: 800,
                              fontSize: '11.5px',
                              padding: '3px 8px',
                              borderRadius: '6px'
                            }}>
                              <Landmark size={12} /> Bank Transfer
                            </span>
                          )}
                        </td>

                        {/* Destination Payout Details */}
                        <td>
                          {isUpi ? (
                            acc.upiId ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '4px 8px', borderRadius: '6px' }}>
                                <QrCode size={13} color="#15803D" />
                                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '12.5px', color: '#166534' }}>
                                  {acc.upiId}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(acc.upiId!, `upi_${w._id}`)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16A34A', padding: 2 }}
                                  title="Copy UPI ID"
                                >
                                  {copiedKey === `upi_${w._id}` ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#EF4444' }}>No UPI ID on record</span>
                            )
                          ) : (
                            acc.accountNumber ? (
                              <div style={{ background: '#F8FAFC', padding: '6px 8px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px' }}>
                                <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{acc.bankName || 'Bank'}</span>
                                  <span>{acc.accountHolderName || userName}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F172A' }}>
                                      {acc.accountNumber}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(acc.accountNumber!, `ac_${w._id}`)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 1 }}
                                      title="Copy A/C #"
                                    >
                                      {copiedKey === `ac_${w._id}` ? <Check size={11} color="#16A34A" /> : <Copy size={11} />}
                                    </button>
                                  </div>
                                  {acc.ifscCode && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#475569', fontSize: '11.5px' }}>
                                        {acc.ifscCode}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(acc.ifscCode!, `ifsc_${w._id}`)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 1 }}
                                        title="Copy IFSC"
                                      >
                                        {copiedKey === `ifsc_${w._id}` ? <Check size={11} color="#16A34A" /> : <Copy size={11} />}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#EF4444' }}>No bank account on record</span>
                            )
                          )}
                        </td>

                        {/* Status */}
                        <td>
                          {w.status === 'pending' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEF3C7', color: '#B45309', fontWeight: 700, fontSize: '11.5px', padding: '3px 8px', borderRadius: '6px' }}>
                              <Clock size={12} /> Pending
                            </span>
                          )}
                          {w.status === 'approved' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#DCFCE7', color: '#15803D', fontWeight: 700, fontSize: '11.5px', padding: '3px 8px', borderRadius: '6px' }}>
                              <CheckCircle size={12} /> Disbursed
                            </span>
                          )}
                          {w.status === 'rejected' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEE2E2', color: '#DC2626', fontWeight: 700, fontSize: '11.5px', padding: '3px 8px', borderRadius: '6px' }}>
                              <XCircle size={12} /> Rejected
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td>
                          {w.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => handleOpenApprove(w)}
                                className="btn btn-sm"
                                style={{ background: '#16A34A', color: '#fff', border: 'none', padding: '4px 10px', fontSize: '12px', fontWeight: 700, borderRadius: '6px' }}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenReject(w)}
                                className="btn btn-sm"
                                style={{ background: '#EF4444', color: '#fff', border: 'none', padding: '4px 8px', fontSize: '12px', fontWeight: 700, borderRadius: '6px' }}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#94A3B8' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Modal 1: Approve Payout Modal with Beneficiary Card ─── */}
        <Modal
          isOpen={isApproveOpen}
          onClose={() => setIsApproveOpen(false)}
          title="Approve & Disburse Payout"
          subtitle="Confirm payment transfer to beneficiary destination and record UTR"
          maxWidth="540px"
        >
          {selectedReq && (() => {
            const reqUser = selectedReq.user || (typeof selectedReq.userId === 'object' ? selectedReq.userId : null) || {};
            const reqUserName = reqUser.fullName || 'User';
            const reqAcc = selectedReq.accountDetails || {};
            const method = selectedReq.payoutMethod || (reqAcc.upiId && !reqAcc.accountNumber ? 'upi' : 'bank');
            const isUpi = method === 'upi';

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Method Alert Box */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: isUpi ? '#F0FDF4' : '#EFF6FF',
                  border: `1.5px solid ${isUpi ? '#86EFAC' : '#BFDBFE'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isUpi ? <Zap size={16} color="#16A34A" /> : <Landmark size={16} color="#2563EB" />}
                      <span style={{ fontWeight: 800, fontSize: '13px', color: isUpi ? '#14532D' : '#1E40AF' }}>
                        {isUpi ? 'Requested Payout: ⚡ Instant UPI Transfer' : 'Requested Payout: 🏦 Direct Bank Account (IMPS/NEFT)'}
                      </span>
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: isUpi ? '#15803D' : '#1E40AF' }}>
                      ₹{selectedReq.amount}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: 10 }}>
                    Beneficiary: <strong style={{ color: '#0F172A' }}>{reqUserName}</strong> ({reqUser.role || selectedReq.userRole}) · Phone: <strong>{reqUser.phone || 'N/A'}</strong>
                  </div>

                  {/* Highlighted Primary Payout Box */}
                  {isUpi && reqAcc.upiId ? (
                    <div style={{
                      background: '#FFFFFF',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #22C55E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontSize: '10.5px', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
                          Primary UPI VPA Destination
                        </div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 900, color: '#14532D', fontSize: '15px', marginTop: 2 }}>
                          {reqAcc.upiId}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(reqAcc.upiId!, 'modal_upi')}
                        style={{
                          background: '#DCFCE7',
                          border: '1px solid #86EFAC',
                          color: '#15803D',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        {copiedKey === 'modal_upi' ? <Check size={13} color="#15803D" /> : <Copy size={13} />}
                        <span>Copy UPI ID</span>
                      </button>
                    </div>
                  ) : null}

                  {!isUpi && reqAcc.accountNumber ? (
                    <div style={{
                      background: '#FFFFFF',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #3B82F6',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '10.5px', color: '#1E40AF', fontWeight: 700, textTransform: 'uppercase' }}>
                            {reqAcc.bankName || 'Bank'} · Holder: {reqAcc.accountHolderName || reqUserName}
                          </div>
                          <div style={{ fontFamily: 'monospace', fontWeight: 900, color: '#0F172A', fontSize: '15px', marginTop: 2 }}>
                            {reqAcc.accountNumber}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(reqAcc.accountNumber!, 'modal_acc')}
                          style={{
                            background: '#EFF6FF',
                            border: '1px solid #93C5FD',
                            color: '#1D4ED8',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          {copiedKey === 'modal_acc' ? <Check size={13} color="#1D4ED8" /> : <Copy size={13} />}
                          <span>Copy A/C #</span>
                        </button>
                      </div>

                      {reqAcc.ifscCode && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #E2E8F0', paddingTop: 6 }}>
                          <div>
                            <span style={{ fontSize: '11px', color: '#64748B' }}>IFSC Code: </span>
                            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#1E293B' }}>{reqAcc.ifscCode}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(reqAcc.ifscCode!, 'modal_ifsc')}
                            style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            {copiedKey === 'modal_ifsc' ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                            <span>Copy IFSC</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Fallback secondary view if user also has the other method */}
                  {isUpi && reqAcc.accountNumber && (
                    <div style={{ marginTop: 8, fontSize: '11.5px', color: '#64748B' }}>
                      Alternative Bank Account on file: <strong>{reqAcc.bankName || 'Bank'}</strong> (A/C: {reqAcc.accountNumber}, IFSC: {reqAcc.ifscCode})
                    </div>
                  )}

                  {!isUpi && reqAcc.upiId && (
                    <div style={{ marginTop: 8, fontSize: '11.5px', color: '#64748B' }}>
                      Alternative UPI on file: <strong>{reqAcc.upiId}</strong>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Bank UTR / Transaction Reference ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UTR2918239012 or IMPS Reference..."
                    value={utrReference}
                    onChange={(e) => setUtrReference(e.target.value)}
                    className="form-input"
                    style={{ fontFamily: 'monospace', fontWeight: 700 }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Internal Admin Note (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Disbursed via ICICI Corporate NetBanking..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setIsApproveOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading || !utrReference.trim()}
                    onClick={handleApproveConfirm}
                    className="btn btn-primary"
                  >
                    {actionLoading ? 'Processing...' : 'Confirm Approval & Record UTR'}
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>

        {/* ─── Modal 2: Reject Modal with Refund Notice ─── */}
        <Modal
          isOpen={isRejectOpen}
          onClose={() => setIsRejectOpen(false)}
          title="Reject Withdrawal Request"
          subtitle="Amount will be refunded back to the user's wallet automatically"
          maxWidth="480px"
        >
          {selectedReq && (() => {
            const reqUser = selectedReq.user || (typeof selectedReq.userId === 'object' ? selectedReq.userId : null) || {};
            const reqUserName = reqUser.fullName || 'User';

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '12.5px', color: '#991B1B' }}>
                  Rejecting this request will immediately refund <strong>₹{selectedReq.amount}</strong> back into <strong>{reqUserName}</strong>'s wallet balance.
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for Rejection *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Invalid account details, IFSC mismatch with beneficiary name..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="form-textarea"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setIsRejectOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading || !rejectionReason.trim()}
                    onClick={handleRejectConfirm}
                    className="btn btn-danger"
                  >
                    {actionLoading ? 'Processing...' : 'Confirm Rejection & Refund Wallet'}
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      </div>
    </AdminShell>
  );
};
