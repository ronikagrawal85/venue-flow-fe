import { useNavigate } from 'react-router-dom';
import { Zap, AlertTriangle } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function AuthErrorPage() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const reason = params.get('reason') ?? 'unknown';

  const messages: Record<string, string> = {
    oauth_failed: 'Google sign-in could not be completed. Please try again.',
    unknown: 'An unexpected authentication error occurred.',
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 24,
          }}
        >
          <Zap size={28} color="var(--accent-500)" />
          <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>VenueFlow</span>
        </div>
        <AlertTriangle
          size={48}
          style={{ color: 'var(--error, #ef4444)', margin: '0 auto 16px', display: 'block' }}
        />
        <h1 style={{ fontSize: '1.25rem', marginBottom: 8 }}>Authentication Error</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: '0.95rem' }}>
          {messages[reason] ?? messages.unknown}
        </p>
        <Button variant="primary" onClick={() => navigate('/login')}>
          Back to Sign In
        </Button>
      </div>
    </div>
  );
}
