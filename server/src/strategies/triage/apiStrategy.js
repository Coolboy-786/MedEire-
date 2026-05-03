/*
 * DESIGN PATTERN: Strategy (Pattern #4) — AI-Powered Triage
 *
 * This is the primary strategy. It calls the Anthropic Claude API with a
 * tightly-scoped system prompt and parses the JSON response.
 *
 * Why primary: AI triage is far more nuanced than keyword matching — it
 * understands symptom combinations, medical context, and severity gradients.
 *
 * Failure contract: throws an Error for any failure (API key missing, HTTP
 * error, malformed JSON). triageService.classify() catches this and falls
 * back to ruleStrategy automatically — no try/catch needed at the call site.
 */

const SYSTEM_PROMPT = `You are a medical triage assistant for the Irish healthcare system (HSE).
Analyse the reported symptoms and classify their severity.
Return ONLY a valid JSON object — no markdown, no extra text, nothing outside the JSON:
{"severity":"low|medium|high","reasoning":"one or two plain-English sentences","redFlags":[]}

Severity definitions:
- low:    mild, self-limiting symptoms; routine GP visit when convenient
- medium: concerning symptoms; patient should see a doctor within 24–48 hours
- high:   serious symptoms requiring urgent medical attention today, or call 112/999`;

const classify = async (symptoms) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'placeholder') {
    throw new Error('ANTHROPIC_API_KEY not configured — falling back to rule strategy');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Patient symptoms: ${symptoms.join(', ')}` }],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Anthropic API responded ${response.status}: ${body.slice(0, 120)}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error('Empty response body from Anthropic API');

  let result;
  try {
    result = JSON.parse(text.trim());
  } catch {
    throw new Error(`Anthropic API returned non-JSON: ${text.slice(0, 120)}`);
  }

  if (!['low', 'medium', 'high'].includes(result.severity)) {
    throw new Error(`Invalid severity "${result.severity}" from Anthropic API`);
  }

  return {
    severity:  result.severity,
    reasoning: result.reasoning || '',
    redFlags:  Array.isArray(result.redFlags) ? result.redFlags : [],
  };
};

module.exports = { classify };
