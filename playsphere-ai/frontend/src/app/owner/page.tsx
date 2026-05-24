'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Plus, Calendar, BarChart3, Clock, Loader2, Trash2, Pencil, Eye, EyeOff, Ticket, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';
import {
  subscribeOwnerVenues,
  subscribeVenueBookings,
  addVenue,
  updateVenue,
  deleteVenue,
} from '@/backend/firebase/firestore';
import { Venue, Booking } from '@/shared/types';
import { formatCurrency, formatDate, getSportEmoji, cn } from '@/shared/helpers/utils';
import { VenueForm, VenueFormData } from '@/components/owner/VenueForm';

type OwnerTab = 'overview' | 'venues' | 'add' | 'bookings' | 'analytics';

export default function OwnerDashboardPage() {
  const { user, profile, isApprovedOwner, isOwner } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<OwnerTab>('overview');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Subscribe to owner venues in real-time
  useEffect(() => {
    if (!user) return;
    let active = true;
    let unsub: (() => void) | undefined;
    Promise.resolve().then(() => {
      if (!active) return;
      setVenuesLoading(true);
      unsub = subscribeOwnerVenues(user.uid, (v) => {
        if (active) {
          setVenues(v);
          setVenuesLoading(false);
        }
      });
    });
    return () => {
      active = false;
      if (unsub) unsub();
    };
  }, [user]);

  // Subscribe to bookings for all owner venues
  useEffect(() => {
    if (venues.length === 0) return;
    const venueIds = venues.map((v) => v.id);
    const unsub = subscribeVenueBookings(venueIds, setBookings);
    return () => unsub();
  }, [venues]);

  const handleAddVenue = async (formData: VenueFormData) => {
    if (!user) return;
    await addVenue({
      ...formData,
      ownerId: user.uid,
      source: 'owner',
      approvalStatus: 'approved',
      rating: 4.0,
      reviewCount: 0,
      category: formData.sport,
      peakPricing: {
        morning: Math.round(formData.price * 1.1),
        afternoon: Math.round(formData.price * 0.85),
        evening: Math.round(formData.price * 1.3),
      },
    });
    showSuccess('✅ Venue added successfully!');
    setTab('venues');
  };

  const handleEditVenue = async (formData: VenueFormData) => {
    if (!editingVenue) return;
    await updateVenue(editingVenue.id, {
      ...formData,
      peakPricing: {
        morning: Math.round(formData.price * 1.1),
        afternoon: Math.round(formData.price * 0.85),
        evening: Math.round(formData.price * 1.3),
      },
    });
    showSuccess('✅ Venue updated!');
    setEditingVenue(null);
    setTab('venues');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this venue? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      await deleteVenue(id);
      showSuccess('🗑️ Venue deleted.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleAvailability = async (venue: Venue) => {
    setTogglingId(venue.id);
    try {
      await updateVenue(venue.id, { available: !venue.available });
    } finally {
      setTogglingId(null);
    }
  };

  // ── Stats ──
  const totalRevenue = bookings.filter((b) => b.status !== 'cancelled').reduce((s, b) => s + b.price, 0);
  const upcomingBookings = bookings.filter((b) => b.status === 'upcoming');
  const activeVenues = venues.filter((v) => v.available);

  // ── Pending approval guard ─────────────────────────────────────────────────
  if (isOwner && !isApprovedOwner) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-slate-900 border-3 border-black rounded-lg p-10 shadow-[8px_8px_0px_0px_#000] text-center">
          <div className="w-20 h-20 rounded-md bg-amber-400 border-2 border-black flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_#000]">
            <Clock className="w-10 h-10 text-black" />
          </div>
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-wide mb-3">
            Pending Approval
          </h1>
          <p className="text-slate-400 mb-6 leading-relaxed">
            Your Venue Owner account is under review. Our admin team will verify your account within 24 hours. 
            Once approved, you&apos;ll have full access to the Owner Dashboard to list and manage your venues.
          </p>
          <div className="bg-amber-400/10 border-2 border-amber-400/40 rounded-md p-4 text-amber-300 text-sm font-medium mb-6">
            📧 You&apos;ll be notified when your account is approved. You can refresh this page to check your status.
          </div>
          <button onClick={() => router.push('/')} className="btn-secondary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const TABS: { id: OwnerTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'venues', label: 'My Venues', icon: <Building2 className="w-4 h-4" /> },
    { id: 'add', label: 'Add Venue', icon: <Plus className="w-4 h-4" /> },
    { id: 'bookings', label: 'Bookings', icon: <Calendar className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-md bg-cyan-400 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
                <Building2 className="w-4 h-4 text-black" />
              </div>
              <h1 className="font-display text-3xl font-bold">
                Owner <span className="gradient-text">Dashboard</span>
              </h1>
            </div>
            <p className="text-slate-400">
              {profile?.displayName} &bull; {venues.length} venue{venues.length !== 1 ? 's' : ''} listed
            </p>
          </div>
          {successMsg && (
            <div className="bg-emerald-400 border-2 border-black rounded-md px-4 py-2 text-black text-sm font-bold shadow-[3px_3px_0px_#000]">
              {successMsg}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6 overflow-x-auto scrollbar-hide p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setEditingVenue(null); }}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold whitespace-nowrap transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
                tab === t.id
                  ? 'bg-cyan-400 text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] translate-x-0.5 translate-y-0.5'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: OVERVIEW ──────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Venues', value: venues.length, color: 'text-cyan-400', icon: '🏢' },
                { label: 'Active Venues', value: activeVenues.length, color: 'text-emerald-400', icon: '✅' },
                { label: 'Total Bookings', value: bookings.length, color: 'text-amber-400', icon: '📅' },
                { label: 'Revenue', value: formatCurrency(totalRevenue), color: 'text-purple-400', icon: '💰' },
              ].map((stat) => (
                <div key={stat.label} className="glass rounded-lg p-5 border-2 border-black shadow-[4px_4px_0px_0px_#000] text-center">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-slate-400 text-xs mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Upcoming bookings summary */}
            <div className="glass rounded-lg p-6 border-2 border-black">
              <h2 className="font-display font-bold text-white text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" /> Upcoming Bookings ({upcomingBookings.length})
              </h2>
              {upcomingBookings.length === 0 ? (
                <p className="text-slate-400 text-sm">No upcoming bookings yet.</p>
              ) : (
                upcomingBookings.slice(0, 5).map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-3 border-b border-black/20 last:border-0">
                    <div>
                      <div className="text-white font-bold text-sm">{b.venueName}</div>
                      <div className="text-slate-400 text-xs">{b.playerName || 'Player'} • {formatDate(b.date)} • {b.slot}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-xs text-cyan-400 bg-slate-900 border border-black px-2 py-1 rounded">
                        {b.ticketNumber}
                      </div>
                      <span className="text-emerald-400 font-bold text-sm">{formatCurrency(b.price)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB: MY VENUES ─────────────────────────────────── */}
        {tab === 'venues' && !editingVenue && (
          <div>
            {venuesLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>
            ) : venues.length === 0 ? (
              <div className="glass rounded-lg p-12 text-center border-2 border-black">
                <div className="text-5xl mb-4">🏢</div>
                <h3 className="font-display text-xl font-bold text-white mb-2">No venues yet</h3>
                <p className="text-slate-400 mb-6">Add your first sports venue to start receiving bookings.</p>
                <button onClick={() => setTab('add')} className="btn-primary">
                  <Plus className="w-4 h-4" /> Add Your First Venue
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {venues.map((venue) => (
                  <div key={venue.id} className="glass rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
                    <div className="relative h-36 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={venue.imageUrl} alt={venue.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                        <div>
                          <div className="text-white font-display font-bold">{venue.name}</div>
                          <div className="text-slate-300 text-xs">{getSportEmoji(venue.sport)} {venue.area}</div>
                        </div>
                        <div className={cn(
                          'text-xs font-bold px-2.5 py-1 rounded border-2 border-black shadow-[2px_2px_0px_#000]',
                          venue.available ? 'bg-emerald-400 text-black' : 'bg-rose-400 text-black'
                        )}>
                          {venue.available ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-cyan-400 font-bold">{formatCurrency(venue.price)}/hr</span>
                        <span className="text-slate-400 text-xs">{bookings.filter((b) => b.venueId === venue.id).length} bookings</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditingVenue(venue); setTab('venues'); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-800 border-2 border-black rounded-md text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all shadow-[2px_2px_0px_#000]"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleToggleAvailability(venue)}
                          disabled={togglingId === venue.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-800 border-2 border-black rounded-md text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all shadow-[2px_2px_0px_#000] disabled:opacity-50"
                        >
                          {togglingId === venue.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : venue.available ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {venue.available ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(venue.id)}
                          disabled={deletingId === venue.id}
                          className="w-10 flex items-center justify-center py-2 bg-rose-900/40 border-2 border-black rounded-md text-rose-400 hover:bg-rose-900/70 transition-all shadow-[2px_2px_0px_#000] disabled:opacity-50"
                        >
                          {deletingId === venue.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── EDIT VENUE (inline) ─────────────────────────────── */}
        {tab === 'venues' && editingVenue && (
          <div className="glass rounded-lg p-6 border-2 border-black shadow-[6px_6px_0px_0px_#000]">
            <h2 className="font-display font-bold text-white text-xl mb-6">Edit Venue: {editingVenue.name}</h2>
            <VenueForm
              mode="edit"
              initialData={editingVenue}
              onSubmit={handleEditVenue as Parameters<typeof VenueForm>[0]['onSubmit']}
              onCancel={() => setEditingVenue(null)}
            />
          </div>
        )}

        {/* ── TAB: ADD VENUE ──────────────────────────────────── */}
        {tab === 'add' && (
          <div className="glass rounded-lg p-6 border-2 border-black shadow-[6px_6px_0px_0px_#000]">
            <h2 className="font-display font-bold text-white text-xl mb-6">Add New Venue</h2>
            <VenueForm
              mode="add"
              onSubmit={handleAddVenue as Parameters<typeof VenueForm>[0]['onSubmit']}
              onCancel={() => setTab('venues')}
            />
          </div>
        )}

        {/* ── TAB: BOOKINGS ────────────────────────────────────── */}
        {tab === 'bookings' && (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="glass rounded-lg p-12 text-center border-2 border-black">
                <div className="text-5xl mb-4">📅</div>
                <h3 className="font-display text-xl font-bold text-white mb-2">No bookings yet</h3>
                <p className="text-slate-400">Bookings from players will appear here in real-time.</p>
              </div>
            ) : (
              bookings.map((b) => (
                <div key={b.id} className="glass rounded-lg p-5 border-2 border-black shadow-[3px_3px_0px_#000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl bg-slate-900 w-12 h-12 flex items-center justify-center rounded-md border border-black shadow-[2px_2px_0px_#000]">
                      {getSportEmoji(b.sport)}
                    </div>
                    <div>
                      <div className="font-display font-bold text-white">{b.venueName}</div>
                      <div className="text-slate-400 text-sm flex flex-wrap gap-2 mt-1">
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{b.playerName || 'Player'}</span>
                        <span>•</span>
                        <span>{formatDate(b.date)}</span>
                        <span>•</span>
                        <span>{b.slot}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Ticket className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-mono text-xs text-cyan-400 font-bold tracking-wider">{b.ticketNumber}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-auto">
                    <span className={cn(
                      'text-xs font-bold px-3 py-1.5 rounded-md border-2 border-black shadow-[2px_2px_0px_#000]',
                      b.status === 'upcoming' ? 'bg-cyan-400 text-black' :
                      b.status === 'completed' ? 'bg-emerald-400 text-black' : 'bg-rose-400 text-black'
                    )}>
                      {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                    </span>
                    <span className="font-bold text-white text-lg">{formatCurrency(b.price)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── TAB: ANALYTICS ────────────────────────────────────── */}
        {tab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {venues.map((v) => {
                const venueBookings = bookings.filter((b) => b.venueId === v.id && b.status !== 'cancelled');
                const revenue = venueBookings.reduce((s, b) => s + b.price, 0);
                const pct = venues.length > 0 ? Math.round((venueBookings.length / Math.max(bookings.filter(b => b.status !== 'cancelled').length, 1)) * 100) : 0;
                return (
                  <div key={v.id} className="glass rounded-lg p-5 border-2 border-black shadow-[4px_4px_0px_0px_#000]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-2xl">{getSportEmoji(v.sport)}</div>
                      <div>
                        <div className="font-display font-bold text-white text-sm">{v.name}</div>
                        <div className="text-slate-400 text-xs">{v.area}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Bookings</span>
                        <span className="font-bold text-white">{venueBookings.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Revenue</span>
                        <span className="font-bold text-emerald-400">{formatCurrency(revenue)}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 border border-black mt-2">
                        <div
                          className="bg-cyan-400 h-2 rounded-full border-r border-black"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-500 text-right">{pct}% of all bookings</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Revenue by sport */}
            <div className="glass rounded-lg p-6 border-2 border-black">
              <h2 className="font-display font-bold text-white text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" /> Revenue Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: 'text-emerald-400' },
                  { label: 'Upcoming Bookings', value: upcomingBookings.length, color: 'text-cyan-400' },
                  { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length, color: 'text-amber-400' },
                  { label: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, color: 'text-rose-400' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-slate-400 text-xs mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
