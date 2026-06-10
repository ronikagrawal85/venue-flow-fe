import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings, confirmBooking, cancelBooking, getMyBookingStats } from '../../api/bookings';
import { Ticket, CheckCircle, XCircle, ExternalLink, List, Clock } from 'lucide-react';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import BookingTimeline from '../../components/bookings/BookingTimeline';
import toast from 'react-hot-toast';
import type { Booking, BookingStats } from '../../types';
import '../../styles/booking-history.css';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [view, setView] = useState<'list' | 'timeline'>('list');
  const [stats, setStats] = useState<BookingStats | null>(null);
  const navigate = useNavigate();

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 10 };
      if (status) params.status = status;
      const res = await getMyBookings(params as any);
      setBookings(res.data.data || []);
      setTotalPages(res.data.meta?.totalPages || 1);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await getMyBookingStats();
      setStats(res.data.data);
    } catch { /* stats are non-critical */ }
  };

  useEffect(() => { fetchBookings(); }, [page, status]);
  useEffect(() => { fetchStats(); }, []);

  const handleConfirm = async (id: string) => {
    try { await confirmBooking(id); toast.success('Booking confirmed!'); fetchBookings(); fetchStats(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Confirm failed'); }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt('Reason for cancellation (optional):');
    try { await cancelBooking(id, { reason: reason || undefined }); toast.success('Booking cancelled'); fetchBookings(); fetchStats(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Cancel failed'); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="page animate-fade-in">
      <div className="page-header"><div><h1 className="page-title">My Bookings</h1><p className="page-subtitle">View and manage your event reservations</p></div></div>

      {/* ── Stats Cards ──────────────────────────────────── */}
      {stats && (
        <div className="booking-stats">
          <div className="booking-stat-card">
            <div className="booking-stat-value accent">{stats.totalBookings}</div>
            <div className="booking-stat-label">Total</div>
          </div>
          <div className="booking-stat-card">
            <div className="booking-stat-value success">{stats.confirmedCount}</div>
            <div className="booking-stat-label">Confirmed</div>
          </div>
          <div className="booking-stat-card">
            <div className="booking-stat-value warning">{stats.pendingCount}</div>
            <div className="booking-stat-label">Pending</div>
          </div>
          <div className="booking-stat-card">
            <div className="booking-stat-value danger">{stats.cancelledCount}</div>
            <div className="booking-stat-label">Cancelled</div>
          </div>
          <div className="booking-stat-card">
            <div className="booking-stat-value accent">₹{stats.totalSpent.toLocaleString()}</div>
            <div className="booking-stat-label">Total Spent</div>
          </div>
          <div className="booking-stat-card">
            <div className="booking-stat-value info">{stats.upcomingEvents}</div>
            <div className="booking-stat-label">Upcoming</div>
          </div>
        </div>
      )}

      {/* ── Toolbar ───────────────────────────────────────── */}
      <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <select className="form-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={{ maxWidth: 180 }}>
          <option value="">All Status</option><option value="PENDING">Pending</option><option value="CONFIRMED">Confirmed</option><option value="CANCELLED">Cancelled</option><option value="EXPIRED">Expired</option>
        </select>
        <div className="view-toggle">
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><List size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />List</button>
          <button className={view === 'timeline' ? 'active' : ''} onClick={() => setView('timeline')}><Clock size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />Timeline</button>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : bookings.length === 0 ? (
        <EmptyState icon={Ticket} title="No bookings yet" text="Browse events and book your seats!" />
      ) : (
        <>
          {view === 'timeline' ? (
            <BookingTimeline bookings={bookings} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {bookings.map((booking) => (
                <div key={booking.id} className="list-item" onClick={() => navigate(`/bookings/${booking.id}`)}>
                  <div className="list-item-info" style={{ flex: 1 }}>
                    <div className="list-item-title">{booking.event?.title || 'Event'}</div>
                    <div className="list-item-subtitle">{booking.event?.venue?.name} • {booking.items?.length || 0} seat(s) • {formatDate(booking.createdAt)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--accent-400)' }}>₹{parseFloat(booking.totalAmount).toLocaleString()}</div></div>
                    <StatusBadge status={booking.status} />
                    <div className="list-item-actions" onClick={(e) => e.stopPropagation()}>
                      {booking.status === 'PENDING' && (<><Button variant="primary" size="sm" onClick={() => handleConfirm(booking.id)}><CheckCircle size={14} /> Confirm</Button><Button variant="danger" size="sm" onClick={() => handleCancel(booking.id)}><XCircle size={14} /></Button></>)}
                      {booking.status === 'CONFIRMED' && (<><Button variant="secondary" size="sm" onClick={() => navigate(`/tickets/${booking.id}`)}><ExternalLink size={14} /> Ticket</Button><Button variant="danger" size="sm" onClick={() => handleCancel(booking.id)}><XCircle size={14} /> Cancel</Button></>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
