import { useNavigate } from 'react-router-dom';
import StatusBadge from '../ui/StatusBadge';
import type { Booking } from '../../types';

interface Props {
  bookings: Booking[];
}

export default function BookingTimeline({ bookings }: Props) {
  const navigate = useNavigate();

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="timeline">
      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="timeline-item"
          onClick={() => navigate(`/bookings/${booking.id}`)}
        >
          <div className={`timeline-dot ${booking.status}`} />
          <div className="timeline-card">
            <div className="timeline-header">
              <div>
                <div className="timeline-title">
                  {booking.event?.title || 'Event'}
                </div>
                <div className="timeline-meta">
                  {booking.event?.venue?.name} • {booking.items?.length || 0} seat(s)
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="timeline-amount">
                  ₹{parseFloat(booking.totalAmount).toLocaleString()}
                </div>
                <StatusBadge status={booking.status} />
              </div>
            </div>
            <div className="timeline-date">{formatDate(booking.createdAt)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
