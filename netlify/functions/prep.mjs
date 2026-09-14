const PREP_SYSTEM = `You prepare interviews for WTFinance, a macro finance and geopolitics podcast hosted by Anthony Fatseas.

Write practical interview preparation, not generic biography. Research the guest online first and prioritise recent positions, interviews, publications and developments. Never invent credentials or facts. If a point is uncertain, omit it or label it as something to verify.

Output:
INTRODUCTION
A concise host introduction, ready to read aloud.

WHY NOW
3 short bullets explaining the guest's most relevant current themes.

QUESTIONS
8 to 12 substantial questions. Build from current events into the guest's core thesis. Include one question linking their views to ordinary people's wealth, one gently challenging/comparative question, and finish exactly with: "What is one message listeners should takeaway from our conversation?"

FOLLOW UPS
5 short follow-up prompts Anthony can use live.

CLIP ANGLES
3 potential short-form moments or questions likely to produce a strong clip.

STYLE
British spelling. Serious, informed and conversational. Assume the audience understands macro basics. No em-dashes or en-dashes. Use commas, colons or shorter sentences.`;

export default async (req) => {
  if (req.method === 'GET') return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const key = process.env.OPENAI_API_KEY;
  if (!key) return new Response(JSON.stringify({ ok: false, error: 'OPENAI_API_KEY is not configured.' }), { status: 500, headers: { 'content-type': 'application/json' } });

  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    if (!name) return new Response(JSON.stringify({ ok: false, error: 'Guest name is required.' }), { status: 400, headers: { 'content-type': 'application/json' } });

    const mode = body.mode === 'revise' ? 'revise' : 'generate';
    const current = String(body.current || '').trim();
    const feedback = String(body.feedback || '').trim();
    const context = [
      `Guest: ${name}`,
      body.org ? `Organisation: ${body.org}` : '',
      body.recordDate ? `Interview date: ${body.recordDate}` : '',
      body.channelContext ? `WTFinance YouTube context:\n${String(body.channelContext).slice(0, 6000)}` : '',
    ].filter(Boolean).join('\n');

    const prompt = mode === 'revise'
      ? `${context}\n\nHere is the current preparation:\n${current}\n\nAnthony's requested changes:\n${feedback}\n\nReturn the FULL revised preparation. Keep good material, apply the changes, and output only the preparation.`
      : `${context}\n\nCreate interview preparation for this guest. Search the web before writing so the preparation reflects current information as of today. Output only the preparation.`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_PREP_MODEL || 'gpt-5.6-terra',
        tools: [{ type: 'web_search' }],
        instructions: PREP_SYSTEM,
        input: prompt,
        max_output_tokens: 5000,
        store: false,
      }),
    });

    const raw = await response.text();
    if (!response.ok) {
      let message = raw;
      try { message = JSON.parse(raw)?.error?.message || raw; } catch {}
      throw new Error(message);
    }
    const data = JSON.parse(raw);
    return new Response(JSON.stringify({ ok: true, text: data.output_text || '' }), { headers: { 'content-type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error.message || error) }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
};
