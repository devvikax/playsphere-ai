import Link from 'next/link';
import { Zap, Github, Twitter, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-display font-bold text-xl mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="gradient-text">PlaySphere AI</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              AI-powered sports venue discovery and booking for Lucknow. Find your perfect game, anytime.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="text-slate-500 hover:text-cyan-400 transition-colors"><Github className="w-5 h-5" /></a>
              <a href="#" className="text-slate-500 hover:text-cyan-400 transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-slate-500 hover:text-cyan-400 transition-colors"><Instagram className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 font-display">Platform</h4>
            <ul className="space-y-2">
              {['Discover Venues', 'AI Concierge', 'Map View', 'Bookings'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 font-display">Sports</h4>
            <ul className="space-y-2">
              {['🏸 Badminton', '⚽ Football', '🏊 Swimming', '🤼 Kabaddi'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © 2026 PlaySphere AI — Built by <span className="text-cyan-400">Team DeepStack</span> for APL Qualifiers
          </p>
          <p className="text-slate-600 text-xs">
            Powered by Google Gemini 2.5 · Firebase · Next.js
          </p>
        </div>
      </div>
    </footer>
  );
}
