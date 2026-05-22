'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { getAllVenues, updateVenue, deleteVenue } from '@/lib/firebase/firestore';
import { Venue } from '@/types';
import { formatCurrency, getSportEmoji } from '@/lib/utils';
import { Edit2, Trash2, Plus, Loader2, Search, Check, X } from 'lucide-react';

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (!loading && user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, loading, router]);

  useEffect(() => {
    if (isAdmin) {
      getAllVenues()
        .then((v) => {
          setVenues(v);
          setFetching(false);
        })
        .catch(() => setFetching(false));
    }
  }, [isAdmin]);

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      await updateVenue(id, { available: !currentStatus });
      setVenues(venues.map((v) => (v.id === id ? { ...v, available: !currentStatus } : v)));
    } catch (error) {
      console.error('Failed to update availability', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this venue?')) {
      try {
        await deleteVenue(id);
        setVenues(venues.filter((v) => v.id !== id));
      } catch (error) {
        console.error('Failed to delete venue', error);
      }
    }
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null; // Will redirect

  const filteredVenues = venues.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.area.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">
              Admin <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-slate-400">Manage venues and platform settings</p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Venue
          </button>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search venues..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div className="text-sm text-slate-400">
              Total Venues: <span className="text-white font-bold">{venues.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-white/5 text-slate-400 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-tl-xl">Venue</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 rounded-tr-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVenues.map((venue) => (
                  <tr key={venue.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl overflow-hidden relative">
                          <img src={venue.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                          <span className="relative z-10">{getSportEmoji(venue.sport)}</span>
                        </div>
                        <div>
                          <div className="font-bold text-white">{venue.name}</div>
                          <div className="text-xs text-slate-500 capitalize">{venue.sport}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">{venue.area}</td>
                    <td className="px-4 py-4 font-medium text-white">{formatCurrency(venue.price)}/hr</td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleAvailability(venue.id, venue.available)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                          venue.available
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                        }`}
                      >
                        {venue.available ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {venue.available ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-slate-400 hover:text-cyan-400 transition-colors bg-white/5 rounded-lg hover:bg-white/10">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(venue.id)}
                          className="p-2 text-slate-400 hover:text-red-400 transition-colors bg-white/5 rounded-lg hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredVenues.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No venues found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
