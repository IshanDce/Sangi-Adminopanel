import React, { useEffect, useState } from 'react';
import { 
  Calendar, Clock, MapPin, Search, Eye, ExternalLink, Phone, 
  DollarSign, CheckCircle2, AlertCircle, RefreshCw, Navigation, ShieldCheck, Tag, CalendarDays,
  Sliders, Trash2
} from 'lucide-react';
import { AdminShell } from '../components/layout/AdminShell';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { api } from '../services/api';

export const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'all' | 'ongoing' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Selected Booking for Full Breakdown & GPS Modal
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Bill Adjustment Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustTargetBooking, setAdjustTargetBooking] = useState<any | null>(null);
  const [adjServiceCharge, setAdjServiceCharge] = useState<number>(0);
  const [adjAdditionalCharge, setAdjAdditionalCharge] = useState<number>(0);
  const [adjStatus, setAdjStatus] = useState<string>('paymentPending');
  const [adjReason, setAdjReason] = useState<string>('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  const handleOpenAdjustModal = (b: any) => {
    setAdjustTargetBooking(b);
    setAdjServiceCharge(Number(b.serviceCharge ?? 0));
    setAdjAdditionalCharge(Number(b.additionalCharge ?? 0));
    setAdjStatus(b.status || 'paymentPending');
    setAdjReason('');
    setIsAdjustModalOpen(true);
  };

  const handleQuickRemoveBill = () => {
    setAdjServiceCharge(0);
    setAdjAdditionalCharge(0);
    setAdjStatus('cancelled');
    const oldTotal = Number(
      adjustTargetBooking?.totalServiceAmount ??
      (Number(adjustTargetBooking?.serviceCharge ?? 0) + Number(adjustTargetBooking?.additionalCharge ?? 0))
    );
    setAdjReason(`Staff did not visit customer location; invalid service bill of ₹${oldTotal} removed by Admin.`);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetBooking) return;
    if (!adjReason.trim()) {
      alert('Please provide a reason for adjusting or removing this bill. This reason will be sent to both customer and staff via notification.');
      return;
    }

    setAdjustLoading(true);
    try {
      const res = await api.adjustBookingBill(adjustTargetBooking._id, {
        serviceCharge: adjServiceCharge,
        additionalCharge: adjAdditionalCharge,
        status: adjStatus,
        reason: adjReason.trim(),
      });

      if (res.success) {
        alert(`Bill updated successfully! Revised Total Service Fee: ₹${(Number(adjServiceCharge) + Number(adjAdditionalCharge))}. Push notifications dispatched to customer and staff.`);
        setIsAdjustModalOpen(false);

        // Update selectedBooking if dossier is open
        if (selectedBooking && selectedBooking._id === adjustTargetBooking._id) {
          setSelectedBooking({
            ...selectedBooking,
            serviceCharge: adjServiceCharge,
            additionalCharge: adjAdditionalCharge,
            totalServiceAmount: Number(adjServiceCharge) + Number(adjAdditionalCharge),
            status: adjStatus,
          });
        }

        fetchBookings();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to adjust booking bill');
    } finally {
      setAdjustLoading(false);
    }
  };

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      let statusParam: string | undefined = undefined;
      if (activeTab === 'ongoing') statusParam = 'ongoing';
      else if (activeTab === 'upcoming') statusParam = 'upcoming';
      else if (activeTab === 'completed') statusParam = 'completed';
      else if (activeTab === 'cancelled') statusParam = 'cancelled';

      const res = await api.getBookings({
        status: statusParam,
        search: search.trim() || undefined,
        page,
        limit: 15,
      });

      if (res.success) {
        setBookings(res.bookings);
        setTotal(res.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBookings();
  };

  const handleOpenDetail = (b: any) => {
    setSelectedBooking(b);
    setIsDetailOpen(true);
  };

  // Extract real coordinates from either { lat, lng } object, [lat, lng] array, or customer last-known GPS
  const extractLatLng = (b: any): { lat: number; lng: number } | null => {
    if (b?.coordinates && typeof b.coordinates === 'object') {
      if (Array.isArray(b.coordinates) && b.coordinates.length === 2) {
        return { lat: Number(b.coordinates[0]), lng: Number(b.coordinates[1]) };
      }
      if (b.coordinates.lat != null && b.coordinates.lng != null) {
        return { lat: Number(b.coordinates.lat), lng: Number(b.coordinates.lng) };
      }
    }
    if (b?.customerId?.lastKnownLat != null && b?.customerId?.lastKnownLng != null) {
      return { lat: Number(b.customerId.lastKnownLat), lng: Number(b.customerId.lastKnownLng) };
    }
    return null;
  };

  // Helper for Maps link
  const getGoogleMapsUrl = (b: any) => {
    const coords = extractLatLng(b);
    if (coords) {
      return `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
    }
    const loc = b.location || 'Raipur, India';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
  };

  const getCoordinatesDisplay = (b: any) => {
    const coords = extractLatLng(b);
    if (coords) {
      return `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
    }
    return null;
  };

  // Extract genuine billing amounts submitted by staff upon service completion (zero hardcoded dummies)
  const getPricingBreakdown = (b: any) => {
    const bookingFee = Number(b?.bookingFee ?? 0);
    const hasServiceCharge = b?.serviceCharge !== undefined && b?.serviceCharge !== null;
    const hasAdditionalCharge = b?.additionalCharge !== undefined && b?.additionalCharge !== null;
    const hasTotalServiceAmount = b?.totalServiceAmount !== undefined && b?.totalServiceAmount !== null;

    const hasStaffBill = hasServiceCharge || hasAdditionalCharge || hasTotalServiceAmount;

    const serviceCharge = Number(b?.serviceCharge ?? 0);
    const additionalCharge = Number(b?.additionalCharge ?? 0);
    const staffBillTotal = hasTotalServiceAmount
      ? Number(b.totalServiceAmount)
      : (hasStaffBill ? serviceCharge + additionalCharge : 0);
    const netTotal = bookingFee + staffBillTotal;

    return {
      bookingFee,
      hasStaffBill,
      serviceCharge,
      additionalCharge,
      staffBillTotal,
      netTotal,
    };
  };

  const selectedBreakdown = selectedBooking ? getPricingBreakdown(selectedBooking) : null;

  return (
    <AdminShell
      title="Customer Bookings & Operations"
      subtitle="Live monitoring of service requests, GPS coordinates, and staff charges (Rules #5 & #7)"
      onRefresh={fetchBookings}
      isRefreshing={isLoading}
    >
      <div className="admin-page-container">
        {/* 1. Stat Cards Row */}
        <div className="stats-grid">
          <div className="stat-card">
            <div>
              <div className="stat-label">Total Bookings</div>
              <div className="stat-value">{total}</div>
              <div className="stat-subtitle">All service requests</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#F0FDF4', color: '#16A34A' }}>
              <CalendarDays size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Ongoing / Active</div>
              <div className="stat-value">
                {bookings.filter(b => ['accepted', 'ongoing', 'in_progress'].includes(b.status)).length}
              </div>
              <div className="stat-subtitle">Currently live in field</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#E0F2FE', color: '#0284C7' }}>
              <Navigation size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Upcoming Scheduled</div>
              <div className="stat-value">
                {bookings.filter(b => ['pending', 'requested', 'pendingPayment', 'paymentSuccess'].includes(b.status)).length}
              </div>
              <div className="stat-subtitle">Booked appointments</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#FEF3C7', color: '#B45309' }}>
              <Clock size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Completed Jobs</div>
              <div className="stat-value">
                {bookings.filter(b => ['completed', 'serviceCompleted', 'paymentCompleted'].includes(b.status)).length}
              </div>
              <div className="stat-subtitle">Successfully fulfilled</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#DCFCE7', color: '#15803D' }}>
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>

        {/* 2. Action & Filter Toolbar */}
        <div className="action-toolbar">
          <div className="tab-pills">
            {(['all', 'ongoing', 'upcoming', 'completed', 'cancelled'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setPage(1); }}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                style={{ textTransform: 'capitalize' }}
              >
                {tab === 'ongoing' ? 'Ongoing (Live)' : tab}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <form onSubmit={handleSearchSubmit} className="search-input-wrapper">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search booking #, phone, service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            <button onClick={fetchBookings} className="btn btn-secondary btn-sm" title="Refresh">
              <RefreshCw size={14} className={isLoading ? 'spin-anim' : ''} />
            </button>
          </div>
        </div>

        {/* 3. Bookings Table */}
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking # & Service</th>
                  <th>Customer Details</th>
                  <th>Assigned Staff</th>
                  <th>Schedule</th>
                  <th>Live Location / GPS (Rule #5)</th>
                  <th>Booking & Service Fee</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      Loading bookings...
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <CalendarDays size={36} />
                        <h4>No bookings found</h4>
                        <p>No customer service bookings matched the selected status.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => {
                    const coords = getCoordinatesDisplay(b);
                    const pricing = getPricingBreakdown(b);
                    const customerName = b.customerId?.fullName || b.customer?.name || 'Customer';
                    const customerPhone = b.customerId?.phone || b.customer?.phone || b.contactPhone || 'N/A';
                    const staffName = b.staffId?.fullName || b.staff?.name;
                    const staffPhone = b.staffId?.phone || b.staff?.phone;

                    return (
                      <tr key={b._id}>
                        {/* Booking Number & Service */}
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
                            {b.bookingNumber || b._id.slice(-6).toUpperCase()}
                          </span>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '13.5px', marginTop: 4 }}>
                            {b.service || 'Home Service'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                            {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Today'}
                          </div>
                        </td>

                        {/* Customer */}
                        <td>
                          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '13px' }}>
                            {customerName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Phone size={11} color="#16A34A" /> {customerPhone}
                          </div>
                        </td>

                        {/* Staff */}
                        <td>
                          {staffName ? (
                            <div>
                              <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }}></span>
                                {staffName}
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: 2 }}>
                                {staffPhone}
                              </div>
                            </div>
                          ) : (
                            <span className="badge badge-warning" style={{ fontSize: '11px' }}>
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Schedule */}
                        <td>
                          <div style={{ fontSize: '12.5px', color: '#1E293B', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Calendar size={13} color="#16A34A" />
                            {b.date ? new Date(b.date).toLocaleDateString() : 'Scheduled'}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Clock size={12} color="#94A3B8" /> {b.timeSlot || 'Standard Slot'}
                          </div>
                        </td>

                        {/* Live Location / GPS (Rule #5) */}
                        <td>
                          <div style={{ maxWidth: 220, fontSize: '12px', color: '#334155' }}>
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={b.location}>
                              <MapPin size={12} color="#16A34A" style={{ display: 'inline', marginRight: 4 }} />
                              {b.location || 'Local Area'}
                            </div>
                            {coords && (
                              <div style={{ fontFamily: 'monospace', fontSize: '10.5px', color: '#166534', marginTop: 2 }}>
                                GPS: {coords}
                              </div>
                            )}
                            <a
                              href={getGoogleMapsUrl(b)}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontSize: '11px',
                                color: '#16A34A',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                marginTop: 2,
                                textDecoration: 'none',
                              }}
                            >
                              <ExternalLink size={11} /> Open Map
                            </a>
                          </div>
                        </td>

                        {/* Booking Fee & Staff Service Bill */}
                        <td>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#15803D' }}>
                            ₹{pricing.bookingFee.toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#64748B' }}>Platform Fee</div>
                          {pricing.hasStaffBill && (
                            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0F172A', marginTop: 3 }}>
                              Service Bill: ₹{pricing.staffBillTotal.toLocaleString('en-IN')}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td>
                          <StatusBadge status={b.status} />
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              onClick={() => handleOpenAdjustModal(b)}
                              className="btn btn-secondary btn-sm"
                              title="Edit or Remove Service Charges"
                              style={{ color: '#0F172A' }}
                            >
                              <Sliders size={13} color="#2563EB" />
                              <span>Adjust Bill</span>
                            </button>
                            <button
                              onClick={() => handleOpenDetail(b)}
                              className="btn btn-secondary btn-sm"
                              title="Inspect Service Job Breakdown"
                            >
                              <Eye size={13} />
                              <span>Breakdown</span>
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
              <span>Showing {((page - 1) * 15) + 1} - {Math.min(page * 15, total)} of {total} bookings</span>
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

        {/* ── Job Cost & Charge Breakdown Dossier Modal (Rule #7) ── */}
        <Modal
          isOpen={isDetailOpen}
          onClose={() => { setIsDetailOpen(false); setSelectedBooking(null); }}
          title={`Booking Dossier: ${selectedBooking?.bookingNumber || ''}`}
          subtitle={`Created on ${selectedBooking?.createdAt ? new Date(selectedBooking.createdAt).toLocaleString() : 'N/A'}`}
          maxWidth="640px"
        >
          {selectedBooking && selectedBreakdown && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Service & Status Strip */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: '#F8FAFC',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Service Requested</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                    {selectedBooking.service || 'Home Service'}
                  </div>
                </div>
                <StatusBadge status={selectedBooking.status} />
              </div>

              {/* Requirement #7: Detailed Staff Service Charge Breakdown */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DollarSign size={16} color="#16A34A" />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                      Service Job Charges & Staff Earnings (Rule #7)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAdjustModal(selectedBooking)}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Sliders size={13} />
                    <span>Edit / Adjust Bill</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F8FAFC' }}>
                    <span style={{ color: '#475569' }}>Platform Booking Fee:</span>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>
                      ₹{selectedBreakdown.bookingFee.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 10px',
                    background: selectedBreakdown.hasStaffBill ? '#F0FDF4' : '#F8FAFC',
                    borderRadius: '8px',
                  }}>
                    <span style={{ color: selectedBreakdown.hasStaffBill ? '#166534' : '#475569', fontWeight: 700 }}>
                      Staff Service Labor Charge:
                    </span>
                    {selectedBreakdown.hasStaffBill ? (
                      <span style={{ fontWeight: 800, color: '#15803D' }}>
                        ₹{selectedBreakdown.serviceCharge.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span style={{ fontWeight: 600, color: '#64748B', fontStyle: 'italic' }}>
                        Not billed yet
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F8FAFC' }}>
                    <span style={{ color: '#475569' }}>Spare Parts / Additional Charges:</span>
                    <span style={{ fontWeight: 600, color: selectedBreakdown.hasStaffBill ? '#0F172A' : '#94A3B8' }}>
                      {selectedBreakdown.hasStaffBill
                        ? `₹${selectedBreakdown.additionalCharge.toLocaleString('en-IN')}`
                        : '—'}
                    </span>
                  </div>

                  {selectedBreakdown.hasStaffBill && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      background: '#ECFDF5',
                      border: '1px solid #BBF7D0',
                      borderRadius: '8px',
                    }}>
                      <div>
                        <div style={{ color: '#166534', fontWeight: 700 }}>Total Service Bill (Assigned by Staff)</div>
                        <div style={{ fontSize: '11px', color: '#475569' }}>
                          {selectedBooking.serviceFeePayment?.method
                            ? `Paid via ${selectedBooking.serviceFeePayment.method.toUpperCase()}`
                            : selectedBooking.status === 'paymentPending'
                              ? 'Awaiting customer payment'
                              : 'Submitted after service completion'}
                        </div>
                      </div>
                      <span style={{ fontWeight: 800, color: '#15803D', fontSize: '14px' }}>
                        ₹{selectedBreakdown.staffBillTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 0', borderTop: '2px solid #E2E8F0', fontSize: '15px', fontWeight: 800 }}>
                    <span>Net Total Billed:</span>
                    <span style={{ color: '#15803D' }}>
                      ₹{selectedBreakdown.netTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Requirement #5: GPS & Location Dossier */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={16} color="#16A34A" />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                      Customer Live Location (Rule #5)
                    </span>
                  </div>
                  <a
                    href={getGoogleMapsUrl(selectedBooking)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    <ExternalLink size={13} /> Open Live Map
                  </a>
                </div>

                <div style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px' }}>
                  <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Destination Address</div>
                  <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 2 }}>{selectedBooking.location || 'Local Area'}</div>
                  {getCoordinatesDisplay(selectedBooking) && (
                    <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#166534', marginTop: 4 }}>
                      Coordinates: {getCoordinatesDisplay(selectedBooking)}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => handleOpenAdjustModal(selectedBooking)}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Sliders size={14} />
                  <span>Edit or Remove Bill Amount</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="btn btn-secondary"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* ── Admin Bill Adjustment & Fee Removal Modal ── */}
        <Modal
          isOpen={isAdjustModalOpen}
          onClose={() => { setIsAdjustModalOpen(false); setAdjustTargetBooking(null); }}
          title={`Adjust / Remove Booking Bill — #${adjustTargetBooking?.bookingNumber || 'BK'}`}
          maxWidth="560px"
        >
          {adjustTargetBooking && (
            <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Context Summary */}
              <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12.5px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '11px' }}>Customer</div>
                    <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 1 }}>
                      {adjustTargetBooking.customerId?.fullName || 'Customer'}
                    </div>
                    <div style={{ color: '#16A34A', fontSize: '11.5px', marginTop: 1 }}>
                      {adjustTargetBooking.customerId?.phone}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '11px' }}>Staff Assigned</div>
                    <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 1 }}>
                      {adjustTargetBooking.staffId?.fullName || 'Staff'}
                    </div>
                    <div style={{ color: '#16A34A', fontSize: '11.5px', marginTop: 1 }}>
                      {adjustTargetBooking.staffId?.phone}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notice Banner */}
              <div style={{
                padding: '12px 14px',
                background: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#92400E',
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
              }}>
                <AlertCircle size={16} color="#B45309" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>Live Synchronization:</strong> Any changes made here immediately update in both <strong>Customer App</strong> and <strong>Staff App</strong>. Both parties will receive an automated Push Notification & in-app alert stating the revised fee and admin reason.
                </div>
              </div>

              {/* Quick Remove Action */}
              <div style={{
                padding: '10px 12px',
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#991B1B' }}>
                    Quick Action: Staff Didn't Visit / Bogus Bill
                  </div>
                  <div style={{ fontSize: '11px', color: '#B91C1C' }}>
                    Zero out all charges and void the booking bill
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleQuickRemoveBill}
                  className="btn btn-sm"
                  style={{
                    background: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} /> Set to ₹0 & Cancel
                </button>
              </div>

              {/* Input Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Staff Service Labor Charge (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="form-input"
                    value={adjServiceCharge}
                    onChange={(e) => setAdjServiceCharge(Math.max(0, Number(e.target.value)))}
                    required
                  />
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Primary labor charge entered by staff</span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Parts / Additional Charge (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="form-input"
                    value={adjAdditionalCharge}
                    onChange={(e) => setAdjAdditionalCharge(Math.max(0, Number(e.target.value)))}
                  />
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Spare parts or material cost</span>
                </div>
              </div>

              {/* Total Calculation Display */}
              <div style={{
                padding: '12px 14px',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontWeight: 700, color: '#166534', fontSize: '13.5px' }}>
                  Revised Payable Service Bill:
                </span>
                <span style={{ fontWeight: 800, color: '#15803D', fontSize: '18px' }}>
                  ₹{(Number(adjServiceCharge) + Number(adjAdditionalCharge)).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Status Dropdown */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Booking Status
                </label>
                <select
                  className="form-input"
                  value={adjStatus}
                  onChange={(e) => setAdjStatus(e.target.value)}
                >
                  <option value="paymentPending">Payment Pending (Waiting for customer to pay revised amount)</option>
                  <option value="ongoing">Ongoing (Revert to active service in-progress)</option>
                  <option value="completed">Completed (Bill settled / zero balance)</option>
                  <option value="cancelled">Cancelled (Booking voided / service disputed)</option>
                </select>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Controls which action buttons appear on the Customer & Staff mobile apps
                </span>
              </div>

              {/* Reason (Required) */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Reason for Adjustment / Removal <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="e.g. Staff did not reach customer address; ₹500 fee removed after customer dispute confirmation."
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  required
                />
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  This reason will be included in the push notifications sent to Customer and Staff.
                </span>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={adjustLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={adjustLoading || !adjReason.trim()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <CheckCircle2 size={15} />
                  <span>{adjustLoading ? 'Updating & Notifying...' : 'Save & Send Notifications'}</span>
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </AdminShell>
  );
};
