const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Adjust to whichever Groq-hosted model you want. Kept as a constant
// so it's easy to swap without hunting through the codebase.
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * Sends a chat completion request to Groq.
 * @param {string} systemPrompt - the resolved personality/system prompt
 * @param {Array<{role: 'user'|'assistant', content: string}>} history - prior turns
 * @param {string} newMessage - the latest user message
 * @returns {Promise<string>} assistant's reply text
 */
async function getChatCompletion(systemPrompt, history, newMessage) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: newMessage },
  ];

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages,
    max_tokens: 1024,
    temperature: 0.8,
  });

  const reply = completion.choices?.[0]?.message?.content;
  if (!reply) {
    throw new Error('Groq returned an empty response.');
  }
  return reply;
}

module.exports = { getChatCompletion, MODEL };
