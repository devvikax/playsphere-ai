import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { message, sport } = await req.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const systemContext = `You are AI Sports Buddy — a friendly, encouraging sports mentor for PlaySphere AI.

Your role:
- Help beginners get started with sports in Lucknow
- Provide practical tips, techniques, and guidance
- Suggest appropriate venues and timing based on skill level
- Be motivating, friendly, and use simple language
- Keep advice relevant to Lucknow sports context

Sports context: ${sport ? `The user is interested in ${sport}` : 'General sports guidance'}

Guidelines:
- For beginners: focus on basics, safety, and affordable options (afternoon slots save 15%)
- For intermediate: suggest improvement areas and appropriate venues
- For groups: suggest turf/court sharing options
- Always mention: warm-up importance, hydration, and gradual progression
- Keep responses concise (3-5 bullet points or short paragraphs)
- Use emojis sparingly but effectively`;

    const result = await model.generateContent(`${systemContext}\n\nUser says: ${message}`);
    const response = result.response.text();

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Sports Buddy API error:', error);
    return NextResponse.json(
      { error: 'AI service temporarily unavailable.' },
      { status: 500 }
    );
  }
}
