# Phase 4: Admin Removal + AI Venue Discovery

> **Status**: ⬜ Not Started
> **Objective**: Delete the entire admin system. Replace it with an AI-powered Venue Discovery feature that shows intelligent insights about venue distribution, underserved areas, and sports demand gaps.

---

## Part A: Admin System Removal

### Files to DELETE entirely
- `app/admin/page.tsx` — entire admin panel UI
- All admin imports from `Navbar.tsx` (admin link, admin badge)
- `updateUserRole()` in `lib/firebase/firestore.ts`
- Admin route from `middleware.ts`

### Files to MODIFY
| File | Change |
|------|--------|
| `middleware.ts` | Remove `/admin` from `ADMIN_ROUTES` array |
| `components/layout/Navbar.tsx` | Remove "Admin" nav link, admin role check |
| `lib/firebase/firestore.ts` | Remove `updateUserRole()` function |
| `types/index.ts` | Remove or simplify `UserRole` type (keep only `'user'`) |

### Navbar Admin Link Removal
```typescript
// REMOVE: Any conditional admin link like:
{isAdmin && <Link href="/admin">Admin</Link>}
```

---

## Part B: AI Venue Discovery Feature

### Concept
Instead of a manual admin adding venues, the AI analyzes the existing venue distribution and surfaces intelligent insights — areas with few venues, sports that are underrepresented, best times to visit, emerging venue opportunities.

### Example Insight Cards
```
🏊 Swimming Gap — Only 2 swimming venues near Hazratganj. 
   High demand, low supply. Consider Shyam Lal Sports Complex.

⚽ Football Opportunity — Gomti Nagar Extension has 8k residents 
   but only 1 football turf. 3 nearby areas have high search volume.

🏸 Best Value Zone — Aliganj badminton courts offer 40% lower prices
   than Gomti Nagar with similar ratings.

📊 Peak Demand Alert — Evening slots (5-8 PM) across all sports 
   are 85% booked. Book morning slots for best availability.
```

### New Files

#### `app/api/ai/discover/route.ts`
```typescript
// POST endpoint
// 1. Query Firestore for all venues
// 2. Compute distribution: venues per area, sports per area, avg price per area
// 3. Build analytics prompt with distribution data
// 4. Call LLM (same callLLM() from lib/ai/llm.ts)
// 5. Return { insights: DiscoveryInsight[] }

interface DiscoveryInsight {
  type: 'gap' | 'opportunity' | 'trend' | 'value';
  title: string;
  description: string;
  area?: string;
  sport?: string;
  emoji: string;
  urgency: 'high' | 'medium' | 'low';
}
```

#### `components/ai/VenueDiscoveryInsights.tsx`
```typescript
// Client component
// Fetches from /api/ai/discover on mount
// Renders 3-4 insight cards in a horizontal scrollable row
// Neo-brutalist card design: thick border, flat shadow, color-coded by type
// Loading skeleton while fetching
// "Refresh Insights" button
```

### Integration Points
- **Landing page** (`app/page.tsx`): Add a "AI Discovery" section above the venue grid
- **Venues page** (`app/venues/page.tsx`): Add insights panel above the venue list
- Discovery cards should link to the venues page with pre-filled filters

---

## Design: Insight Card (Neo-brutalist)

```
┌─────────────────────────────────────────┐ ← thick black border
│ 🏊  Swimming Gap                        │
│ ────────────────────────────────────── │
│ Only 2 venues near Hazratganj.          │
│ High demand, low supply.                │
│                                         │
│ [Explore Swimming →]  🔴 HIGH           │
└─────────────────────────────────────────┘
  ↑ 5px flat bottom-right black shadow
```

Color by type:
- `gap` → `bg-rose-400` header
- `opportunity` → `bg-emerald-400` header
- `trend` → `bg-amber-400` header  
- `value` → `bg-cyan-400` header

---

## Verification

- [ ] `/admin` returns 404 (deleted)
- [ ] No admin links appear in Navbar for any user
- [ ] Discovery insights load on the landing page and venues page
- [ ] Insight cards are visually distinct and correctly typed
- [ ] Clicking an insight card navigates to venues with relevant filter
- [ ] Insight refresh button works
- [ ] Discovery API gracefully handles LLM being unavailable (static fallback insights)
