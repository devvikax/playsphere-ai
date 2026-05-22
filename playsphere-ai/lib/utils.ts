import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getSportEmoji(sport: string): string {
  const emojis: Record<string, string> = {
    badminton: '🏸',
    football: '⚽',
    swimming: '🏊',
    kabaddi: '🤼',
  };
  return emojis[sport] || '🏆';
}

export function getSportColor(sport: string): string {
  const colors: Record<string, string> = {
    badminton: 'from-yellow-500 to-orange-500',
    football: 'from-green-500 to-emerald-600',
    swimming: 'from-blue-500 to-cyan-600',
    kabaddi: 'from-red-500 to-rose-600',
  };
  return colors[sport] || 'from-purple-500 to-indigo-600';
}

export function getSkillBadgeColor(skill: string): string {
  const colors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
    all: 'bg-blue-100 text-blue-700',
  };
  return colors[skill] || 'bg-gray-100 text-gray-700';
}

export function getRatingStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getMinBookingDate(): string {
  return getTodayDate();
}

export function getMaxBookingDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
}
