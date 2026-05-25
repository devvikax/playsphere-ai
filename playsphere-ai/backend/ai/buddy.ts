import { getApprovedVenues } from '@/backend/firebase/firestore';
import { callLLM, ChatMessage } from '@/backend/ai/llm';

export async function handleBuddyRequest(message: string, sport: string | undefined, history: { role: string; content: string }[]) {
  // ── LIVE FIRESTORE GROUNDING ───────────────────────────────────────────
  const liveVenues = await getApprovedVenues().catch(() => []);

  // Filter relevant venues for this sport if specified
  const relevantVenues = sport
    ? liveVenues.filter((v) => v.sport === sport)
    : liveVenues;

  const venueList = relevantVenues.slice(0, 8).map((v) => ({
    name: v.name,
    area: v.area,
    price: `₹${v.price}/hr`,
    skillLevel: v.skillLevel,
    amenities: v.amenities.slice(0, 3).join(', '),
    timings: `${v.timings?.open ?? 'N/A'} – ${v.timings?.close ?? 'N/A'}`,
  }));

  const systemContext = `You are AI Sports Buddy — a friendly, encouraging sports mentor for PlaySphere AI in Lucknow.

Your role:
- Help beginners get started with sports in Lucknow
- Provide practical tips, techniques, and guidance  
- Suggest appropriate venues based on skill level (from the real venue list below)
- Be motivating, friendly, and use simple language
- Keep advice relevant to Lucknow sports context

${sport ? `Sport focus: ${sport}` : 'General sports guidance'}

Available venues in Lucknow${sport ? ` for ${sport}` : ''} (${relevantVenues.length} venues):
${JSON.stringify(venueList, null, 2)}

Guidelines:
- For beginners: focus on basics, safety, and affordable options (afternoon slots save 15%)
- For intermediate: suggest improvement areas and appropriate venues  
- For groups: suggest turf/court sharing options
- Always mention: warm-up importance, hydration, and gradual progression
- Keep responses concise (3-5 bullet points or short paragraphs)
- Use emojis sparingly but effectively
- Only reference venues from the list above — never invent venue names`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemContext },
  ];

  // Include conversation history if provided
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
