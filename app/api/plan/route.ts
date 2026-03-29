import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { tasks, startTime, endTime, energy } = await req.json();
  console.log("API hit ✓", { tasks, startTime, endTime, energy });

  const prompt = `You are a productivity coach. Create a time-blocked daily schedule.

Tasks: ${tasks}
Available hours: ${startTime} to ${endTime}
Energy level: ${energy}

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "time": "9:00 AM",
    "duration": "90 min",
    "task": "task name here",
    "reason": "why this task is scheduled at this time"
  }
]`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 },
      }),
    },
  );

  const data = await response.json();
  console.log("Gemini raw response:", JSON.stringify(data, null, 2));
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
  console.log("Raw text from Gemini:", raw); // ← and this
  const clean = raw.replace(/```json|```/g, "").trim();
  console.log("Cleaned JSON string:", clean); // ← and this

  try {
    const schedule = JSON.parse(clean);
    console.log("Parsed schedule:", schedule);
    return NextResponse.json({ schedule });
  } catch {
    return NextResponse.json(
      { error: "Failed to parse schedule" },
      { status: 500 },
    );
  }
}
