'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Bookmark, User, Bot, ArrowRight, X, Loader2, Zap } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getUserBookings, cancelBooking } from '@/lib/firebase/firestore';
import { LUCKNOW_VENUES } from '@/data/venues';
import { Booking } from '@/types';
import { formatCurrency, formatDate, getSportEmoji, cn } from '@/lib/utils';
import { AIConciergePreview } from '@/components/ai/AIConciergePreview';

type DashboardTab = 'bookings' | 'saved' | 'ai' | 'profile';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<DashboardTab>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getUserBookings(user.uid).then((b) => {
        setBookings(b);
        setBookingsLoading(false);
      }).catch(() => setBookingsLoading(false));
    }
  }, [user]);

  const handleCancel = async (bookingId: string) => {
    setCancelling(bookingId);
    try {
      await cancelBooking(bookingId);
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
    } finally {
      setCancelling(null);
    }
  };

  const upcoming = bookings.filter((b) => b.status === 'upcoming');
  const history = bookings.filter((b) => b.status !== 'upcoming');
  const savedVenueData = LUCKNOW_VENUES.filter((v) => profile?.savedVenues?.includes(v.id));

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const TABS: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
    { id: 'bookings', label: 'My Bookings', icon: <Calendar className="w-4 h-4" /> },
    { id: 'saved', label: 'Saved Venues', icon: <Bookmark className="w-4 h-4" /> },
    { id: 'ai', label: 'AI Concierge', icon: <Bot className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">
              Welcome back, <span className="gradient-text">{profile?.displayName?.split(' ')[0] || 'Player'}</span> 👋
            </h1>
            <p className="text-slate-400">{upcoming.length} upcoming bookings</p>
          </div>
          <Link href="/venues" className="btn-primary hidden md:flex">
            Book a Venue <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Upcoming', value: upcoming.length, color: 'text-cyan-400' },
            { label: 'Completed', value: history.filter((b) => b.status === 'completed').length, color: 'text-emerald-400' },
            { label: 'Cancelled', value: history.filter((b) => b.status === 'cancelled').length, color: 'text-red-400' },
            { label: 'Total Spent', value: `₹${bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.price, 0)}`, color: 'text-amber-400' },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-2xl p-4 text-center">
              <div className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-slate-400 text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all border',
                tab === t.id
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'glass border-white/10 text-slate-400 hover:text-white'
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'bookings' && (
          <div className="space-y-4">
            {bookingsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
            ) : bookings.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <div className="text-5xl mb-4">📅</div>
                <h3 className="font-display text-xl font-bold text-white mb-2">No bookings yet</h3>
                <p className="text-slate-400 mb-6">Start exploring venues and book your first session!</p>
                <Link href="/venues" className="btn-primary">Explore Venues</Link>
              </div>
            ) : (
              <>
                {upcoming.length > 0 && (
                  <div>
                    <h2 className="font-display font-bold text-white mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" /> Upcoming ({upcoming.length})
                    </h2>
                    {upcoming.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} onCancel={handleCancel} cancelling={cancelling} />
                    ))}
                  </div>
                )}
                {history.length > 0 && (
                  <div className="mt-6">
                    <h2 className="font-display font-bold text-slate-400 mb-3">History</h2>
                    {history.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} onCancel={handleCancel} cancelling={cancelling} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'saved' && (
          <div>
            {savedVenueData.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <div className="text-5xl mb-4">🔖</div>
                <h3 className="font-display text-xl font-bold text-white mb-2">No saved venues</h3>
                <p className="text-slate-400 mb-6">Bookmark venues while browsing to save them here</p>
                <Link href="/venues" className="btn-primary">Browse Venues</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {savedVenueData.map((v) => (
                  <Link key={v.id} href={`/venues/${v.id}`} className="glass rounded-2xl p-4 card-hover">
                    <img src={v.imageUrl} alt={v.name} className="w-full h-32 object-cover rounded-xl mb-3" />
                    <h3 className="font-display font-bold text-white">{v.name}</h3>
                    <p className="text-slate-400 text-sm">{v.area}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-cyan-400 font-bold">{formatCurrency(v.price)}/hr</span>
                      <span className="text-amber-400 text-sm">★ {v.rating}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'ai' && (
          <div className="max-w-2xl mx-auto">
            <AIConciergePreview />
          </div>
        )}

        {tab === 'profile' && (
          <div className="glass rounded-2xl p-8 max-w-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
                {profile?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'P'}
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-white">{profile?.displayName || 'Player'}</h2>
                <p className="text-slate-400">{user?.email}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-3 border-b border-white/5">
                <span className="text-slate-400">Account Type</span>
                <span className="text-white font-medium capitalize">{profile?.role || 'user'}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/5">
                <span className="text-slate-400">Total Bookings</span>
                <span className="text-white font-medium">{bookings.length}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-slate-400">Saved Venues</span>
                <span className="text-white font-medium">{profile?.savedVenues?.length || 0}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  onCancel,
  cancelling,
}: {
  booking: Booking;
  onCancel: (id: string) => void;
  cancelling: string | null;
}) {
  const statusColors: Record<string, string> = {
    upcoming: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    cancelled: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="glass rounded-2xl p-5 mb-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1">
        <div className="text-3xl">{getSportEmoji(booking.sport)}</div>
        <div>
          <h3 className="font-display font-bold text-white">{booking.venueName}</h3>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-400">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{booking.venueArea}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(booking.date)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{booking.slot}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className={cn('text-xs font-semibold px-3 py-1 rounded-full border', statusColors[booking.status])}>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </span>
        <span className="font-bold text-white">{formatCurrency(booking.price)}</span>
        {booking.status === 'upcoming' && (
          <button
            onClick={() => onCancel(booking.id)}
            disabled={cancelling === booking.id}
            className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
          >
            {cancelling === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
