import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as usersApi from '../../api/users';
import { getMyBookingStats } from '../../api/bookings';
import { Camera, Save, User as UserIcon } from 'lucide-react';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import type { BookingStats } from '../../types';
import '../../styles/profile.css';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          usersApi.getProfile(),
          getMyBookingStats(),
        ]);
        const p = profileRes.data.data;
        setName(p.name ?? '');
        setPhone(p.phone ?? '');
        setAvatarUrl(p.avatarUrl ?? undefined);
        setStats(statsRes.data.data);
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await usersApi.updateProfile({ name, phone });
      const updated = res.data.data;
      updateUser({ name: updated.name, phone: updated.phone });
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }

    setUploading(true);
    try {
      const res = await usersApi.uploadAvatar(file);
      const newUrl = res.data.data.avatarUrl;
      setAvatarUrl(newUrl);
      updateUser({ avatarUrl: newUrl });
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page animate-fade-in">
      <div className="profile-container">
        {/* ── Avatar + Info ──────────────────────────────────────── */}
        <div className="profile-header">
          <div className="avatar-upload" onClick={() => fileRef.current?.click()}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                {(user?.name ?? user?.email ?? '?')[0]?.toUpperCase()}
              </div>
            )}
            <div className="avatar-overlay">
              {uploading ? (
                <div style={{ animation: 'spin 1s linear infinite', width: 24, height: 24, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
              ) : (
                <Camera size={28} />
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>

          <div className="profile-info">
            <h2>{user?.name || 'Unnamed User'}</h2>
            <p className="profile-email">{user?.email}</p>
            <span className="profile-role">{user?.role}</span>
          </div>
        </div>

        {/* ── Stats ─────────────────────────────────────────────── */}
        {stats && (
          <div className="profile-stats">
            <div className="stat-card">
              <div className="stat-value">{stats.totalBookings}</div>
              <div className="stat-label">Total Bookings</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.confirmedCount}</div>
              <div className="stat-label">Confirmed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.cancelledCount}</div>
              <div className="stat-label">Cancelled</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--accent-400)' }}>
                ₹{stats.totalSpent.toLocaleString()}
              </div>
              <div className="stat-label">Total Spent</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--info)' }}>{stats.upcomingEvents}</div>
              <div className="stat-label">Upcoming</div>
            </div>
          </div>
        )}

        {/* ── Edit Form ─────────────────────────────────────────── */}
        <div className="profile-form">
          <h3><UserIcon size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Edit Profile</h3>
          <div className="profile-fields">
            <div className="profile-field">
              <label>Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="profile-field">
              <label>Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>
          </div>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
