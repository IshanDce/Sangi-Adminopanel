import React, { useEffect, useState } from 'react';
import { 
  Search, Ban, CheckCircle, ShieldAlert, Phone, Mail, Wallet, 
  MapPin, Eye, Star, Calendar, Clock, Briefcase, FileCheck, AlertCircle, RefreshCw, Users, ShieldCheck, UserX
} from 'lucide-react';
import { AdminShell } from '../components/layout/AdminShell';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { api } from '../services/api';

export const StaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterKyc, setFilterKyc] = useState('all');
  const [filterBlocked, setFilterBlocked] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Selected staff for detail drawer & block modal
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [staffDetails, setStaffDetails] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Stats counters
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    blocked: 0,
  });

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await api.getStaff({
        search: search.trim() || undefined,
        kycStatus: filterKyc !== 'all' ? filterKyc : undefined,
        isBlocked: filterBlocked !== 'all' ? filterBlocked : undefined,
        page,
        limit: 15,
      });
      if (res.success) {
        setStaffList(res.staff);
        setTotal(res.pagination.total);

        // Derive quick summary stats
        const verifiedCount = res.staff.filter((s: any) => s.profile?.kycStatus === 'approved').length;
        const pendingCount = res.staff.filter((s: any) => s.profile?.kycStatus === 'pending').length;
        const blockedCount = res.staff.filter((s: any) => s.isBlocked).length;
        setStats({
          total: res.pagination.total,
          verified: verifiedCount,
          pending: pendingCount,
          blocked: blockedCount,
        });
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [page, filterKyc, filterBlocked]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStaff();
  };

  const handleOpenDetails = async (staff: any) => {
    setSelectedStaff(staff);
    setIsDetailOpen(true);
    try {
      const res = await api.getStaffById(staff._id);
      if (res.success) {
        setStaffDetails(res);
      }
    } catch (err) {
      console.error('Failed to get staff details:', err);
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedStaff) return;
    setActionLoading(true);
    try {
      const newBlockedState = !selectedStaff.isBlocked;
      await api.toggleBlockUser(selectedStaff._id, newBlockedState, blockReason);
      setIsBlockModalOpen(false);
      setBlockReason('');
      fetchStaff();
      if (isDetailOpen) {
        setSelectedStaff({ ...selectedStaff, isBlocked: newBlockedState });
      }
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveKyc = async (staff: any) => {
    const name = staff.fullName || staff.name || 'Staff Partner';
    if (!window.confirm(`Approve KYC verification for ${name}? This will verify their identity documents and enable them to receive real-time customer bookings.`)) {
      return;
    }
    setActionLoading(true);
    try {
      await api.updateStaffKyc(staff._id, 'approve');
      alert(`KYC Approved successfully for ${name}! Profile is now live and eligible for customer orders.`);
      fetchStaff();
      if (isDetailOpen && selectedStaff?._id === staff._id) {
        setSelectedStaff({
          ...selectedStaff,
          profile: {
            ...selectedStaff.profile,
            kycStatus: 'approved',
            isKycVerified: true,
          },
        });
      }
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <AdminShell
      title="Staff & Service Partners"
      subtitle="Inspect verified partners, availability hours, and handle suspensions (Rules #1, #3, #6)"
      onRefresh={fetchStaff}
      isRefreshing={isLoading}
    >
      <div className="admin-page-container">
        {/* 1. Stat Cards Row */}
        <div className="stats-grid">
          <div className="stat-card">
            <div>
              <div className="stat-label">Total Staff Partners</div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-subtitle">Registered providers</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#F0FDF4', color: '#16A34A' }}>
              <Users size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Verified (KYC Approved)</div>
              <div className="stat-value">{stats.verified}</div>
              <div className="stat-subtitle">Active service takers</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#DCFCE7', color: '#15803D' }}>
              <ShieldCheck size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Pending Verifications</div>
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-subtitle">Awaiting KYC review</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#FEF3C7', color: '#B45309' }}>
              <FileCheck size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Suspended / Blocked</div>
              <div className="stat-value">{stats.blocked}</div>
              <div className="stat-subtitle">Restricted accounts</div>
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
              onClick={() => { setFilterKyc('all'); setFilterBlocked('all'); setPage(1); }}
              className={`tab-btn ${filterKyc === 'all' && filterBlocked === 'all' ? 'active' : ''}`}
            >
              All Staff ({total})
            </button>
            <button
              onClick={() => { setFilterKyc('approved'); setFilterBlocked('false'); setPage(1); }}
              className={`tab-btn ${filterKyc === 'approved' ? 'active' : ''}`}
            >
              KYC Approved
            </button>
            <button
              onClick={() => { setFilterKyc('pending'); setPage(1); }}
              className={`tab-btn ${filterKyc === 'pending' ? 'active' : ''}`}
            >
              KYC Pending
            </button>
            <button
              onClick={() => { setFilterBlocked('true'); setFilterKyc('all'); setPage(1); }}
              className={`tab-btn ${filterBlocked === 'true' ? 'active' : ''}`}
            >
              Blocked
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <form onSubmit={handleSearchSubmit} className="search-input-wrapper">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search staff by name, phone, service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            <button onClick={fetchStaff} className="btn btn-secondary btn-sm" title="Refresh">
              <RefreshCw size={14} className={isLoading ? 'spin-anim' : ''} />
            </button>
          </div>
        </div>

        {/* 3. Main Data Table */}
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff Partner</th>
                  <th>Contact Details</th>
                  <th>Services Offered</th>
                  <th>Rating & Earnings</th>
                  <th>KYC Status</th>
                  <th>Account Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      Loading service partners...
                    </td>
                  </tr>
                ) : staffList.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <Users size={36} />
                        <h4>No staff members found</h4>
                        <p>No service partners matched your filter criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  staffList.map((st) => {
                    const displayName = st.fullName || st.name || 'Staff Partner';
                    const services: string[] = st.profile?.services || st.profile?.categories || [];
                    const rating = st.profile?.rating ? Number(st.profile.rating).toFixed(1) : '5.0';
                    const reviewsCount = st.profile?.reviewCount || st.profile?.reviewsCount || 0;

                    return (
                      <tr key={st._id}>
                        {/* Name & Photo */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 42,
                              height: 42,
                              borderRadius: '50%',
                              backgroundColor: '#DCFCE7',
                              border: '1px solid #BBF7D0',
                              color: '#166534',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '15px',
                              overflow: 'hidden',
                              flexShrink: 0,
                            }}>
                              {st.profilePhotoUrl ? (
                                <img src={st.profilePhotoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                displayName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '14px' }}>
                                {displayName}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748B' }}>
                                Joined {st.createdAt ? new Date(st.createdAt).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '12.5px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#1E293B', fontWeight: 600 }}>
                              <Phone size={13} color="#16A34A" /> {st.phone}
                            </span>
                            {st.email && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748B', fontSize: '11.5px' }}>
                                <Mail size={12} color="#94A3B8" /> {st.email}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Services */}
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 220 }}>
                            {services.length > 0 ? (
                              services.slice(0, 2).map((srv: string) => (
                                <span
                                  key={srv}
                                  style={{
                                    fontSize: '11px',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: '#F1F5F9',
                                    color: '#334155',
                                    fontWeight: 600,
                                    textTransform: 'capitalize',
                                  }}
                                >
                                  {srv.replace('_', ' ')}
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>General</span>
                            )}
                            {services.length > 2 && (
                              <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '6px', background: '#E2E8F0', color: '#475569', fontWeight: 700 }}>
                                +{services.length - 2}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Rating & Balance */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', fontWeight: 700, color: '#B45309' }}>
                              <Star size={13} fill="#F59E0B" color="#F59E0B" />
                              <span>{rating}</span>
                              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>({reviewsCount})</span>
                            </div>
                            <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#15803D' }}>
                              ₹{(st.walletBalance || 0).toLocaleString('en-IN')}
                            </div>
                          </div>
                        </td>

                        {/* KYC */}
                        <td>
                          <StatusBadge status={st.profile?.kycStatus || 'pending'} />
                        </td>

                        {/* Account Status */}
                        <td>
                          <StatusBadge status={st.isBlocked ? 'blocked' : 'active'} />
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              onClick={() => handleOpenDetails(st)}
                              className="btn btn-secondary btn-sm"
                              title="View Full Dossier & Schedule"
                            >
                              <Eye size={13} />
                              <span>Inspect</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStaff(st);
                                setIsBlockModalOpen(true);
                              }}
                              className={`btn btn-sm ${st.isBlocked ? 'btn-outline-green' : 'btn-danger-outline'}`}
                              title={st.isBlocked ? 'Unblock Partner' : 'Suspend / Block Partner'}
                            >
                              {st.isBlocked ? <CheckCircle size={13} /> : <Ban size={13} />}
                              <span>{st.isBlocked ? 'Unblock' : 'Block'}</span>
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
              <span>Showing {((page - 1) * 15) + 1} - {Math.min(page * 15, total)} of {total} partners</span>
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

        {/* ── Staff Detail & Availability Schedule Drawer ── */}
        <Modal
          isOpen={isDetailOpen}
          onClose={() => { setIsDetailOpen(false); setStaffDetails(null); }}
          title={selectedStaff?.fullName || selectedStaff?.name || 'Staff Partner Dossier'}
          subtitle={`Member since ${selectedStaff?.createdAt ? new Date(selectedStaff.createdAt).toLocaleDateString() : 'N/A'}`}
          maxWidth="760px"
        >
          {selectedStaff && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Profile Card */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 20px',
                background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                borderRadius: '12px',
                border: '1px solid #BBF7D0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: '#16A34A',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '20px',
                    overflow: 'hidden',
                  }}>
                    {selectedStaff.profilePhotoUrl ? (
                      <img src={selectedStaff.profilePhotoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (selectedStaff.fullName || selectedStaff.name || 'S').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#064E3B' }}>
                      {selectedStaff.fullName || selectedStaff.name}
                    </h3>
                    <div style={{ fontSize: '12.5px', color: '#166534', marginTop: 2 }}>
                      {selectedStaff.phone} {selectedStaff.email && `• ${selectedStaff.email}`}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>Wallet Balance</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#065F46' }}>
                    ₹{(selectedStaff.walletBalance || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Requirement #6: Availability Schedule & Hours */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                  <Clock size={16} color="#16A34A" />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                    Weekly Operating Hours & Availability (Rule #6)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8 }}>
                  {dayOrder.map((day) => {
                    const avail = staffDetails?.profile?.availability || selectedStaff.profile?.availability || {};
                    const dayData = avail[day];
                    const isAvailable = dayData ? dayData.isAvailable : true;
                    const start = dayData?.start || '09:00';
                    const end = dayData?.end || '19:00';

                    return (
                      <div
                        key={day}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '8px',
                          textAlign: 'center',
                          border: isAvailable ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                          background: isAvailable ? '#F0FDF4' : '#F8FAFC',
                          color: isAvailable ? '#166534' : '#94A3B8',
                        }}
                      >
                        <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                          {day.slice(0, 3)}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 700, marginTop: 4 }}>
                          {isAvailable ? `${start}` : 'Off'}
                        </div>
                        {isAvailable && (
                          <div style={{ fontSize: '10.5px', color: '#15803D' }}>
                            to {end}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Services & Skills */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Briefcase size={16} color="#16A34A" />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                    Services & Specializations
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(staffDetails?.profile?.services || selectedStaff.profile?.services || []).length > 0 ? (
                    (staffDetails?.profile?.services || selectedStaff.profile?.services || []).map((srv: string) => (
                      <span
                        key={srv}
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          background: '#DCFCE7',
                          color: '#166534',
                          border: '1px solid #BBF7D0',
                          textTransform: 'capitalize',
                        }}
                      >
                        {srv.replace('_', ' ')}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontStyle: 'italic' }}>
                      All standard home care services enabled.
                    </span>
                  )}
                </div>
              </div>

              {/* KYC Verification Status & Action */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={18} color={selectedStaff.profile?.kycStatus === 'approved' ? '#16A34A' : '#F59E0B'} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                      KYC Compliance & Order Eligibility
                    </span>
                    <StatusBadge status={selectedStaff.profile?.kycStatus || 'pending'} />
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: 4 }}>
                    {selectedStaff.profile?.kycStatus === 'approved'
                      ? 'Identity documents verified. Partner is active and authorized to accept live customer bookings.'
                      : 'Pending KYC review. Approving will activate their live profile to receive customer orders.'}
                  </div>
                </div>
                {selectedStaff.profile?.kycStatus !== 'approved' && (
                  <button
                    onClick={() => handleApproveKyc(selectedStaff)}
                    disabled={actionLoading}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
                  >
                    <ShieldCheck size={14} />
                    <span>Approve KYC Now</span>
                  </button>
                )}
              </div>

              {/* Bank & Payout Details (Rule #9) */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Wallet size={16} color="#16A34A" />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                    Bank Account Details (Rule #9)
                  </span>
                </div>
                {selectedStaff.bankAccount?.accountNumber ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                    <div style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Account Holder</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, marginTop: 2 }}>{selectedStaff.bankAccount.accountHolderName || selectedStaff.fullName}</div>
                    </div>
                    <div style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Bank & Account #</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', marginTop: 2 }}>
                        {selectedStaff.bankAccount.bankName || 'Bank'} — {selectedStaff.bankAccount.accountNumber}
                      </div>
                    </div>
                    <div style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>IFSC / UPI</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', marginTop: 2 }}>
                        {selectedStaff.bankAccount.ifscCode || selectedStaff.bankAccount.upiId || 'N/A'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '12.5px', color: '#94A3B8', fontStyle: 'italic' }}>
                    No bank account details uploaded yet.
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
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
                  className={`btn ${selectedStaff.isBlocked ? 'btn-outline-green' : 'btn-danger'}`}
                >
                  {selectedStaff.isBlocked ? 'Restore / Unblock Staff' : 'Suspend / Block Staff'}
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* ── Block / Unblock Modal (Rule #3) ── */}
        <Modal
          isOpen={isBlockModalOpen}
          onClose={() => setIsBlockModalOpen(false)}
          title={selectedStaff?.isBlocked ? 'Unblock Staff Partner?' : 'Suspend / Block Staff Partner?'}
          maxWidth="480px"
        >
          <p style={{ fontSize: '13.5px', color: '#475569', marginBottom: 16 }}>
            {selectedStaff?.isBlocked
              ? `Unblocking will immediately restore ${selectedStaff?.fullName || selectedStaff?.name}'s access to accept service bookings from customers.`
              : `Suspending this staff member will take them offline immediately and prevent them from receiving new service requests.`}
          </p>

          {!selectedStaff?.isBlocked && (
            <div className="form-group">
              <label className="form-label">Reason for Suspension (Audit Log) *</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Customer complaint, missing documents, violation of conduct..."
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
              disabled={actionLoading || (!selectedStaff?.isBlocked && !blockReason.trim())}
              onClick={handleToggleBlock}
              className={`btn ${selectedStaff?.isBlocked ? 'btn-primary' : 'btn-danger'}`}
            >
              {actionLoading ? 'Updating...' : selectedStaff?.isBlocked ? 'Confirm Unblock' : 'Confirm Suspension'}
            </button>
          </div>
        </Modal>
      </div>
    </AdminShell>
  );
};
