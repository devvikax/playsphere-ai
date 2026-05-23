import { NextRequest, NextResponse } from 'next/server';
import { LUCKNOW_VENUES } from '@/data/venues';
import { callLLM, ChatMessage } from '@/lib/ai/llm';

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Format venue data for Gemini context
    const venueContext = LUCKNOW_VENUES.map((v) => ({
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
      timings: v.timings,
    }));

    const systemPrompt = `You are PlaySphere AI — an intelligent sports concierge for Lucknow, India.

You have access to the following sports venues database:
${JSON.stringify(venueContext, null, 2)}

Your job:
1. Understand the user's intent (sport, location, budget, skill level, timing preference)
2. Filter and recommend the BEST matching venues from the database
3. Explain WHY you recommend each venue (be specific: price, skill level, amenities, location)
4. If a venue is unavailable (available: false), suggest the nearest alternative
5. Factor in peak pricing: Morning (5-8 AM) = normal, Afternoon (11-4 PM) = 15% cheaper, Evening (5-10 PM) = 30% more expensive
6. Be conversational, helpful, and enthusiastic about sports

Response format:
- Start with a brief acknowledgment of their request
- Give 1-3 venue recommendations with names and reasons
- Mention pricing insights (best time to book for savings)
- End with a helpful tip or next step

Keep responses concise but informative. Be like a knowledgeable local friend who loves sports.

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

    return NextResponse.json({ response });
  } catch (error) {
    console.error('LLM API error:', error);
    return NextResponse.json(
      { error: 'AI service temporarily unavailable. Please try again.' },
      { status: 500 }
    );
  }
}
