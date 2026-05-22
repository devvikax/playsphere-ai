import { Timestamp } from 'firebase/firestore';

export type Sport = 'badminton' | 'football' | 'swimming' | 'kabaddi';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'all';
export type BookingStatus = 'upcoming' | 'completed' | 'cancelled';
export type UserRole = 'user' | 'admin';
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
  createdAt?: Timestamp | Date;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  savedVenues: string[];
  role: UserRole;
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
