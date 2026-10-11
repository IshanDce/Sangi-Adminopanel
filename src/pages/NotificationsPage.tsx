import React, { useEffect, useState } from 'react';
import { 
  Bell, Send, Users, User, CheckCircle2, Smartphone, Sparkles, RefreshCw, Radio
} from 'lucide-react';
import { AdminShell } from '../components/layout/AdminShell';
import { api } from '../services/api';

export const NotificationsPage: React.FC = () => {
  const [target, setTarget] = useState<'all_customers' | 'all_staff' | 'all' | 'single'>('all_customers');
  const [singleUserId, setSingleUserId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('promotion');
  const [isSending, setIsSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // Search single user candidates
  const [userQuery, setUserQuery] = useState('');
  const [candidates, setCandidates] = useState<any[]>([]);

  const fetchHistory = async () => {
    try {
      const res = await api.getNotificationHistory();
      if (res.success) {
        setHistory(res.history);
      }
    } catch (err) {
      console.error('Failed to get notification history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSearchUsers = async (q: string) => {
    setUserQuery(q);
    if (q.trim().length < 2) {
      setCandidates([]);
      return;
    }
    try {
      const res = await api.getCustomers({ search: q, limit: 5 });
      if (res.success) {
        setCandidates(res.customers);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('Please fill both Title and Message');
      return;
    }
    if (target === 'single' && !singleUserId.trim()) {
      alert('Please specify a target user ID or phone');
      return;
    }

    setIsSending(true);
    try {
      const res = await api.sendNotification({
        target,
        userId: target === 'single' ? singleUserId.trim() : undefined,
        title: title.trim(),
        message: message.trim(),
        type,
      });

      alert(`Notification dispatched successfully!\nTotal recipients: ${res.totalRecipients}\nFCM Push delivered: ${res.pushedCount}`);
      setTitle('');
      setMessage('');
      fetchHistory();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch notification');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AdminShell
      title="Push Notification Broadcast Center"
      subtitle="Dispatch bulk and targeted push notifications to customers and staff via Firebase FCM (Rule #4)"
      onRefresh={fetchHistory}
      isRefreshing={false}
    >
      <div className="admin-page-container">
        {/* 2-Column Grid: Form + Live Phone Preview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
          {/* Left: Form Composer */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <Bell size={18} color="#16A34A" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Compose Announcement</h3>
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Target Audience Selector */}
              <div>
                <label className="form-label">Target Audience (Rule #4) *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { id: 'all_customers', label: 'All Customers', icon: Users },
                    { id: 'all_staff', label: 'All Staff', icon: Users },
                    { id: 'all', label: 'Everyone (All Users)', icon: Radio },
                    { id: 'single', label: 'Single Specific User', icon: User },
                  ].map((item) => {
                    const isSelected = target === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTarget(item.id as any)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #16A34A' : '1px solid #E2E8F0',
                          background: isSelected ? '#F0FDF4' : '#F8FAFC',
                          color: isSelected ? '#166534' : '#475569',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <Icon size={14} color={isSelected ? '#16A34A' : '#94A3B8'} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Single User Search */}
              {target === 'single' && (
                <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <label className="form-label" style={{ fontSize: '11.5px' }}>Search Customer or Staff</label>
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={userQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    className="form-input"
                  />
                  {candidates.length > 0 && (
                    <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 120, overflowY: 'auto' }}>
                      {candidates.map((c) => (
                        <div
                          key={c._id}
                          onClick={() => {
                            setSingleUserId(c._id);
                            setUserQuery(`${c.fullName || c.name} (${c.phone})`);
                            setCandidates([]);
                          }}
                          style={{
                            padding: '6px 10px',
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <strong>{c.fullName || c.name}</strong>
                          <span style={{ color: '#64748B' }}>{c.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {singleUserId && (
                    <div style={{ fontSize: '11px', color: '#166534', fontFamily: 'monospace', marginTop: 4 }}>
                      Selected User ID: {singleUserId}
                    </div>
                  )}
                </div>
              )}

              {/* Notification Category */}
              <div className="form-group">
                <label className="form-label">Notification Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="form-select"
                >
                  <option value="promotion">Special Promotion / Discount Offer</option>
                  <option value="system_update">System Maintenance & Feature Update</option>
                  <option value="alert">Critical Operational Alert</option>
                  <option value="reminder">Service Booking Reminder</option>
                </select>
              </div>

              {/* Notification Title */}
              <div className="form-group">
                <label className="form-label">Notification Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat ₹150 OFF on Cleaning this weekend!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                  style={{ fontWeight: 700 }}
                />
              </div>

              {/* Message Content */}
              <div className="form-group">
                <label className="form-label">Message Content *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter the push message text here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <button
                type="submit"
                disabled={isSending || !title.trim() || !message.trim()}
                className="btn btn-primary"
                style={{ padding: '12px', width: '100%', marginTop: 6 }}
              >
                <Send size={15} />
                <span>{isSending ? 'Transmitting via FCM...' : 'Broadcast Push Notification Now'}</span>
              </button>
            </form>
          </div>

          {/* Right: Live Android Mobile Notification Shade Preview */}
          <div style={{
            background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                background: '#FFFFFF',
                borderRadius: '9999px',
                border: '1px solid #E2E8F0',
                fontSize: '12px',
                fontWeight: 700,
                color: '#334155',
              }}>
                <Smartphone size={14} color="#16A34A" />
                <span>Live Smartphone Shade Preview</span>
              </div>
              <p style={{ fontSize: '11.5px', color: '#64748B', marginTop: 4 }}>
                Instant preview of how notification appears on mobile screen
              </p>
            </div>

            {/* Mobile Device Frame */}
            <div style={{
              width: 320,
              background: '#0F172A',
              borderRadius: '36px',
              padding: '14px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.4)',
              border: '4px solid #1E293B',
            }}>
              {/* Speaker Notch */}
              <div style={{ width: 60, height: 4, background: '#334155', borderRadius: '4px', margin: '0 auto 14px' }}></div>

              {/* Screen Area */}
              <div style={{
                background: '#1E293B',
                borderRadius: '26px',
                padding: '14px',
                color: '#FFFFFF',
                minHeight: 280,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                {/* Status Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94A3B8' }}>
                  <span>10:45 AM</span>
                  <span>5G • 100%</span>
                </div>

                {/* Push Notification Card */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  border: '1px solid #334155',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                  marginTop: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 18,
                        height: 18,
                        borderRadius: '4px',
                        background: '#16A34A',
                        color: '#FFFFFF',
                        fontWeight: 900,
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        S
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em' }}>SANGI</span>
                      <span style={{ fontSize: '9px', color: '#94A3B8' }}>• now</span>
                    </div>
                    <span style={{ fontSize: '9px', color: '#4ADE80', fontWeight: 700, textTransform: 'uppercase' }}>
                      {type}
                    </span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#FFFFFF' }}>
                    {title || 'Flat ₹150 OFF on Cleaning!'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#CBD5E1', marginTop: 3, lineHeight: 1.4 }}>
                    {message || 'Book your home services today and enjoy guaranteed professional care from verified SANGI staff.'}
                  </div>
                </div>

                <div style={{ textAlign: 'center', fontSize: '10px', color: '#64748B', paddingTop: 30 }}>
                  Swipe to open
                </div>
              </div>

              {/* Bottom Home Indicator */}
              <div style={{ width: 80, height: 3, background: '#475569', borderRadius: '4px', margin: '14px auto 0' }}></div>
            </div>
          </div>
        </div>

        {/* 3. Dispatched History Table */}
        <div className="table-card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>Broadcast Dispatch Logs</h3>
            <span style={{ fontSize: '12px', color: '#64748B' }}>{history.length} logged</span>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Target Audience</th>
                  <th>Notification Title</th>
                  <th>Message Snippet</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748B', fontSize: '13px' }}>
                      No notifications have been broadcast in this session yet.
                    </td>
                  </tr>
                ) : (
                  history.map((h, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: '12px', color: '#64748B' }}>
                        {new Date(h.sentAt || h.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: '#F1F5F9', color: '#334155', textTransform: 'capitalize' }}>
                          {h.target?.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#0F172A', fontSize: '13px' }}>
                        {h.title}
                      </td>
                      <td style={{ fontSize: '12.5px', color: '#475569', maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {h.message}
                      </td>
                      <td style={{ fontSize: '11.5px', color: '#64748B', textTransform: 'capitalize' }}>
                        {h.type || 'promotion'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#16A34A', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={13} /> Dispatched
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};
