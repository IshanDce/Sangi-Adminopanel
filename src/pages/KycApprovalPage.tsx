import React, { useEffect, useState } from 'react';
import { 
  FileCheck, CheckCircle2, XCircle, Search, Eye, AlertCircle, 
  ExternalLink, Phone, Mail, Award, Clock, RefreshCw, ZoomIn, ShieldCheck, UserX, Users
} from 'lucide-react';
import { AdminShell } from '../components/layout/AdminShell';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { api } from '../services/api';

export const KycApprovalPage: React.FC = () => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Approval / Rejection modal
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Image Lightbox
  const [lightboxImg, setLightboxImg] = useState<{ url: string; title: string } | null>(null);

  const fetchKycStaff = async () => {
    setIsLoading(true);
    try {
      const res = await api.getStaff({
        kycStatus: filterStatus,
        search: search.trim() || undefined,
        limit: 25,
      });
      if (res.success) {
        setStaffList(res.staff);
        setTotal(res.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch KYC queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStaff();
  }, [filterStatus]);

  const handleApprove = async (staff: any) => {
    const name = staff.fullName || staff.name || 'Staff Partner';
    if (!window.confirm(`Approve KYC verification for ${name}? This will verify their profile and enable them to receive customer service bookings.`)) {
      return;
    }
    setActionLoading(true);
    try {
      await api.updateStaffKyc(staff._id, 'approve');
      alert(`KYC Approved successfully for ${name}!`);
      fetchKycStaff();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedStaff || !rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      await api.updateStaffKyc(selectedStaff._id, 'reject', rejectionReason.trim());
      alert(`KYC rejected. Notification sent to ${selectedStaff.fullName || selectedStaff.name}.`);
      setIsRejectModalOpen(false);
      setRejectionReason('');
      fetchKycStaff();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminShell
      title="Staff KYC Verification Desk"
      subtitle="Review government identity documents (Aadhaar & PAN) and authorize service partners (Rule #2)"
      onRefresh={fetchKycStaff}
      isRefreshing={isLoading}
    >
      <div className="admin-page-container">
        {/* 1. Filter & Search Toolbar */}
        <div className="action-toolbar">
          <div className="tab-pills">
            <button
              onClick={() => setFilterStatus('pending')}
              className={`tab-btn ${filterStatus === 'pending' ? 'active' : ''}`}
            >
              Pending Approval ({filterStatus === 'pending' ? total : '•'})
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`tab-btn ${filterStatus === 'approved' ? 'active' : ''}`}
            >
              Verified / Approved
            </button>
            <button
              onClick={() => setFilterStatus('rejected')}
              className={`tab-btn ${filterStatus === 'rejected' ? 'active' : ''}`}
            >
              Rejected
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search staff by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchKycStaff()}
              />
            </div>
            <button onClick={fetchKycStaff} className="btn btn-secondary btn-sm" title="Refresh">
              <RefreshCw size={14} className={isLoading ? 'spin-anim' : ''} />
            </button>
          </div>
        </div>

        {/* 2. KYC Cards Grid */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
            Loading KYC documents queue...
          </div>
        ) : staffList.length === 0 ? (
          <div className="table-card">
            <div className="empty-state">
              <FileCheck size={44} color="#16A34A" />
              <h4>No {filterStatus} KYC submissions</h4>
              <p>All staff verification requests in this category have been processed.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
            {staffList.map((st) => {
              const displayName = st.fullName || st.name || 'Staff Partner';
              const kyc = st.profile?.kyc || {};
              const aadhaarFront = kyc.aadhaarFrontUrl || kyc.documents?.find((d: any) => d.type === 'aadhaar_front')?.url;
              const aadhaarBack = kyc.aadhaarBackUrl || kyc.documents?.find((d: any) => d.type === 'aadhaar_back')?.url;
              const panDoc = kyc.panCardUrl || kyc.documents?.find((d: any) => d.type === 'pan')?.url;
              const services: string[] = st.profile?.services || st.profile?.categories || [];

              return (
                <div
                  key={st._id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  {/* Card Header */}
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 46,
                          height: 46,
                          borderRadius: '50%',
                          backgroundColor: '#DCFCE7',
                          border: '1px solid #BBF7D0',
                          color: '#166534',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '18px',
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
                          <div style={{ fontWeight: 800, fontSize: '15px', color: '#0F172A' }}>
                            {displayName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <Phone size={12} color="#16A34A" /> {st.phone}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={st.profile?.kycStatus || 'pending'} />
                    </div>

                    {/* Services Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 12 }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: '#F1F5F9', color: '#334155' }}>
                        Exp: {st.profile?.experience || '1 Year'}
                      </span>
                      {services.map((srv: string) => (
                        <span key={srv} style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: '#DCFCE7', color: '#166534', textTransform: 'capitalize' }}>
                          {srv.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Documents Container */}
                  <div style={{ padding: '18px 20px', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Aadhaar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                        <span>Aadhaar Identity Proof</span>
                        <span style={{ fontFamily: 'monospace', color: '#64748B' }}>
                          {kyc.aadhaarNumber || 'Attached'}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {aadhaarFront ? (
                          <div
                            onClick={() => setLightboxImg({ url: aadhaarFront, title: `${displayName} — Aadhaar Front` })}
                            style={{
                              height: 110,
                              background: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              position: 'relative',
                            }}
                          >
                            <img src={aadhaarFront} alt="Aadhaar Front" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(0,0,0,0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FFFFFF',
                              fontSize: '11px',
                              fontWeight: 600,
                              gap: 4,
                            }}>
                              <ZoomIn size={14} /> Front
                            </div>
                          </div>
                        ) : (
                          <div style={{ height: 110, background: '#F1F5F9', border: '1px dashed #CBD5E1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#94A3B8' }}>
                            No front image
                          </div>
                        )}

                        {aadhaarBack ? (
                          <div
                            onClick={() => setLightboxImg({ url: aadhaarBack, title: `${displayName} — Aadhaar Back` })}
                            style={{
                              height: 110,
                              background: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              position: 'relative',
                            }}
                          >
                            <img src={aadhaarBack} alt="Aadhaar Back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(0,0,0,0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FFFFFF',
                              fontSize: '11px',
                              fontWeight: 600,
                              gap: 4,
                            }}>
                              <ZoomIn size={14} /> Back
                            </div>
                          </div>
                        ) : (
                          <div style={{ height: 110, background: '#F1F5F9', border: '1px dashed #CBD5E1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#94A3B8' }}>
                            No back image
                          </div>
                        )}
                      </div>
                    </div>

                    {/* PAN Card */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                        <span>PAN Card</span>
                        <span style={{ fontFamily: 'monospace', color: '#64748B' }}>
                          {kyc.panNumber || 'Attached'}
                        </span>
                      </div>
                      {panDoc ? (
                        <div
                          onClick={() => setLightboxImg({ url: panDoc, title: `${displayName} — PAN Card` })}
                          style={{
                            height: 90,
                            background: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            position: 'relative',
                          }}
                        >
                          <img src={panDoc} alt="PAN Card" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: 600,
                            gap: 4,
                          }}>
                            <ZoomIn size={14} /> Expand PAN
                          </div>
                        </div>
                      ) : (
                        <div style={{ height: 60, background: '#F1F5F9', border: '1px dashed #CBD5E1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#94A3B8' }}>
                          No PAN document uploaded
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                      Registered: {st.createdAt ? new Date(st.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStaff(st);
                          setIsRejectModalOpen(true);
                        }}
                        className="btn btn-danger-outline btn-sm"
                      >
                        <XCircle size={14} />
                        <span>Reject</span>
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleApprove(st)}
                        className="btn btn-primary btn-sm"
                      >
                        <CheckCircle2 size={14} />
                        <span>Approve KYC</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Reject KYC Modal ── */}
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          title="Reject KYC Submission"
          maxWidth="480px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '12px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: '12.5px' }}>
              The staff member will receive a push notification explaining the rejection so they can re-upload proper documents.
            </div>

            <div className="form-group">
              <label className="form-label">Reason for Rejection *</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Aadhaar photo is blurry, name does not match profile..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="form-textarea"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
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
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </Modal>

        {/* ── Image Lightbox Modal ── */}
        <Modal
          isOpen={!!lightboxImg}
          onClose={() => setLightboxImg(null)}
          title={lightboxImg?.title || 'Document Inspection'}
          maxWidth="840px"
        >
          {lightboxImg && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ background: '#0F172A', borderRadius: '10px', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: '70vh', overflow: 'hidden' }}>
                <img
                  src={lightboxImg.url}
                  alt={lightboxImg.title}
                  style={{ maxHeight: '68vh', maxWidth: '100%', objectFit: 'contain' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <a
                  href={lightboxImg.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '12.5px', color: '#16A34A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}
                >
                  <ExternalLink size={14} /> Open original image in new tab
                </a>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminShell>
  );
};
