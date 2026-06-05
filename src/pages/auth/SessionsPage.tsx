import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Monitor, Smartphone, LogOut, AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '../../components/ui/Button';
import type { Session } from '../../types';
import toast from 'react-hot-toast';

function parseUserAgent(ua?: string): { device: string; browser: string } {
  if (!ua) return { device: 'Unknown device', browser: 'Unknown browser' };
  const isMobile = /mobile|android|iphone|ipad/i.test(ua);
  let browser = 'Unknown browser';
  if (/chrome/i.test(ua) && !/edge/i.test(ua)) browser = 'Chrome';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/edge/i.test(ua)) browser = 'Edge';
  const device = isMobile ? 'Mobile' : 'Desktop';
  return { device, browser };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function SessionsPage() {
  const { getSessions, logout, logoutAll } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [getSessions]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out of this device');
    navigate('/login', { replace: true });
  };

  const handleLogoutAll = async () => {
    setLogoutAllLoading(true);
    try {
      await logoutAll();
      toast.success('All sessions revoked');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Failed to revoke all sessions');
    } finally {
      setLogoutAllLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: '2rem auto', padding: '0 1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>
          Active Sessions
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          These are the devices currently logged into your account.
        </p>
      </div>

      {/* Danger Zone */}
      <div
        style={{
          background: 'var(--surface-1, #1e1e2e)',
          border: '1px solid var(--border, rgba(255,255,255,0.08))',
          borderRadius: 12,
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 600, marginBottom: 2, fontSize: '0.95rem' }}>
              Revoke all sessions
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Logs you out from every device including this one.
            </p>
          </div>
        </div>
        <Button
          variant="danger"
          size="sm"
          loading={logoutAllLoading}
          onClick={handleLogoutAll}
        >
          <LogOut size={14} /> Logout all devices
        </Button>
      </div>

      {/* Sessions list */}
      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '3rem 0',
            color: 'var(--text-secondary)',
          }}
        >
          <RefreshCw size={20} style={{ animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : sessions.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>
          No active sessions found.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map((session, idx) => {
            const { device, browser } = parseUserAgent(session.userAgent);
            const isMobile = device === 'Mobile';
            const isCurrentIdx = idx === 0; // most recent session is current
            return (
              <div
                key={session.id}
                style={{
                  background: 'var(--surface-1, #1e1e2e)',
                  border: `1px solid ${isCurrentIdx ? 'var(--accent-500, #8b5cf6)' : 'var(--border, rgba(255,255,255,0.08))'}`,
                  borderRadius: 12,
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'var(--surface-2, rgba(255,255,255,0.05))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isMobile ? (
                    <Smartphone size={18} style={{ color: 'var(--accent-400, #a78bfa)' }} />
                  ) : (
                    <Monitor size={18} style={{ color: 'var(--accent-400, #a78bfa)' }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {browser} · {device}
                    </span>
                    {isCurrentIdx && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          background: 'var(--accent-500, #8b5cf6)',
                          color: '#fff',
                          padding: '1px 8px',
                          borderRadius: 999,
                          fontWeight: 600,
                        }}
                      >
                        Current
                      </span>
                    )}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {session.ipAddress && <span>IP: {session.ipAddress}</span>}
                    <span>Signed in {formatDate(session.createdAt)}</span>
                    <span>Expires {formatDate(session.expiresAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Logout current device */}
      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut size={14} /> Logout this device
        </Button>
      </div>
    </div>
  );
}
