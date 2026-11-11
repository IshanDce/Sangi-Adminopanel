import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Briefcase,
  CalendarDays,
  ShieldCheck,
  ArrowDownToLine,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Phone,
  Eye,
  RefreshCw,
  Landmark,
  FileCheck,
  Calendar,
  Navigation
} from 'lucide-react';
import { AdminShell } from '../components/layout/AdminShell';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { api } from '../services/api';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadStats = async (isRef = false) => {
    if (isRef) setIsRefreshing(true);
    try {
      const res = await api.getDashboardStats();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const stats = data?.stats || {};
  const recentBookings = data?.recentBookings || [];
  const pendingKycList = data?.pendingKycList || [];

  return (
    <AdminShell
      title="Platform Operations Overview"
      subtitle="Live metrics across SANGI customers, staff partners, bookings & financial settlements"
      pendingKycCount={stats.pendingKycCount}
      pendingWithdrawalsCount={stats.pendingWithdrawals}
      onRefresh={() => loadStats(true)}
      isRefreshing={isRefreshing}
    >
      <div className="admin-page-container">
        {/* 1. Metric Stat Cards Grid */}
        <div className="stats-grid">
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers ?? '...'}
            subtitle="Registered consumer users"
            icon={Users}
            color="blue"
            onClick={() => navigate('/customers')}
          />
          <StatCard
            title="Service Staff"
            value={stats.totalStaff ?? '...'}
            subtitle={`${stats.approvedStaffCount || 0} KYC verified & active`}
            icon={Briefcase}
            color="green"
            onClick={() => navigate('/staff')}
          />
          <StatCard
            title="Pending KYC Approvals"
            value={stats.pendingKycCount ?? 0}
            subtitle="Awaiting identity review"
            icon={ShieldCheck}
            color="amber"
            onClick={() => navigate('/kyc-approval')}
          />
          <StatCard
            title="Pending Withdrawals"
            value={stats.pendingWithdrawals ?? 0}
            subtitle="Payout requests queue"
            icon={ArrowDownToLine}
            color="red"
            onClick={() => navigate('/withdrawals')}
          />
        </div>

        {/* 2. Middle Row: KYC Verifications & Quick Operations */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
        }}>
          {/* Pending KYC Verifications */}
          <div className="table-card" style={{ padding: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: '8px', background: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileCheck size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Pending KYC Reviews</h3>
                  <p style={{ fontSize: '12px', color: '#64748B' }}>
                    Staff awaiting identity document verification
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/kyc-approval')}
                className="btn btn-secondary btn-sm"
              >
                <span>Review All</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Staff Partner</th>
                    <th>Phone</th>
                    <th>Applied</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingKycList.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#64748B', fontSize: '13px' }}>
                        No pending KYC submissions in queue.
                      </td>
                    </tr>
                  ) : (
                    pendingKycList.slice(0, 4).map((p: any) => (
                      <tr key={p._id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '13px' }}>
                            {p.userId?.fullName || 'Staff Partner'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>
                            Exp: {p.experience || '1 Year'}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                            {p.userId?.phone || 'N/A'}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: '#64748B' }}>
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Recent'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => navigate('/kyc-approval')}
                            className="btn btn-primary btn-sm"
                          >
                            Verify
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Operations Shortcuts */}
          <div className="table-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: '8px', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Quick Management</h3>
                  <p style={{ fontSize: '12px', color: '#64748B' }}>
                    Frequent administrative operations
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div
                onClick={() => navigate('/services')}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '6px', background: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Sparkles size={16} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Update Booking Fees</div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: 2 }}>Edit price per service</div>
              </div>

              <div
                onClick={() => navigate('/withdrawals')}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '6px', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <ArrowDownToLine size={16} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Approve Payouts</div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: 2 }}>IMPS & UPI queue</div>
              </div>

              <div
                onClick={() => navigate('/notifications')}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '6px', background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Clock size={16} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Push Notification</div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: 2 }}>Broadcast to app users</div>
              </div>

              <div
                onClick={() => navigate('/bank-accounts')}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '6px', background: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Landmark size={16} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Bank Directory</div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: 2 }}>Inspect account details</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. ─── RECENT BOOKINGS SECTION (World-Class Redesigned) ─── */}
        <div className="table-card" style={{ padding: '22px' }}>
          {/* Section Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: '#F0FDF4',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #BBF7D0',
              }}>
                <CalendarDays size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                  Recent Customer Service Bookings
                </h3>
                <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: 1 }}>
                  Live feed of customer service appointments & fulfillments
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/bookings')}
              className="btn btn-outline-green btn-sm"
              style={{ fontWeight: 700 }}
            >
              <span>View All Bookings</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Table Container */}
          <div className="table-responsive" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking # & Service</th>
                  <th>Customer</th>
                  <th>Assigned Staff</th>
                  <th>Scheduled Date & Time</th>
                  <th>Booking & Service Fee</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <CalendarDays size={36} color="#16A34A" />
                        <h4>No bookings in database</h4>
                        <p>When customers request services, they will appear here in real-time.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((b: any) => {
                    const customerName = b.customerId?.fullName || 'Customer';
                    const customerPhone = b.customerId?.phone || '';
                    const staffName = b.staffId?.fullName;
                    const staffPhone = b.staffId?.phone || '';

                    return (
                      <tr key={b._id}>
                        {/* Booking Number & Service */}
                        <td>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: '#F1F5F9',
                            color: '#1E293B',
                          }}>
                            {b.bookingNumber || b._id.slice(-6).toUpperCase()}
                          </span>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '13.5px', marginTop: 4 }}>
                            {b.service || 'Home Service'}
                          </div>
                        </td>

                        {/* Customer */}
                        <td>
                          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '13px' }}>
                            {customerName}
                          </div>
                          {customerPhone && (
                            <div style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <Phone size={11} color="#16A34A" /> {customerPhone}
                            </div>
                          )}
                        </td>

                        {/* Assigned Staff */}
                        <td>
                          {staffName ? (
                            <div>
                              <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }}></span>
                                {staffName}
                              </div>
                              {staffPhone && (
                                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: 2 }}>
                                  {staffPhone}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="badge badge-warning" style={{ fontSize: '11px' }}>
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Scheduled Slot & Date */}
                        <td>
                          <div style={{ fontSize: '12.5px', color: '#1E293B', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Calendar size={13} color="#16A34A" />
                            {b.date ? new Date(b.date).toLocaleDateString() : 'Scheduled'}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Clock size={12} color="#94A3B8" /> {b.timeSlot || 'Standard Slot'}
                          </div>
                        </td>

                        {/* Fee */}
                        <td>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#15803D' }}>
                            ₹{Number(b.bookingFee ?? 0).toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#64748B' }}>Platform Fee</div>
                          {(b.totalServiceAmount != null || b.serviceCharge != null || b.additionalCharge != null) && (
                            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                              Service Bill: ₹{Number(b.totalServiceAmount ?? ((b.serviceCharge || 0) + (b.additionalCharge || 0))).toLocaleString('en-IN')}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td>
                          <StatusBadge status={b.status} />
                        </td>

                        {/* Action */}
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => navigate('/bookings')}
                            className="btn btn-secondary btn-sm"
                            title="Inspect in Bookings Manager"
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>
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
