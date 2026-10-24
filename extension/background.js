import { MSG, listen, send } from './shared/messages.js';

// Toolbar icon opens the side panel.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

/* ---------- Page awareness ---------- */
const pageKey = (tabId) => `page:${tabId}`;

async function infoForTab(tab) {
  const stored = (await chrome.storage.session.get(pageKey(tab.id)))[pageKey(tab.id)];
  // Trust the content script's data only if it matches the tab's current URL (guards stale SPA state).
  if (stored && stored.url === tab.url) {
    return { tabId: tab.id, url: stored.url, title: stored.title || tab.title || '' };
  }
  return { tabId: tab.id, url: tab.url || '', title: tab.title || '' };
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab;
}

async function broadcastActive() {
  const tab = await getActiveTab();
  if (!tab) return;
  await send(MSG.PAGE_INFO_CHANGED, await infoForTab(tab)); // no-op if the panel is closed
}

chrome.tabs.onActivated.addListener(() => broadcastActive());
chrome.windows.onFocusChanged.addListener(() => broadcastActive());
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && (changeInfo.title || changeInfo.url || changeInfo.status === 'complete')) broadcastActive();
});
chrome.tabs.onRemoved.addListener((tabId) => chrome.storage.session.remove(pageKey(tabId)));

/* ---------- Message router ---------- */
listen({
  [MSG.PAGE_INFO]: async ({ url, title }, sender) => {
    if (!sender.tab) return;
    await chrome.storage.session.set({ [pageKey(sender.tab.id)]: { url, title } });
    if (sender.tab.active) broadcastActive();
  },

  [MSG.PAGE_INFO_GET]: async () => {
    const tab = await getActiveTab();
    return tab ? infoForTab(tab) : null;
  },

  [MSG.USER_MESSAGE]: async ({ text /*, page */ }) => {
    // PHASE 2 HOOK: replace this fake echo with a request to the Node/Express server
    // (include `page` {url,title} as context) and return { text: <assistant reply> }.
    return { text: `Phase 1 demo: I heard '${text}'` };
  },

  // PHASE 3 HOOK: [MSG.SPEAK_STOP] -> stop text-to-speech.
  // PHASE 4 HOOK: [MSG.PAGE_ACTION] -> forward to the active tab's content script (sendToTab).
});
