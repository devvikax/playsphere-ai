'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, Clock, Bookmark, BookmarkCheck, ArrowRight } from 'lucide-react';
import { Venue } from '@/types';
import { cn, formatCurrency, getSportEmoji, getSportColor, getSkillBadgeColor } from '@/lib/utils';
import { useState } from 'react';

interface VenueCardProps {
  venue: Venue;
  className?: string;
}

export function VenueCard({ venue, className }: VenueCardProps) {
  const [saved, setSaved] = useState(false);
  const sportColor = getSportColor(venue.sport);

  return (
    <div className={cn('glass rounded-2xl overflow-hidden card-hover group', className)}>
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-slate-800">
        <img
          src={venue.imageUrl}
          alt={venue.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Sport badge */}
        <div className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r ${sportColor}`}>
          {getSportEmoji(venue.sport)} {venue.sport.charAt(0).toUpperCase() + venue.sport.slice(1)}
        </div>
        {/* Availability */}
        {!venue.available && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold text-sm bg-red-500 px-3 py-1 rounded-full">Unavailable</span>
          </div>
        )}
        {/* Save button */}
        <button
          onClick={(e) => { e.preventDefault(); setSaved(!saved); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full glass flex items-center justify-center text-white hover:text-cyan-400 transition-colors"
        >
          {saved ? <BookmarkCheck className="w-4 h-4 text-cyan-400" /> : <Bookmark className="w-4 h-4" />}
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-display font-bold text-white text-base leading-tight flex-1 pr-2">{venue.name}</h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-amber-400 text-sm font-semibold">{venue.rating}</span>
            <span className="text-slate-500 text-xs">({venue.reviewCount})</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400 text-sm mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{venue.area}</span>
        </div>

        {/* Skill level badge */}
        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', getSkillBadgeColor(venue.skillLevel))}>
          {venue.skillLevel === 'all' ? 'All Levels' : venue.skillLevel.charAt(0).toUpperCase() + venue.skillLevel.slice(1)}
        </span>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
          {venue.amenities.slice(0, 3).map((amenity) => (
            <span key={amenity} className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded-md">
              {amenity}
            </span>
          ))}
          {venue.amenities.length > 3 && (
            <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-md">
              +{venue.amenities.length - 3}
            </span>
          )}
        </div>

        {/* Footer: price + CTA */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-display font-bold text-white">{formatCurrency(venue.price)}</span>
            <span className="text-slate-500 text-xs ml-1">/hr</span>
          </div>
          <Link
            href={`/venues/${venue.id}`}
            className={cn(
              'flex items-center gap-1.5 text-sm font-semibold transition-colors',
              venue.available
                ? 'text-cyan-400 hover:text-cyan-300'
                : 'text-slate-500 pointer-events-none'
            )}
          >
            {venue.available ? 'Book Now' : 'Unavailable'}
            {venue.available && <ArrowRight className="w-3.5 h-3.5" />}
          </Link>
        </div>
      </div>
    </div>
  );
}
