import React, { useEffect, useState } from 'react';
import { 
  Search, Ban, CheckCircle, ShieldAlert, Phone, Mail, Wallet, 
  MapPin, Eye, Users, UserCheck, UserX, RefreshCw, Share2
} from 'lucide-react';
import { AdminShell } from '../components/layout/AdminShell';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { api } from '../services/api';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterBlocked, setFilterBlocked] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Selected customer for detail / block modal
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerDetails, setCustomerDetails] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCustomers({
        search: search.trim() || undefined,
        isBlocked: filterBlocked !== 'all' ? filterBlocked : undefined,
        page,
        limit: 15,
      });
      if (res.success) {
        setCustomers(res.customers);
        setTotal(res.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, filterBlocked]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleOpenDetails = async (cust: any) => {
    setSelectedCustomer(cust);
    setIsDetailOpen(true);
    try {
      const res = await api.getCustomerById(cust._id);
      if (res.success) {
        setCustomerDetails(res);
      }
    } catch (err) {
      console.error('Failed to load customer profile:', err);
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedCustomer) return;
    setActionLoading(true);
    try {
      const newBlockedState = !selectedCustomer.isBlocked;
      await api.toggleBlockUser(selectedCustomer._id, newBlockedState, blockReason);
      setIsBlockModalOpen(false);
      setBlockReason('');
      fetchCustomers();
      if (isDetailOpen) {
        setSelectedCustomer({ ...selectedCustomer, isBlocked: newBlockedState });
      }
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const activeCount = customers.filter(c => !c.isBlocked).length;
  const blockedCount = customers.filter(c => c.isBlocked).length;

  return (
    <AdminShell
      title="Customer Accounts Directory"
      subtitle="Inspect customer profiles, live GPS locations, wallet balances, and manage security suspensions (Rules #1, #3)"
      onRefresh={fetchCustomers}
      isRefreshing={isLoading}
    >
      <div className="admin-page-container">
        {/* 1. Stat Cards Row */}
        <div className="stats-grid">
          <div className="stat-card">
            <div>
              <div className="stat-label">Total Customers</div>
              <div className="stat-value">{total}</div>
              <div className="stat-subtitle">Registered app users</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#F0FDF4', color: '#16A34A' }}>
              <Users size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Active Customers</div>
              <div className="stat-value">{activeCount}</div>
              <div className="stat-subtitle">In good standing</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#DCFCE7', color: '#15803D' }}>
              <UserCheck size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Suspended Accounts</div>
              <div className="stat-value">{blockedCount}</div>
              <div className="stat-subtitle">Access restricted</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#FEE2E2', color: '#DC2626' }}>
              <UserX size={24} />
            </div>
          </div>
        </div>

        {/* 2. Action & Filter Toolbar */}
        <div className="action-toolbar">
          <div className="tab-pills">
            <button
              onClick={() => { setFilterBlocked('all'); setPage(1); }}
              className={`tab-btn ${filterBlocked === 'all' ? 'active' : ''}`}
            >
              All Customers ({total})
            </button>
            <button
              onClick={() => { setFilterBlocked('false'); setPage(1); }}
              className={`tab-btn ${filterBlocked === 'false' ? 'active' : ''}`}
            >
              Active Only
            </button>
            <button
              onClick={() => { setFilterBlocked('true'); setPage(1); }}
              className={`tab-btn ${filterBlocked === 'true' ? 'active' : ''}`}
            >
              Suspended
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <form onSubmit={handleSearchSubmit} className="search-input-wrapper">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search customers by name, phone, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            <button onClick={fetchCustomers} className="btn btn-secondary btn-sm" title="Refresh">
              <RefreshCw size={14} className={isLoading ? 'spin-anim' : ''} />
            </button>
          </div>
        </div>

        {/* 3. Customers Data Table */}
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer Profile</th>
                  <th>Contact Details</th>
                  <th>Wallet Balance</th>
                  <th>Referral Code</th>
                  <th>Last GPS Location</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      Loading customers...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <Users size={36} color="#16A34A" />
                        <h4>No customer accounts found</h4>
                        <p>No customers matched your filter criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => {
                    const name = c.fullName || c.name || 'Customer';

                    return (
                      <tr key={c._id}>
                        {/* Avatar & Name */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              backgroundColor: '#DCFCE7',
                              border: '1px solid #BBF7D0',
                              color: '#166534',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '14px',
                              overflow: 'hidden',
                              flexShrink: 0,
                            }}>
                              {c.profilePhotoUrl ? (
                                <img src={c.profilePhotoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '13.5px' }}>
                                {name}
                              </div>
                              <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                                Joined {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '12.5px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#1E293B', fontWeight: 600 }}>
                              <Phone size={12} color="#16A34A" /> {c.phone}
                            </span>
                            {c.email && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748B', fontSize: '11.5px' }}>
                                <Mail size={12} color="#94A3B8" /> {c.email}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Wallet Balance */}
                        <td>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#15803D' }}>
                            ₹{(c.walletBalance || 0).toLocaleString('en-IN')}
                          </div>
                        </td>

                        {/* Referral Code */}
                        <td>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: '#F1F5F9',
                            color: '#334155',
                          }}>
                            {c.referralCode || 'N/A'}
                          </span>
                          {c.referralCount > 0 && (
                            <div style={{ fontSize: '10.5px', color: '#16A34A', fontWeight: 600, marginTop: 2 }}>
                              {c.referralCount} referred
                            </div>
                          )}
                        </td>

                        {/* GPS */}
                        <td>
                          {c.lastKnownLat && c.lastKnownLng ? (
                            <span style={{
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              padding: '2px 6px',
                              background: '#F0FDF4',
                              borderRadius: '4px',
                              color: '#166534',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}>
                              <MapPin size={11} /> {c.lastKnownLat.toFixed(3)}, {c.lastKnownLng.toFixed(3)}
                            </span>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>Not recorded</span>
                          )}
                        </td>

                        {/* Status */}
                        <td>
                          <StatusBadge status={c.isBlocked ? 'blocked' : 'active'} />
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              onClick={() => handleOpenDetails(c)}
                              className="btn btn-secondary btn-sm"
                              title="Inspect Profile Dossier"
                            >
                              <Eye size={13} />
                              <span>Inspect</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCustomer(c);
                                setIsBlockModalOpen(true);
                              }}
                              className={`btn btn-sm ${c.isBlocked ? 'btn-outline-green' : 'btn-danger-outline'}`}
                              title={c.isBlocked ? 'Restore Account' : 'Suspend Account'}
                            >
                              {c.isBlocked ? <CheckCircle size={13} /> : <Ban size={13} />}
                              <span>{c.isBlocked ? 'Unblock' : 'Block'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 15 && (
            <div className="table-pagination">
              <span>Showing {((page - 1) * 15) + 1} - {Math.min(page * 15, total)} of {total} customers</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="btn btn-secondary btn-sm"
                >
                  Previous
                </button>
                <button
                  disabled={page * 15 >= total}
                  onClick={() => setPage(p => p + 1)}
                  className="btn btn-secondary btn-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Customer Dossier Modal ── */}
        <Modal
          isOpen={isDetailOpen}
          onClose={() => { setIsDetailOpen(false); setCustomerDetails(null); }}
          title={selectedCustomer?.fullName || selectedCustomer?.name || 'Customer Dossier'}
          subtitle={`Joined on ${selectedCustomer?.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString() : 'N/A'}`}
          maxWidth="640px"
        >
          {selectedCustomer && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Profile Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: '#F0FDF4',
                borderRadius: '12px',
                border: '1px solid #BBF7D0',
              }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#064E3B' }}>
                    {selectedCustomer.fullName || selectedCustomer.name}
                  </h3>
                  <div style={{ fontSize: '12.5px', color: '#166534', marginTop: 2 }}>
                    {selectedCustomer.phone} {selectedCustomer.email && `• ${selectedCustomer.email}`}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#15803D', fontWeight: 700, marginTop: 4 }}>
                    Referral Code: {selectedCustomer.referralCode} ({selectedCustomer.referralCount || 0} referred)
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>Wallet Balance</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#065F46' }}>
                    ₹{(selectedCustomer.walletBalance || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Suspension Notice if blocked */}
              {selectedCustomer.isBlocked && (
                <div style={{
                  padding: '12px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  color: '#991B1B',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <ShieldAlert size={16} />
                  <span>
                    <strong>Account Suspended:</strong> {selectedCustomer.blockReason || 'Terms violation'}
                  </span>
                </div>
              )}

              {/* Recent Bookings */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                    Recent Service Bookings ({customerDetails?.bookings?.length || 0})
                  </span>
                </div>

                {customerDetails?.bookings?.length === 0 ? (
                  <div style={{ fontSize: '12.5px', color: '#94A3B8', fontStyle: 'italic', padding: '10px 0' }}>
                    No bookings recorded for this customer yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                    {customerDetails?.bookings?.map((b: any) => (
                      <div
                        key={b._id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '12.5px',
                        }}
                      >
                        <div>
                          <strong>{b.bookingNumber}</strong> — {b.service}
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: 2 }}>
                            Staff: {b.staffId?.fullName || 'N/A'} • {new Date(b.date).toLocaleDateString()}
                          </div>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="btn btn-secondary"
                >
                  Close Dossier
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailOpen(false);
                    setIsBlockModalOpen(true);
                  }}
                  className={`btn ${selectedCustomer.isBlocked ? 'btn-outline-green' : 'btn-danger'}`}
                >
                  {selectedCustomer.isBlocked ? 'Restore Customer Access' : 'Suspend / Block Customer'}
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* ── Block / Unblock Modal ── */}
        <Modal
          isOpen={isBlockModalOpen}
          onClose={() => setIsBlockModalOpen(false)}
          title={selectedCustomer?.isBlocked ? 'Restore Customer Access?' : 'Suspend Customer Account?'}
          maxWidth="480px"
        >
          <p style={{ fontSize: '13.5px', color: '#475569', marginBottom: 16 }}>
            {selectedCustomer?.isBlocked
              ? `Restoring ${selectedCustomer?.fullName || selectedCustomer?.name} will allow them to book appointments and make transactions again.`
              : `Suspending ${selectedCustomer?.fullName || selectedCustomer?.name} will immediately invalidate their active session and prevent booking requests.`}
          </p>

          {!selectedCustomer?.isBlocked && (
            <div className="form-group">
              <label className="form-label">Reason for Suspension (Audit Log) *</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Fraudulent cancellations, violation of app policy..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="form-textarea"
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              onClick={() => setIsBlockModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading || (!selectedCustomer?.isBlocked && !blockReason.trim())}
              onClick={handleToggleBlock}
              className={`btn ${selectedCustomer?.isBlocked ? 'btn-primary' : 'btn-danger'}`}
            >
              {actionLoading ? 'Updating...' : selectedCustomer?.isBlocked ? 'Confirm Unblock' : 'Confirm Suspension'}
            </button>
          </div>
        </Modal>
      </div>
    </AdminShell>
  );
};
