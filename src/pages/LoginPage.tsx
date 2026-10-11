import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../services/authContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@sangi.in');
  const [password, setPassword] = useState('Admin@Sangi2026!');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.login({ email, password });
      if (res.success && res.token && res.user) {
        login(res.token, res.user);
        navigate('/');
      } else {
        setError('Login failed: invalid response');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials or server unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail('admin@sangi.in');
    setPassword('Admin@Sangi2026!');
    setError(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 0%, #064E3B 0%, #03140E 100%)',
      padding: '20px',
      position: 'relative',
    }}>
      {/* Decorative Blur Orbs */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '25%',
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'rgba(34, 197, 94, 0.15)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: 440,
        backgroundColor: 'var(--white)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xl)',
        padding: '36px 32px',
        position: 'relative',
        zIndex: 10,
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--primary-gradient)',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(22, 163, 74, 0.35)',
          }}>
            <Shield size={30} color="#FFFFFF" strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--dark-text)' }}>
            SANGI Admin Portal
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--secondary-text)', marginTop: 4 }}>
            Operations & Platform Control Center
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--error-light)',
            border: '1px solid #FECACA',
            color: 'var(--error)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20,
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Admin Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sangi.in"
                className="form-input"
                style={{ paddingLeft: 40 }}
              />
              <Mail size={18} color="var(--muted-text)" style={{ position: 'absolute', left: 14, top: 12 }} />
            </div>
          </div>

          <div style={{ marginBottom: 22 }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="form-input"
                style={{ paddingLeft: 40 }}
              />
              <Lock size={18} color="var(--muted-text)" style={{ position: 'absolute', left: 14, top: 12 }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '15px' }}
          >
            {isLoading ? 'Authenticating...' : 'Sign In to Dashboard'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div style={{
          marginTop: 24,
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--very-light-green)',
          border: '1px solid var(--border-green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dark-green)' }}>
              Default Super Admin
            </div>
            <div style={{ fontSize: '11px', color: 'var(--secondary-text)' }}>
              admin@sangi.in • Admin@Sangi2026!
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickFill}
            style={{
              background: 'var(--white)',
              border: '1px solid var(--primary-green)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--primary-green)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            Auto Fill
          </button>
        </div>

        <div style={{
          marginTop: 20,
          textAlign: 'center',
          fontSize: '11.5px',
          color: 'var(--muted-text)',
        }}>
          🔒 Protected by 256-bit SSL encryption & RBAC security
        </div>
      </div>
    </div>
  );
};
