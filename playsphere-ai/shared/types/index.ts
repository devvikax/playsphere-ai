import { Timestamp } from 'firebase/firestore';

export type Sport = 'badminton' | 'football' | 'swimming' | 'kabaddi';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'all';
export type BookingStatus = 'upcoming' | 'completed' | 'cancelled';
export type UserRole = 'player' | 'owner' | 'admin';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type VenueSource = 'seed' | 'owner';
export type PriceSlot = 'morning' | 'afternoon' | 'evening';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PeakPricing {
  morning: number;
  afternoon: number;
  evening: number;
}

export interface Timings {
  open: string;
  close: string;
}

export interface Venue {
  id: string;
  name: string;
  sport: Sport;
  area: string;
  address: string;
  coordinates: Coordinates;
  price: number;
  rating: number;
  reviewCount: number;
  amenities: string[];
  skillLevel: SkillLevel;
  timings: Timings;
  description: string;
  imageUrl: string;
  category: string;
  peakPricing: PeakPricing;
  available: boolean;
  // v3.0 owner/marketplace fields
  ownerId: string;           // 'system' for seed venues, uid for owner-added
  source: VenueSource;       // 'seed' | 'owner'
  approvalStatus: ApprovalStatus; // always 'approved' for now (owner approval is per-owner, not per-venue)
  tags?: string[];           // optional feature tags
  createdAt?: Timestamp | Date;
}

export interface Booking {
  id: string;
  userId: string;
  venueId: string;
  venueName: string;
  venueArea: string;
  sport: Sport;
  date: string;
  slot: string;
  price: number;
  status: BookingStatus;
  ticketNumber: string;     // v3.0: e.g. "PS-BAD-2026-1042"
  playerName?: string;      // denormalized for owner view
  playerEmail?: string;     // denormalized for owner view
  createdAt?: Timestamp | Date;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  savedVenues: string[];
  role: UserRole;                    // v3.0: 'player' | 'owner' | 'admin'
  approvalStatus?: ApprovalStatus;   // v3.0: only relevant for owners
  createdAt?: Timestamp | Date;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface VenueFilters {
  sport?: Sport | '';
  area?: string;
  minPrice?: number;
  maxPrice?: number;
  skillLevel?: SkillLevel | '';
  amenities?: string[];
  minRating?: number;
  searchQuery?: string;
}

export interface TimeSlot {
  time: string;
  label: string;
  priceMultiplier: number;
  available: boolean;
}
