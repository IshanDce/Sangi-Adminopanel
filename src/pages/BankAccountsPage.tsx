import React, { useEffect, useState } from 'react';
import { 
  Landmark, Search, Copy, Check, Phone, RefreshCw, Wallet, Users
} from 'lucide-react';
import { AdminShell } from '../components/layout/AdminShell';
import { api } from '../services/api';

export const BankAccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [filterRole, setFilterRole] = useState<'all' | 'staff' | 'customer'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchBankAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getBankAccounts();
      if (res.success) {
        setAccounts(res.accounts);
      }
    } catch (err) {
      console.error('Failed to load bank accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredAccounts = accounts.filter((item) => {
    const matchesRole = filterRole === 'all' || item.role === filterRole;
    const query = search.toLowerCase().trim();
    if (!query) return matchesRole;

    const acc = item.bankAccount || {};
    const matchesSearch = 
      (item.fullName || item.name || '').toLowerCase().includes(query) ||
      (item.phone || '').toLowerCase().includes(query) ||
      (acc.accountNumber || '').toLowerCase().includes(query) ||
      (acc.ifscCode || '').toLowerCase().includes(query) ||
      (acc.upiId || '').toLowerCase().includes(query) ||
      (acc.bankName || '').toLowerCase().includes(query);

    return matchesRole && matchesSearch;
  });

  return (
    <AdminShell
      title="Bank Details & UPI Directory"
      subtitle="Directory of verified bank accounts, IFSC codes, and UPI IDs uploaded by customers and staff (Rule #9)"
      onRefresh={fetchBankAccounts}
      isRefreshing={isLoading}
    >
      <div className="admin-page-container">
        {/* 1. Stat Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div>
              <div className="stat-label">Total Accounts Uploaded</div>
              <div className="stat-value">{accounts.length}</div>
              <div className="stat-subtitle">Payout destinations</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#F0FDF4', color: '#16A34A' }}>
              <Landmark size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Staff Bank Accounts</div>
              <div className="stat-value">{accounts.filter(a => a.role === 'staff').length}</div>
              <div className="stat-subtitle">Service provider accounts</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#EDE9FE', color: '#6D28D9' }}>
              <Users size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Customer Accounts</div>
              <div className="stat-value">{accounts.filter(a => a.role === 'customer').length}</div>
              <div className="stat-subtitle">Refund & cashbacks</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#E0F2FE', color: '#0369A1' }}>
              <Wallet size={24} />
            </div>
          </div>
        </div>

        {/* 2. Action Toolbar */}
        <div className="action-toolbar">
          <div className="tab-pills">
            {(['all', 'staff', 'customer'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`tab-btn ${filterRole === role ? 'active' : ''}`}
                style={{ textTransform: 'capitalize' }}
              >
                {role === 'all' ? 'All Accounts' : `${role}s`}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by name, phone, account #, IFSC, UPI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button onClick={fetchBankAccounts} className="btn btn-secondary btn-sm" title="Refresh">
              <RefreshCw size={14} className={isLoading ? 'spin-anim' : ''} />
            </button>
          </div>
        </div>

        {/* 3. Table */}
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User & Contact</th>
                  <th>Role</th>
                  <th>Account Holder Name</th>
                  <th>Bank Name & Account Number</th>
                  <th>IFSC Code</th>
                  <th>UPI ID</th>
                  <th>Wallet Balance</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      Loading bank directory...
                    </td>
                  </tr>
                ) : filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <Landmark size={36} color="#16A34A" />
                        <h4>No bank accounts found</h4>
                        <p>No bank or UPI accounts match your query.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((item) => {
                    const acc = item.bankAccount || {};
                    const isStaff = item.role === 'staff';
                    const userName = item.fullName || item.name || 'User';

                    return (
                      <tr key={item._id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '13px' }}>
                            {userName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Phone size={11} color="#16A34A" /> {item.phone}
                          </div>
                        </td>

                        <td>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: isStaff ? '#EDE9FE' : '#E0F2FE',
                            color: isStaff ? '#6D28D9' : '#0369A1',
                            textTransform: 'uppercase',
                          }}>
                            {item.role}
                          </span>
                        </td>

                        <td>
                          <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '13px' }}>
                            {acc.accountHolderName || userName}
                          </div>
                        </td>

                        <td>
                          {acc.accountNumber ? (
                            <div>
                              <div style={{ fontSize: '11px', color: '#64748B' }}>{acc.bankName || 'Bank'}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace', fontWeight: 700, color: '#0F172A', fontSize: '13px' }}>
                                <span>{acc.accountNumber}</span>
                                <button
                                  onClick={() => copyToClipboard(acc.accountNumber, `ac_${item._id}`)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                                  title="Copy Account #"
                                >
                                  {copiedKey === `ac_${item._id}` ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>Not provided</span>
                          )}
                        </td>

                        <td>
                          {acc.ifscCode ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace', fontWeight: 700, fontSize: '12.5px', color: '#334155' }}>
                              <span>{acc.ifscCode}</span>
                              <button
                                onClick={() => copyToClipboard(acc.ifscCode, `ifsc_${item._id}`)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                                title="Copy IFSC"
                              >
                                {copiedKey === `ifsc_${item._id}` ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>N/A</span>
                          )}
                        </td>

                        <td>
                          {acc.upiId ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: '#166534' }}>
                              <span>{acc.upiId}</span>
                              <button
                                onClick={() => copyToClipboard(acc.upiId, `upi_${item._id}`)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                                title="Copy UPI"
                              >
                                {copiedKey === `upi_${item._id}` ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>N/A</span>
                          )}
                        </td>

                        <td>
                          <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#15803D' }}>
                            ₹{(item.walletBalance || 0).toLocaleString('en-IN')}
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
