'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, Map, LayoutGrid, Loader2, Bot } from 'lucide-react';
import { LUCKNOW_VENUES, SPORTS_LIST, SPORTS_AREAS } from '@/data/venues';
import { VenueCard } from '@/components/venue/VenueCard';
import { AIConciergePreview } from '@/components/ai/AIConciergePreview';
import { Venue, VenueFilters, Sport, SkillLevel } from '@/types';

function VenuesContent() {
  const searchParams = useSearchParams();
  const [venues, setVenues] = useState<Venue[]>(LUCKNOW_VENUES);
  const [filters, setFilters] = useState<VenueFilters>({
    sport: (searchParams.get('sport') as Sport) || '',
    area: '',
    maxPrice: 2000,
    skillLevel: '',
    searchQuery: '',
  });
  const [view, setView] = useState<'grid' | 'ai'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let filtered = [...LUCKNOW_VENUES];

    if (filters.sport) filtered = filtered.filter((v) => v.sport === filters.sport);
    if (filters.area) filtered = filtered.filter((v) => v.area === filters.area);
    if (filters.maxPrice) filtered = filtered.filter((v) => v.price <= filters.maxPrice!);
    if (filters.skillLevel) filtered = filtered.filter((v) => v.skillLevel === filters.skillLevel || v.skillLevel === 'all');
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) => v.name.toLowerCase().includes(q) || v.area.toLowerCase().includes(q) || v.description.toLowerCase().includes(q)
      );
    }

    setVenues(filtered);
  }, [filters]);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Discover <span className="gradient-text">Venues</span>
          </h1>
          <p className="text-slate-400">
            {venues.length} venues found across Lucknow
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search venues, areas, or sports..."
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters((f) => ({ ...f, searchQuery: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary px-4 py-3 ${showFilters ? 'border-cyan-500/50 text-cyan-400' : ''}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <div className="flex glass rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => setView('grid')}
              className={`px-3 py-3 transition-colors ${view === 'grid' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('ai')}
              className={`px-3 py-3 transition-colors ${view === 'ai' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white'}`}
            >
              <Bot className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="glass rounded-2xl p-6 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Sport Filter */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Sport</label>
              <select
                value={filters.sport || ''}
                onChange={(e) => setFilters((f) => ({ ...f, sport: e.target.value as Sport | '' }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="">All Sports</option>
                {SPORTS_LIST.map((s) => (
                  <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>
                ))}
              </select>
            </div>

            {/* Area Filter */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Area</label>
              <select
                value={filters.area || ''}
                onChange={(e) => setFilters((f) => ({ ...f, area: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="">All Areas</option>
                {SPORTS_AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Skill Level Filter */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Skill Level</label>
              <select
                value={filters.skillLevel || ''}
                onChange={(e) => setFilters((f) => ({ ...f, skillLevel: e.target.value as SkillLevel | '' }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Max Price Filter */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                Max Price: ₹{filters.maxPrice}
              </label>
              <input
                type="range"
                min={100}
                max={2000}
                step={50}
                value={filters.maxPrice}
                onChange={(e) => setFilters((f) => ({ ...f, maxPrice: Number(e.target.value) }))}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Reset */}
            <div className="col-span-2 md:col-span-4 flex justify-end">
              <button
                onClick={() => setFilters({ sport: '', area: '', maxPrice: 2000, skillLevel: '', searchQuery: '' })}
                className="text-sm text-slate-400 hover:text-red-400 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* Sport Quick Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide pb-2">
          <button
            onClick={() => setFilters((f) => ({ ...f, sport: '' }))}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border ${!filters.sport ? 'bg-cyan-500 text-white border-transparent' : 'glass text-slate-300 border-white/10 hover:border-cyan-500/30'}`}
          >
            All
          </button>
          {SPORTS_LIST.map((sport) => (
            <button
              key={sport.value}
              onClick={() => setFilters((f) => ({ ...f, sport: f.sport === sport.value ? '' : sport.value as Sport }))}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border flex items-center gap-1.5 ${filters.sport === sport.value ? `bg-gradient-to-r ${sport.color} text-white border-transparent` : 'glass text-slate-300 border-white/10 hover:border-white/20'}`}
            >
              {sport.emoji} {sport.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {view === 'grid' ? (
          venues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-display text-xl font-bold text-white mb-2">No venues found</h3>
              <p className="text-slate-400">Try adjusting your filters or use the AI Concierge for smart recommendations</p>
              <button onClick={() => setView('ai')} className="btn-primary mt-4">
                <Bot className="w-4 h-4" /> Ask AI Concierge
              </button>
            </div>
          )
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="font-display text-2xl font-bold mb-2">
                <span className="gradient-text">AI Concierge</span>
              </h2>
              <p className="text-slate-400 text-sm">Describe what you&apos;re looking for in natural language</p>
            </div>
            <AIConciergePreview />
          </div>
        )}
      </div>
    </div>
  );
}

export default function VenuesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    }>
      <VenuesContent />
    </Suspense>
  );
}
