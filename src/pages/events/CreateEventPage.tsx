import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { listVenues, getVenue } from '../../api/venues';
import { createEvent } from '../../api/events';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Select } from '../../components/ui/Input';
import toast from 'react-hot-toast';
import type { Venue, VenueSection } from '../../types';

interface SectionPriceState {
  sectionId: string;
  sectionName: string;
  seatCount: number;
  price: string;
}

const SECTION_COLORS: Record<number, { bg: string; border: string; badge: string }> = {
  0: { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.25)', badge: 'rgba(139,92,246,0.2)' },
  1: { bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.25)',  badge: 'rgba(234,179,8,0.2)'  },
  2: { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)',  badge: 'rgba(34,197,94,0.2)'  },
  3: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', badge: 'rgba(59,130,246,0.2)' },
  4: { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)',  badge: 'rgba(239,68,68,0.2)'  },
};

const getColor = (i: number) => SECTION_COLORS[i % Object.keys(SECTION_COLORS).length];

export default function CreateEventPage() {
  const [form, setForm] = useState({ title: '', description: '', startTime: '', venueId: '', defaultPrice: '' });
  const [venues, setVenues] = useState<Venue[]>([]);
  const [sections, setSections] = useState<SectionPriceState[]>([]);
  const [venueLoading, setVenueLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch venue list on mount
  useEffect(() => {
    listVenues({ limit: 100 }).then(res => setVenues(res.data.data || [])).catch(() => {});
  }, []);

  // Fetch venue sections when a venue is selected
  useEffect(() => {
    if (!form.venueId) { setSections([]); return; }
    setVenueLoading(true);
    getVenue(form.venueId)
      .then(res => {
        const venue: Venue = res.data.data ?? res.data;
        const venueSections: VenueSection[] = venue.sections ?? [];
        setSections(
          venueSections.map(sec => ({
            sectionId: sec.id,
            sectionName: sec.name,
            seatCount: sec.seats?.length ?? 0,
            price: form.defaultPrice || '0',
          }))
        );
      })
      .catch(() => toast.error('Failed to load venue sections'))
      .finally(() => setVenueLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.venueId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    // When defaultPrice changes, propagate to all sections that haven't been individually edited
    if (name === 'defaultPrice') {
      setSections(prev => prev.map(sec => ({ ...sec, price: value })));
    }
  };

  const handleSectionPriceChange = (sectionId: string, value: string) => {
    setSections(prev => prev.map(sec => sec.sectionId === sectionId ? { ...sec, price: value } : sec));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.startTime || !form.venueId || !form.defaultPrice) {
      return toast.error('Please fill all required fields');
    }

    const defaultPrice = parseFloat(form.defaultPrice);
    if (isNaN(defaultPrice) || defaultPrice < 0) return toast.error('Invalid default price');

    // Validate section prices
    for (const sec of sections) {
      const p = parseFloat(sec.price);
      if (isNaN(p) || p < 0) return toast.error(`Invalid price for section "${sec.sectionName}"`);
    }

    setLoading(true);
    try {
      const sectionPricing = sections.map(sec => ({
        sectionId: sec.sectionId,
        price: parseFloat(sec.price),
      }));

      const payload = {
        title: form.title,
        description: form.description || undefined,
        startTime: new Date(form.startTime).toISOString(),
        venueId: form.venueId,
        defaultPrice,
        sectionPricing: sectionPricing.length > 0 ? sectionPricing : undefined,
      };

      const res = await createEvent(payload);
      toast.success(`Event created! ${res.data.generatedSeatsCount ?? ''} seats generated.`);
      navigate(`/events/${res.data.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const totalSeats = sections.reduce((s, sec) => s + sec.seatCount, 0);

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Event</h1>
          <p className="page-subtitle">Set up a new event with per-section pricing</p>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── Basic info card ────────────────────────────────────────────── */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ marginBottom: 4 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Event Details</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Basic information about your event</p>
            </div>
            <Input label="Event Title *" id="event-title" name="title" placeholder="e.g. Coldplay World Tour 2026" value={form.title} onChange={handleChange} />
            <Input label="Description (optional)" id="event-desc" name="description" placeholder="Describe your event..." value={form.description} onChange={handleChange} />
            <Input label="Start Date & Time *" id="event-time" name="startTime" type="datetime-local" value={form.startTime} onChange={handleChange} />
            <Select label="Venue *" id="event-venue" name="venueId" value={form.venueId} onChange={handleChange}>
              <option value="">Select a venue</option>
              {venues.map(v => <option key={v.id} value={v.id}>{v.name} — {v.city}</option>)}
            </Select>
          </div>

          {/* ── Pricing card ───────────────────────────────────────────────── */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ marginBottom: 4 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Pricing</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Set a base price, then override per section below
              </p>
            </div>

            {/* Default / fallback price */}
            <div style={{ position: 'relative' }}>
              <Input
                label="Base Price (₹) *"
                id="event-price"
                name="defaultPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="500"
                value={form.defaultPrice}
                onChange={handleChange}
              />
              {sections.length > 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  ↳ Acts as fallback for any section not overridden below
                </p>
              )}
            </div>

            {/* Per-section pricing grid */}
            {venueLoading && (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Loading sections…
              </div>
            )}

            {!venueLoading && sections.length > 0 && (
              <>
                {/* Summary bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  fontSize: '0.8125rem',
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{sections.length}</strong> sections ·{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>{totalSeats}</strong> total seats
                  </span>
                  <span style={{ color: 'var(--text-accent)', fontWeight: 600, fontSize: '0.75rem' }}>
                    Per-section pricing active
                  </span>
                </div>

                {/* Section price cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {sections.map((sec, i) => {
                    const color = getColor(i);
                    return (
                      <div
                        key={sec.sectionId}
                        style={{
                          padding: '14px 16px',
                          borderRadius: 'var(--radius-md)',
                          background: color.bg,
                          border: `1px solid ${color.border}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                          transition: 'box-shadow var(--transition-fast)',
                        }}
                      >
                        {/* Section header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{
                            padding: '2px 10px',
                            borderRadius: 'var(--radius-full)',
                            background: color.badge,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            color: 'var(--text-primary)',
                          }}>
                            {sec.sectionName}
                          </span>
                          {sec.seatCount > 0 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {sec.seatCount} seat{sec.seatCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Price input */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-primary)',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            userSelect: 'none',
                          }}>₹</span>
                          <input
                            id={`section-price-${sec.sectionId}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={sec.price}
                            onChange={e => handleSectionPriceChange(sec.sectionId, e.target.value)}
                            placeholder="0"
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-secondary)',
                              color: 'var(--text-primary)',
                              fontFamily: 'inherit',
                              fontSize: '0.9375rem',
                              fontWeight: 600,
                              outline: 'none',
                              transition: 'border-color var(--transition-fast)',
                            }}
                            onFocus={e => (e.target.style.borderColor = 'var(--accent-500)')}
                            onBlur={e => (e.target.style.borderColor = 'var(--border-secondary)')}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {!venueLoading && !form.venueId && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                Select a venue above to configure per-section prices
              </p>
            )}
          </div>

          {/* ── Actions ───────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 12 }}>
            <Button type="submit" loading={loading}>Create Event</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/events')}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
