import React, { useEffect, useState, useMemo } from 'react';
import { 
  Tag, Plus, Edit2, Trash2, Check, AlertCircle, RefreshCw, 
  Image, ToggleLeft, ToggleRight, Sparkles, Search, Layers,
  CheckCircle2, Smartphone, ExternalLink, IndianRupee
} from 'lucide-react';
import { AdminShell } from '../components/layout/AdminShell';
import { Modal } from '../components/common/Modal';
import { api } from '../services/api';

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Edit / Create modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: '',
    description: '',
    imageUrl: '',
    bookingFee: 30,
    basePrice: 299,
    isActive: true,
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const res = await api.getServices();
      if (res.success) {
        setServices(res.services);
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Compute unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach(s => {
      if (s.category) set.add(s.category);
    });
    return ['All', ...Array.from(set)];
  }, [services]);

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || 
        s.name?.toLowerCase().includes(q) || 
        s.slug?.toLowerCase().includes(q) || 
        s.category?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [services, selectedCategory, search]);

  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({
      name: '',
      slug: '',
      category: 'Home Care',
      description: '',
      imageUrl: '',
      bookingFee: 30,
      basePrice: 299,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: any) => {
    setEditingService(s);
    setFormData({
      name: s.name,
      slug: s.slug || s.name.toLowerCase().replace(/\s+/g, '_'),
      category: s.category || 'General',
      description: s.description || '',
      imageUrl: s.imageUrl || `/services/${s.slug}.png`,
      bookingFee: s.bookingFee || 30,
      basePrice: s.basePrice || 299,
      isActive: s.isActive ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        ...formData,
        imageUrl: formData.imageUrl.trim() || `/services/${formData.slug}.png`,
      };
      if (editingService) {
        await api.updateService(editingService._id, payload);
        alert(`Service "${formData.name}" and pricing updated successfully!`);
      } else {
        await api.createService(payload);
        alert(`Service "${formData.name}" listed successfully!`);
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (err: any) {
      alert(err.message || 'Failed to save service');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (s: any) => {
    try {
      await api.updateService(s._id, { isActive: !s.isActive });
      fetchServices();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleDelete = async (s: any) => {
    if (!window.confirm(`Delete service "${s.name}"? This may affect mobile app bookings for this service.`)) return;
    try {
      await api.deleteService(s._id);
      fetchServices();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  return (
    <AdminShell
      title="Services & Pricing Control Center"
      subtitle="Manage all 20 mobile app services, configure platform booking fees, and update base charges (Rule #8)"
      onRefresh={fetchServices}
      isRefreshing={isLoading}
    >
      <div className="admin-page-container">
        {/* 1. Stat Cards Row */}
        <div className="stats-grid">
          <div className="stat-card">
            <div>
              <div className="stat-label">Total Services Linked</div>
              <div className="stat-value">{services.length}</div>
              <div className="stat-subtitle">All mobile app catalog offerings</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#F0FDF4', color: '#16A34A' }}>
              <Sparkles size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Active in Customer App</div>
              <div className="stat-value">{services.filter(s => s.isActive).length}</div>
              <div className="stat-subtitle">Available for live booking</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#DCFCE7', color: '#15803D' }}>
              <CheckCircle2 size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Service Categories</div>
              <div className="stat-value">{categories.length > 1 ? categories.length - 1 : 0}</div>
              <div className="stat-subtitle">Distinct domains covered</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#E0F2FE', color: '#0284C7' }}>
              <Layers size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Platform Booking Fee</div>
              <div className="stat-value">₹30 - ₹49</div>
              <div className="stat-subtitle">Checkout commission / job</div>
            </div>
            <div className="stat-icon-box" style={{ background: '#FEF3C7', color: '#B45309' }}>
              <Tag size={24} />
            </div>
          </div>
        </div>

        {/* 2. Action & Filter Toolbar */}
        <div className="action-toolbar" style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'stretch' }}>
          {/* Top Row: Search & Add */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div className="search-input-wrapper" style={{ minWidth: 300, flex: '1 1 300px' }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search services by title, category, or mobile app slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={fetchServices} className="btn btn-secondary btn-sm" title="Refresh Services">
                <RefreshCw size={14} className={isLoading ? 'spin-anim' : ''} />
                <span>Refresh</span>
              </button>
              <button onClick={handleOpenCreate} className="btn btn-primary btn-sm">
                <Plus size={15} />
                <span>List New Service</span>
              </button>
            </div>
          </div>

          {/* Bottom Row: Category Filter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 4 }}>
            {categories.map((cat) => {
              const count = cat === 'All' ? services.length : services.filter(s => s.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    border: isSelected ? '1px solid #16A34A' : '1px solid #E2E8F0',
                    background: isSelected ? '#16A34A' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{cat}</span>
                  <span style={{
                    fontSize: '10.5px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                    color: isSelected ? '#FFFFFF' : '#64748B',
                    fontWeight: 700,
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Visual Services Grid */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
            Loading service offerings...
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="table-card">
            <div className="empty-state">
              <Sparkles size={40} color="#16A34A" />
              <h4>No matching services found</h4>
              <p>Try searching for a different keyword or select another category filter.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
            {filteredServices.map((s) => {
              // Direct image from mobile app assets copied into public/services/
              const displayImg = (s.imageUrl && (s.imageUrl.startsWith('http://') || s.imageUrl.startsWith('https://')) && !s.imageUrl.includes('unsplash.com'))
                ? s.imageUrl
                : `/services/${s.slug}.png`;

              return (
                <div
                  key={s._id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  {/* Service Photo with Floating Badges */}
                  <div style={{ height: 175, background: '#F8FAFC', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={displayImg}
                      alt={s.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        // Fallback to s.imageUrl or web image if local file fails
                        if (s.imageUrl && (e.target as any).src !== s.imageUrl) {
                          (e.target as any).src = s.imageUrl;
                        }
                      }}
                    />

                    {/* Category Chip */}
                    <div style={{ position: 'absolute', top: 10, left: 10 }}>
                      <span style={{
                        padding: '3px 8px',
                        background: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(4px)',
                        color: '#FFFFFF',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        borderRadius: '6px',
                        letterSpacing: '0.02em',
                      }}>
                        {s.category || 'Service'}
                      </span>
                    </div>

                    {/* Active / Disabled Badge */}
                    <div style={{ position: 'absolute', top: 10, right: 10 }}>
                      <span style={{
                        padding: '3px 8px',
                        background: s.isActive ? '#16A34A' : '#64748B',
                        color: '#FFFFFF',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        borderRadius: '6px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                      }}>
                        {s.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    {/* App Slug Anchor (Links to mobile app) */}
                    <div style={{ position: 'absolute', bottom: 8, left: 10 }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(4px)',
                        color: '#4ADE80',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                      }}>
                        <Smartphone size={11} />
                        <span>app:{s.slug}</span>
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>{s.name}</h3>
                      <p style={{ fontSize: '12px', color: '#64748B', marginTop: 4, lineHeight: 1.4 }}>
                        {s.description || 'Comprehensive home service by verified SANGI service professionals.'}
                      </p>
                    </div>

                    {/* Pricing Box (Rule #8) */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                      marginTop: 14,
                      padding: '10px 12px',
                      background: '#F8FAFC',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                    }}>
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                          Booking Fee (Rule #8)
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#15803D', marginTop: 2 }}>
                          ₹{s.bookingFee || 30}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748B' }}>Platform Fee</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                          Starting Base Price
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                          ₹{s.basePrice || 299}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748B' }}>Labor starting rate</div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Controls */}
                  <div style={{ padding: '12px 16px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                      onClick={() => handleToggleStatus(s)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '12px', fontWeight: 600, color: s.isActive ? '#16A34A' : '#64748B' }}
                    >
                      {s.isActive ? <ToggleRight size={18} color="#16A34A" /> : <ToggleLeft size={18} color="#94A3B8" />}
                      <span>{s.isActive ? 'Active in App' : 'Disabled'}</span>
                    </button>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="btn btn-secondary btn-sm"
                        title="Update Booking Price and Details"
                      >
                        <Edit2 size={13} />
                        <span>Edit Price</span>
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        style={{ padding: '6px 8px', background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}
                        title="Delete Service"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Edit / Create Service & Pricing Modal (Rule #8) */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingService ? `Update Pricing: ${editingService.name}` : 'List New Service'}
          subtitle="Changes to booking price take effect immediately across customer checkout (Rule #8)"
          maxWidth="560px"
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Live Mobile Image Preview */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px',
              background: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
            }}>
              <div style={{ width: 70, height: 70, borderRadius: 8, overflow: 'hidden', background: '#E2E8F0', flexShrink: 0 }}>
                <img
                  src={formData.slug ? `/services/${formData.slug}.png` : (formData.imageUrl || '/services/cleaning.png')}
                  alt="App Service Icon"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    if (formData.imageUrl && (e.target as any).src !== formData.imageUrl) {
                      (e.target as any).src = formData.imageUrl;
                    }
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                  Mobile App Service Icon
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: 2 }}>
                  Directly linked to Flutter asset: <code style={{ color: '#166534', fontWeight: 700 }}>assets/images/services/{formData.slug || 'service'}.png</code>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Service Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. AC Repair"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">App Identifier Slug (Unique) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ac_repair"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="form-input"
                  style={{ fontFamily: 'monospace' }}
                  disabled={!!editingService}
                />
                <span style={{ fontSize: '10.5px', color: '#64748B' }}>Links to mobile app ServiceType</span>
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Appliance Care"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#166534' }}>
                  Booking Price / Fee (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.bookingFee}
                  onChange={(e) => setFormData({ ...formData, bookingFee: Number(e.target.value) })}
                  className="form-input"
                  style={{ fontWeight: 800, color: '#15803D' }}
                />
                <span style={{ fontSize: '10.5px', color: '#64748B' }}>Fixed platform advance charge</span>
              </div>

              <div className="form-group">
                <label className="form-label">Starting Base Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                  className="form-input"
                  style={{ fontWeight: 800, color: '#0F172A' }}
                />
                <span style={{ fontSize: '10.5px', color: '#64748B' }}>Approximate starting labor cost</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Custom Image URL (Optional override)</label>
              <input
                type="text"
                placeholder={`/services/${formData.slug || 'service'}.png or https://...`}
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                rows={3}
                placeholder="Describe this service offering and what it covers..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-textarea"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Service Status</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Visible and bookable on mobile app</div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', fontWeight: 700, color: formData.isActive ? '#16A34A' : '#64748B' }}
              >
                {formData.isActive ? <ToggleRight size={22} color="#16A34A" /> : <ToggleLeft size={22} color="#94A3B8" />}
                <span>{formData.isActive ? 'Active' : 'Disabled'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="btn btn-primary"
              >
                {actionLoading ? 'Saving...' : editingService ? 'Save Price Changes' : 'List Service'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminShell>
  );
};
