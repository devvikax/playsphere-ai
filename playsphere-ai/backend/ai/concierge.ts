import { getApprovedVenues } from '@/backend/firebase/firestore';
import { callLLM, ChatMessage } from '@/backend/ai/llm';

export async function handleConciergeRequest(message: string, history: { role: string; content: string }[]) {
  // ── LIVE FIRESTORE GROUNDING ───────────────────────────────────────────
  // Firestore is the single source of truth. No static fallback.
  // If there are no venues, we inform the AI so it can respond honestly.
  const liveVenues = await getApprovedVenues().catch(() => []);

  const venueContext = liveVenues.map((v) => ({
    id: v.id,
    name: v.name,
    sport: v.sport,
    area: v.area,
    price: v.price,
    rating: v.rating,
    skillLevel: v.skillLevel,
    amenities: v.amenities,
    available: v.available,
    description: v.description,
    timings: `${v.timings?.open ?? 'N/A'} – ${v.timings?.close ?? 'N/A'}`,
  }));

  const noVenuesMessage = venueContext.length === 0
    ? `\n\nIMPORTANT: There are currently NO venues listed on the platform. Politely inform the user that PlaySphere AI is a new marketplace and venue owners are still onboarding. Encourage them to check back soon or suggest they sign up as a venue owner if they have a sports facility.`
    : '';

  const systemPrompt = `You are PlaySphere AI — an intelligent sports concierge for Lucknow, India.

You have access to the following LIVE sports venues database (${venueContext.length} venues, sourced in real-time from Firestore):
${venueContext.length > 0 ? JSON.stringify(venueContext, null, 2) : '[]'}
${noVenuesMessage}

Your job:
1. Understand the user's intent (sport, location, budget, skill level, timing preference)
2. Filter and recommend the BEST matching venues from the database ABOVE ONLY — never invent venues
3. Explain WHY you recommend each venue (be specific: price, skill level, amenities, location)
4. If a venue is unavailable (available: false), suggest the nearest alternative from the list
5. Factor in peak pricing: Morning (5-8 AM) = normal, Afternoon (11-4 PM) = 15% cheaper, Evening (5-10 PM) = 30% more expensive
6. Be conversational, helpful, and enthusiastic about sports

Response format:
- Start with a brief acknowledgment of their request
- Give 1-3 venue recommendations with names and reasons
- Mention pricing insights (best time to book for savings)
- End with a helpful tip or next step

Keep responses concise but informative. Be like a knowledgeable local friend who loves sports.
IMPORTANT: Only recommend venues from the database provided above. Never hallucinate venue names.
All prices are in Indian Rupees (₹). Lucknow areas include: Gomti Nagar, Gomti Nagar Extension, Aliganj, Hazratganj, Indira Nagar, Chowk, Ashiyana, Sultanpur Road, Aishbagh.`;

  // Build chat with history in OpenAI format
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'assistant', content: 'I\'m PlaySphere AI, your sports concierge for Lucknow! I can help you find and book the perfect sports facility. What sport are you looking for, and do you have any preferences on location or budget?' }
  ];

  if (history && Array.isArray(history)) {
    history.forEach((msg: { role: string; content: string }) => {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      });
    });
  }

  messages.push({ role: 'user', content: message });

  const response = await callLLM(messages);
  return response;
}
