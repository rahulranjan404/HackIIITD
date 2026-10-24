// Thin wrappers over chrome.storage. Keys live here so phases don't collide.
export const KEYS = Object.freeze({
  CHAT: 'chat:messages',        // session: { writer, messages[] }
  TEXT_SIZE: 'ui:textSizeStep', // local:   0..4
  // PHASE 2+: settings, server URL, voice prefs ...
});

const wrap = (area) => ({
  async get(key, fallback = undefined) {
    const res = await chrome.storage[area].get(key);
    return key in res ? res[key] : fallback;
  },
  set(key, value) {
    return chrome.storage[area].set({ [key]: value });
  },
  remove(key) {
    return chrome.storage[area].remove(key);
  },
});

export const local = wrap('local');
export const session = wrap('session');
