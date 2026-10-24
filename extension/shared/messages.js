// WebWhisper — single message-passing module.
// Every message is { type, payload }. Handlers reply with { ok, data } or { ok:false, error }.
// All phases add their types HERE and nowhere else.

export const MSG = Object.freeze({
  // Phase 1
  USER_MESSAGE: 'USER_MESSAGE',           // panel -> background   payload: { text, page }   reply data: { text }
  PAGE_INFO: 'PAGE_INFO',                 // content -> background payload: { url, title }
  PAGE_INFO_GET: 'PAGE_INFO_GET',         // panel -> background   reply data: { tabId, url, title }
  PAGE_INFO_CHANGED: 'PAGE_INFO_CHANGED', // background -> panel   payload: { tabId, url, title }
  SPEAK_STOP: 'SPEAK_STOP',               // panel -> background   (reserved; no handler until Phase 3)

  // PHASE 2 (AI backend): ASSISTANT_REPLY_STREAM, ASSISTANT_ERROR ...
  // PHASE 3 (voice):      SPEAK_START, MIC_SET, TRANSCRIPT ...
  // PHASE 4 (page actions): PAGE_ACTION, PAGE_ACTION_RESULT, PAGE_READ ...
});

/** Send a message to the extension runtime. Never throws; resolves { ok:false } if nobody is listening. */
export async function send(type, payload = {}) {
  try {
    const res = await chrome.runtime.sendMessage({ type, payload });
    return res ?? { ok: false, error: 'No handler responded' };
  } catch (err) {
    return { ok: false, error: String(err?.message ?? err) };
  }
}

/** Send a message to a tab's content script. Never throws. */
export async function sendToTab(tabId, type, payload = {}) {
  try {
    return (await chrome.tabs.sendMessage(tabId, { type, payload })) ?? { ok: false };
  } catch (err) {
    return { ok: false, error: String(err?.message ?? err) };
  }
}

/**
 * Register handlers: { [MSG.X]: (payload, sender) => data | Promise<data> }.
 * Unknown types are ignored so several contexts can listen side by side.
 */
export function listen(handlers) {
  const listener = (message, sender, sendResponse) => {
    const handler = handlers[message?.type];
    if (!handler) return false;
    let result;
    try {
      result = handler(message.payload ?? {}, sender);
    } catch (err) {
      sendResponse({ ok: false, error: String(err?.message ?? err) });
      return false;
    }
    if (result && typeof result.then === 'function') {
      result.then(
        (data) => sendResponse({ ok: true, data }),
        (err) => sendResponse({ ok: false, error: String(err?.message ?? err) })
      );
      return true; // keep the channel open for the async reply
    }
    sendResponse({ ok: true, data: result });
    return false;
  };
  chrome.runtime.onMessage.addListener(listener);
  return listener;
}
