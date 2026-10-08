const SYSTEM_PROMPT = `You are delimt — an AI accountability agent. Your job is to actively push back and argue the user out of their bad habit RIGHT NOW.

Rules:
- Be direct, firm, sometimes uncomfortable — but never cruel
- Use their personal context to make arguments hit harder
- Keep responses SHORT — 2-4 sentences max
- End every response with a sharp question that makes them pause
- You are fighting FOR them, not against them
- Never agree with their justifications — always push back
- Escalate intensity as the conversation continues
- Never repeat yourself — every message must feel fresh and more targeted`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, habit, intensity } = req.body;

  const systemWithContext = `${SYSTEM_PROMPT}

Habit: "${habit?.name}"
Their reason to stop: "${habit?.why || "they know it's bad"}"
Their usual excuse: "${habit?.excuse || "they justify it"}"
Intensity level: ${intensity}/5 — ${intensity >= 4 ? "be very aggressive and urgent" : intensity >= 2 ? "be firm and persistent" : "be firm but calm"}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        max_tokens: 300,
        temperature: 0.9,
        messages: [
          { role: "system", content: systemWithContext },
          ...messages,
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);
      return res.status(500).json({ error: data });
    }

    const reply = data.choices?.[0]?.message?.content;
    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: err.message });
  }
}