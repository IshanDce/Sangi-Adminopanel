import React, { useEffect, useState } from 'react';
import { 
  CreditCard, CheckCircle2, XCircle, Search, AlertCircle, Copy, 
  Check, RefreshCw, User, Phone, ArrowUpRight, DollarSign, ArrowDownToLine
} from 'lucide-react';
import { AdminShell } from '../components/layout/AdminShell';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { api } from '../services/api';

export const WithdrawalsPage: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [isLoading, setIsLoading] = useState(true);

  // Approve / Reject Modals
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [utrReference, setUtrReference] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Copied state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchWithdrawals = async () => {
    setIsLoading(true);
    try {
      const res = await api.getWithdrawals({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        page,
        limit: 15,
      });
      if (res.success) {
        setWithdrawals(res.withdrawals);
        setTotal(res.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load withdrawals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [page, filterStatus]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApproveConfirm = async () => {
    if (!selectedReq || !utrReference.trim()) return;
    setActionLoading(true);
    try {
      await api.approveWithdrawal(selectedReq._id, utrReference.trim(), adminNotes);
      alert(`Withdrawal #${selectedReq.withdrawalNumber || selectedReq._id.slice(-6)} approved! User notified.`);
      setIsApproveOpen(false);
      setUtrReference('');
      setAdminNotes('');
      fetchWithdrawals();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedReq || !rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      await api.rejectWithdrawal(selectedReq._id, rejectionReason.trim());
      alert(`Withdrawal rejected. Amount has been refunded to the user's wallet.`);
      setIsRejectOpen(false);
      setRejectionReason('');
      fetchWithdrawals();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminShell
      title="Wallet Payout & Withdrawal Queue"
      subtitle="Process customer and staff bank/UPI payouts. Minimum ₹100 threshold enforced (Rule #10)"
      onRefresh={fetchWithdrawals}
      isRefreshing={isLoading}
    >
      <div className="admin-page-container">
        {/* 1. Policy Notice Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: '12px',
          color: '#166534',
          fontSize: '13px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CreditCard size={18} color="#16A34A" />
            <span>
              <strong>Minimum Payout Policy Enforced (Rule #10):</strong> All customer and staff withdrawal requests require a minimum balance of <strong>₹100.00</strong>.
            </span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', background: '#DCFCE7', borderRadius: '6px' }}>
            Active Policy
          </span>
        </div>

        {/* 2. Action Toolbar */}
        <div className="action-toolbar">
          <div className="tab-pills">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setFilterStatus(tab); setPage(1); }}
                className={`tab-btn ${filterStatus === tab ? 'active' : ''}`}
                style={{ textTransform: 'capitalize' }}
              >
                {tab === 'pending' ? 'Pending Action' : tab}
              </button>
            ))}
          </div>

          <button onClick={fetchWithdrawals} className="btn btn-secondary btn-sm" title="Refresh">
            <RefreshCw size={14} className={isLoading ? 'spin-anim' : ''} />
            <span>Refresh Queue</span>
          </button>
        </div>

        {/* 3. Withdrawals Table */}
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request ID & Date</th>
                  <th>User & Role</th>
                  <th>Payout Amount (₹)</th>
                  <th>Payout Mode</th>
                  <th>Bank / UPI Destination</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      Loading payout requests...
                    </td>
                  </tr>
                ) : withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <ArrowDownToLine size={36} color="#16A34A" />
                        <h4>No payout requests found</h4>
                        <p>No withdrawal requests matched the selected filter.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => {
                    const acc = w.accountDetails || {};
                    const isStaff = w.user?.role === 'staff';
                    const isPending = w.status === 'pending';
                    const userName = w.user?.fullName || w.user?.name || 'User';

                    return (
                      <tr key={w._id}>
                        {/* Request # */}
                        <td>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: '#F1F5F9',
                            color: '#1E293B',
                          }}>
                            {w.withdrawalNumber || w._id.slice(-6).toUpperCase()}
                          </span>
                          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: 4 }}>
                            {new Date(w.createdAt).toLocaleString()}
                          </div>
                        </td>

                        {/* User & Role */}
                        <td>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '13px' }}>
                            {userName}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: isStaff ? '#EDE9FE' : '#E0F2FE',
                              color: isStaff ? '#6D28D9' : '#0369A1',
                              textTransform: 'uppercase',
                            }}>
                              {w.user?.role || 'User'}
                            </span>
                            <span style={{ fontSize: '11.5px', color: '#64748B' }}>{w.user?.phone}</span>
                          </div>
                        </td>

                        {/* Amount */}
                        <td>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: '#15803D' }}>
                            ₹{Number(w.amount).toFixed(2)}
                          </div>
                          <span style={{ fontSize: '10.5px', color: '#16A34A', fontWeight: 600 }}>✓ Min ₹100 verified</span>
                        </td>

                        {/* Method */}
                        <td>
                          <span style={{
                            fontSize: '11.5px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#F1F5F9',
                            color: '#334155',
                            textTransform: 'capitalize',
                          }}>
                            {w.payoutMethod === 'bank_transfer' ? 'Bank Account' : (w.payoutMethod || 'Bank')}
                          </span>
                        </td>

                        {/* Destination */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '12px' }}>
                            {acc.upiId ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F172A' }}>{acc.upiId}</span>
                                <button
                                  onClick={() => copyToClipboard(acc.upiId, `upi_${w._id}`)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                                  title="Copy UPI"
                                >
                                  {copiedKey === `upi_${w._id}` ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                                </button>
                              </div>
                            ) : (
                              <>
                                <div style={{ fontWeight: 600, color: '#0F172A' }}>{acc.accountHolderName || userName}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace', color: '#475569' }}>
                                  <span>{acc.bankName || 'Bank'}: {acc.accountNumber}</span>
                                  {acc.accountNumber && (
                                    <button
                                      onClick={() => copyToClipboard(acc.accountNumber, `ac_${w._id}`)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                                    >
                                      {copiedKey === `ac_${w._id}` ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                                    </button>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace', fontSize: '11px', color: '#64748B' }}>
                                  <span>IFSC: {acc.ifscCode}</span>
                                  {acc.ifscCode && (
                                    <button
                                      onClick={() => copyToClipboard(acc.ifscCode, `ifsc_${w._id}`)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                                    >
                                      {copiedKey === `ifsc_${w._id}` ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <StatusBadge status={w.status} />
                          {w.utrReference && (
                            <div style={{ fontFamily: 'monospace', fontSize: '10.5px', color: '#64748B', marginTop: 3 }}>
                              UTR: {w.utrReference}
                            </div>
                          )}
                          {w.rejectionReason && (
                            <div style={{ fontSize: '10.5px', color: '#DC2626', marginTop: 3, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={w.rejectionReason}>
                              {w.rejectionReason}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          {isPending ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                              <button
                                onClick={() => {
                                  setSelectedReq(w);
                                  setIsApproveOpen(true);
                                }}
                                className="btn btn-primary btn-sm"
                              >
                                Approve Payout
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedReq(w);
                                  setIsRejectOpen(true);
                                }}
                                className="btn btn-danger-outline btn-sm"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>Processed</span>
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

        {/* ── Approve Payout Modal with UTR ── */}
        <Modal
          isOpen={isApproveOpen}
          onClose={() => setIsApproveOpen(false)}
          title={`Approve Payout: ₹${selectedReq?.amount}`}
          subtitle="Record transaction UTR reference for accounting & audit log"
          maxWidth="480px"
        >
          {selectedReq && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: '12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', fontSize: '12.5px', color: '#166534' }}>
                Please disburse <strong>₹{selectedReq.amount}</strong> to the beneficiary bank account and enter the <strong>UTR / Reference ID</strong> below.
              </div>

              <div className="form-group">
                <label className="form-label">Bank UTR / Transaction Reference ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR9283019283..."
                  value={utrReference}
                  onChange={(e) => setUtrReference(e.target.value)}
                  className="form-input"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Admin Internal Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Processed via Netbanking portal..."
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
          )}
        </Modal>

        {/* ── Reject Modal with Refund ── */}
        <Modal
          isOpen={isRejectOpen}
          onClose={() => setIsRejectOpen(false)}
          title="Reject Withdrawal Request"
          subtitle="Amount will be refunded back to the user's wallet automatically"
          maxWidth="480px"
        >
          {selectedReq && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: '12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '12.5px', color: '#991B1B' }}>
                Rejecting this request will immediately refund <strong>₹{selectedReq.amount}</strong> back into the user's wallet balance.
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Rejection *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Invalid IFSC code, account name mismatch on bank server..."
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
                  {actionLoading ? 'Processing...' : 'Confirm Rejection & Refund'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminShell>
  );
};
