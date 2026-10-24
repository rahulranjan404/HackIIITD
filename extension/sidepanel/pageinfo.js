import { MSG, send } from '../shared/messages.js';

export function createPageInfo(titleEl) {
  let current = null;

  function render(info) {
    current = info && (info.url || info.title) ? info : null;
    let label = 'No page detected';
    if (current) {
      let host = '';
      try { host = new URL(current.url).hostname; } catch { /* non-URL (e.g. about:blank) */ }
      label = current.title || host || current.url;
    }
    titleEl.textContent = label;
    titleEl.title = current?.url || '';
  }

  async function refresh() {
    const res = await send(MSG.PAGE_INFO_GET);
    render(res?.ok ? res.data : null);
  }

  return { render, refresh, current: () => current };
}
