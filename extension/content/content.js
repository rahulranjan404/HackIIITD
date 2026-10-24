// Content scripts can't be ES modules, so load the shared module dynamically
// (it is listed in web_accessible_resources).
(async () => {
  if (window.__webwhisperContent) return;
  window.__webwhisperContent = true;

  const { MSG, send } = await import(chrome.runtime.getURL('shared/messages.js'));

  let lastKey = '';
  let timer;

  function report() {
    const url = location.href;
    const title = document.title || '';
    const key = `${url}\n${title}`;
    if (key === lastKey) return;
    lastKey = key;
    send(MSG.PAGE_INFO, { url, title });
  }
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(report, 150);
  };

  // Initial load
  report();

  // SPA navigation: several signals, de-duplicated by report()
  if ('navigation' in window) window.navigation.addEventListener('navigatesuccess', schedule);
  window.addEventListener('popstate', schedule);
  window.addEventListener('hashchange', schedule);
  window.addEventListener('pageshow', schedule); // back/forward cache
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });

  // Title changes (SPAs often update <title> after the URL changes)
  if (document.head) {
    new MutationObserver(schedule).observe(document.head, { childList: true, subtree: true, characterData: true });
  }

  // Safety net for frameworks that bypass the signals above
  setInterval(() => { if (!document.hidden && location.href !== lastKey.split('\n')[0]) schedule(); }, 1000);

  // PHASE 4 HOOK: chrome.runtime.onMessage listener for PAGE_READ / PAGE_ACTION goes here.
})();
