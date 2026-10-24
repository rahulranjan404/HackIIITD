// PHASE 2 HOOK: the panel only ever calls getAssistantReply(). Today the background
// worker echoes; in Phase 2 the background calls the server — nothing here changes.
// PHASE 3 HOOK: after a reply arrives, hand its text to text-to-speech.
import { MSG, send } from '../shared/messages.js';

export async function getAssistantReply(text, { page } = {}) {
  const res = await send(MSG.USER_MESSAGE, { text, page });
  if (!res?.ok) throw new Error(res?.error || 'No response from the background worker.');
  return res.data.text;
}
