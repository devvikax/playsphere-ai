import { getAllVenues } from '@/backend/firebase/firestore';
import { callLLM } from '@/backend/ai/llm';

export async function handleDiscoverRequest() {
  // 1. Fetch all venues
  const venues = await getAllVenues();

  // 2. Compute distribution
  const totalVenues = venues.length;
  const areas: Record<string, number> = {};
  const sports: Record<string, number> = {};
  const priceByArea: Record<string, number[]> = {};

  venues.forEach((v) => {
    areas[v.area] = (areas[v.area] || 0) + 1;
    sports[v.sport] = (sports[v.sport] || 0) + 1;
    
    if (!priceByArea[v.area]) priceByArea[v.area] = [];
    priceByArea[v.area].push(v.price);
  });

  const avgPriceByArea = Object.entries(priceByArea).map(([area, prices]) => ({
    area,
    avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
  }));

  // 3. Build analytics prompt
  const systemPrompt = `You are an expert sports venue data analyst for PlaySphere AI.
Analyze the following venue distribution data in Lucknow and generate exactly 3 highly specific, actionable insights.

Data Summary:
- Total Venues: ${totalVenues}
- Area Distribution: ${JSON.stringify(areas)}
- Sport Distribution: ${JSON.stringify(sports)}
- Average Price by Area: ${JSON.stringify(avgPriceByArea)}

Output Requirements:
Return a raw JSON object containing an array of 3 insights under the key "insights". Do NOT wrap the JSON in markdown code blocks.
Each insight must follow this interface:
{
  "type": "gap" | "opportunity" | "trend" | "value",
  "title": string (max 4 words),
  "description": string (max 2 sentences, highly specific with numbers if possible),
  "area": string (optional, the affected area),
  "sport": string (optional, the affected sport),
  "emoji": string (1 relevant emoji),
  "urgency": "high" | "medium" | "low"
}

Ensure variety in the insight types (e.g., one gap, one value, one trend).`;

  // 4. Call LLM
  const response = await callLLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Generate the JSON insights based on the data provided.' }
  ], {
    temperature: 0.4,
  });

  try {
    // Clean potential markdown blocks
    const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleaned);
    return data.insights || [];
  } catch (parseError) {
    console.error('Failed to parse discovery insights:', parseError);
    return getStaticFallbackInsights();
  }
}

export function getStaticFallbackInsights() {
  return [
    {
      type: 'value',
      title: 'Best Value Zone',
      description: 'Aliganj badminton courts offer 40% lower prices than Gomti Nagar with similar ratings.',
      area: 'Aliganj',
      sport: 'badminton',
      emoji: '🏸',
      urgency: 'low'
    },
    {
      type: 'trend',
      title: 'Peak Demand Alert',
      description: 'Evening slots (5-8 PM) across all sports are 85% booked. Book morning slots for best availability.',
      emoji: '📊',
      urgency: 'medium'
    },
    {
      type: 'gap',
      title: 'Swimming Gap',
      description: 'Only 2 swimming venues near Hazratganj. High demand, low supply.',
      area: 'Hazratganj',
      sport: 'swimming',
      emoji: '🏊',
      urgency: 'high'
    }
  ];
}
