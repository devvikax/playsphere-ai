import Link from 'next/link';
import { ArrowRight, Bot, MapPin, Star, Zap, ChevronRight, Shield, Clock, TrendingUp } from 'lucide-react';
import { LUCKNOW_VENUES, SPORTS_LIST } from '@/data/venues';
import { VenueCard } from '@/components/venue/VenueCard';
import { AIConciergePreview } from '@/components/ai/AIConciergePreview';

export default function HomePage() {
  const featuredVenues = LUCKNOW_VENUES.filter((v) => v.rating >= 4.7).slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* ── HERO SECTION ─────────────────────────────────────── */}
      <section className="relative hero-gradient pt-24 pb-20 px-4 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="absolute top-40 right-10 w-2 h-2 bg-cyan-400 rounded-full animate-float" />
          <div className="absolute top-60 left-16 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-40 right-20 w-2 h-2 bg-pink-400 rounded-full animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 border border-cyan-500/20">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-medium text-cyan-400 tracking-wide">APL Qualifiers 2026 — Team DeepStack</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
            Find Your Perfect
            <br />
            <span className="gradient-text">Sports Venue</span>
            <br />
            <span className="text-white">with AI</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover and book badminton courts, football turfs, swimming pools, and akharas across{' '}
            <span className="text-cyan-400 font-medium">Lucknow</span> with smart AI recommendations.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/venues" className="btn-primary text-base px-8 py-4 rounded-xl">
              Explore Venues <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/#ai-concierge" className="btn-secondary text-base px-8 py-4 rounded-xl">
              <Bot className="w-5 h-5" /> Ask AI Concierge
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { value: '15+', label: 'Venues' },
              { value: '4', label: 'Sports' },
              { value: 'AI', label: 'Powered' },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-2xl p-4 text-center">
                <div className="font-display text-2xl font-bold gradient-text">{stat.value}</div>
                <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              How <span className="gradient-text">PlaySphere AI</span> Works
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">From intent to booking in seconds, powered by AI</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: Bot, title: 'Describe in Natural Language', desc: '"Beginner badminton near Gomti Nagar under ₹300"', color: 'text-cyan-400', num: '01' },
              { icon: Zap, title: 'AI Analyzes & Recommends', desc: 'Gemini understands your intent and finds the best match', color: 'text-indigo-400', num: '02' },
              { icon: MapPin, title: 'Explore on Map', desc: 'See venues pinned on Google Maps with distances', color: 'text-pink-400', num: '03' },
              { icon: Shield, title: 'Book Instantly', desc: 'Select your time slot and confirm your booking', color: 'text-emerald-400', num: '04' },
            ].map((step) => (
              <div key={step.num} className="relative glass rounded-2xl p-6 card-hover">
                <div className="text-4xl font-display font-bold text-white/5 absolute top-4 right-4">{step.num}</div>
                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${step.color}`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPORTS CATEGORIES ─────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Sports We <span className="gradient-text">Cover</span>
            </h2>
            <p className="text-slate-400">Every sport, every level, every budget</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SPORTS_LIST.map((sport) => (
              <Link
                key={sport.value}
                href={`/venues?sport=${sport.value}`}
                className="glass rounded-2xl p-6 text-center card-hover group cursor-pointer"
              >
                <div className={`text-5xl mb-4 transform group-hover:scale-110 transition-transform`}>
                  {sport.emoji}
                </div>
                <h3 className="font-display font-bold text-white mb-1">{sport.label}</h3>
                <div className={`h-1 rounded-full bg-gradient-to-r ${sport.color} mt-3 opacity-60 group-hover:opacity-100 transition-opacity`} />
                <div className="mt-2 text-xs text-slate-400 flex items-center justify-center gap-1 group-hover:text-cyan-400 transition-colors">
                  Explore <ChevronRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED VENUES ──────────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
                Top Rated <span className="gradient-text">Venues</span>
              </h2>
              <p className="text-slate-400">Highest rated sports facilities in Lucknow</p>
            </div>
            <Link href="/venues" className="btn-secondary text-sm hidden md:flex">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link href="/venues" className="btn-secondary">
              View All Venues <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── AI CONCIERGE PREVIEW ─────────────────────────────── */}
      <section id="ai-concierge" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 mb-6">
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs text-indigo-400 font-medium">Powered by Gemini 2.5</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                Meet Your AI
                <br />
                <span className="gradient-text">Sports Concierge</span>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                Just describe what you want in plain English. Our AI understands your intent, considers your budget, skill level, and location — then recommends the perfect venue with a clear explanation.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  '"Beginner badminton near Gomti Nagar under ₹300"',
                  '"Football turf for 10 friends this weekend"',
                  '"Cheapest swimming pool near Hazratganj"',
                ].map((example) => (
                  <div key={example} className="flex items-center gap-3 glass rounded-xl px-4 py-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                    <span className="text-slate-300 text-sm italic">{example}</span>
                  </div>
                ))}
              </div>
              <Link href="/#ai-concierge" className="btn-primary">
                Try AI Concierge <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div>
              <AIConciergePreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── PEAK PRICING CALLOUT ─────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="glass rounded-3xl p-8 md:p-12 border border-amber-500/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-amber-500/10 border border-amber-500/20 mb-4">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs text-amber-400 font-medium">Smart Pricing</span>
                </div>
                <h2 className="font-display text-3xl font-bold mb-4">
                  <span className="text-white">Save up to </span>
                  <span className="gradient-text-sport">15%</span>
                  <br /><span className="text-white">with smart timing</span>
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  Our AI knows when prices are lowest. Book afternoon slots to save significantly over peak evening rates.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Morning', time: '5–8 AM', icon: '🌅', price: 'Normal', color: 'border-blue-500/30' },
                  { label: 'Afternoon', time: '11 AM–4 PM', icon: '☀️', price: '15% Off', color: 'border-emerald-500/30', badge: 'BEST VALUE' },
                  { label: 'Evening', time: '5–10 PM', icon: '🌆', price: '+30%', color: 'border-red-500/30', badge: 'PEAK' },
                ].map((slot) => (
                  <div key={slot.label} className={`glass rounded-2xl p-4 text-center border ${slot.color}`}>
                    {slot.badge && (
                      <div className={`text-xs font-bold mb-2 ${slot.badge === 'BEST VALUE' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {slot.badge}
                      </div>
                    )}
                    <div className="text-2xl mb-2">{slot.icon}</div>
                    <div className="font-display font-semibold text-white text-sm">{slot.label}</div>
                    <div className="text-xs text-slate-500 mt-1">{slot.time}</div>
                    <div className={`text-sm font-bold mt-2 ${slot.badge === 'BEST VALUE' ? 'text-emerald-400' : slot.badge === 'PEAK' ? 'text-red-400' : 'text-slate-300'}`}>
                      {slot.price}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST / TESTIMONIALS ─────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-bold mb-4">
              Loved by <span className="gradient-text">Athletes</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Arjun Sharma', sport: 'Badminton Player', text: 'Found the perfect court in Gomti Nagar in seconds. The AI knew exactly what I needed — beginner-friendly and under budget!', rating: 5 },
              { name: 'Priya Gupta', sport: 'Football Enthusiast', text: 'Organized a 10-person football session with one AI query. The turf was exactly as described. Amazing experience!', rating: 5 },
              { name: 'Rahul Verma', sport: 'Swimming Learner', text: 'As a complete beginner, the AI Sports Buddy gave me tips I never expected. Now I swim 3x a week!', rating: 5 },
            ].map((review) => (
              <div key={review.name} className="glass rounded-2xl p-6 card-hover">
                <div className="flex text-amber-400 mb-4">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4 italic">"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                    {review.name[0]}
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">{review.name}</div>
                    <div className="text-slate-500 text-xs">{review.sport}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ──────────────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-900/30">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass rounded-3xl p-12 border border-cyan-500/10">
            <div className="text-5xl mb-6">🏆</div>
            <h2 className="font-display text-4xl font-bold mb-4">
              Ready to <span className="gradient-text">Play?</span>
            </h2>
            <p className="text-slate-400 mb-8 text-lg">
              Join the revolution in sports facility discovery. Your next great game starts here.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup" className="btn-primary text-base px-10 py-4">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/venues" className="btn-secondary text-base px-10 py-4">
                <MapPin className="w-5 h-5" /> Browse Venues
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
