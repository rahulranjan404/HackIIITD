import { KEYS, session } from '../shared/storage.js';

const MAX_MESSAGES = 200;
const INSTANCE = crypto.randomUUID(); // identifies this panel so it ignores its own storage events
const timeFmt = new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' });

export function createChat({ scrollEl, listEl, emptyEl }) {
  let messages = [];
  let liveTimer;

  function buildItem(msg) {
    const li = document.createElement('li');
    li.className = `msg msg--${msg.role}`;
    li.dataset.id = msg.id;

    const who = document.createElement('span');
    who.className = 'msg__who';
    who.textContent = msg.role === 'user' ? 'You' : 'WebWhisper';

    // DOM order = reading order: who, text, time (CSS grid places the time beside the name)
    const text = document.createElement('p');
    text.className = 'msg__text';
    text.textContent = msg.text;

    const time = document.createElement('time');
    time.className = 'msg__time';
    time.dateTime = new Date(msg.ts).toISOString();
    time.textContent = timeFmt.format(msg.ts);

    li.append(who, text, time);
    return li;
  }

  const scrollToEnd = () => { scrollEl.scrollTop = scrollEl.scrollHeight; };
  const updateEmpty = () => { emptyEl.hidden = messages.length > 0; };

  // Re-render without screen readers reading the whole history aloud.
  function renderAll() {
    listEl.setAttribute('aria-live', 'off');
    listEl.replaceChildren(...messages.map(buildItem));
    updateEmpty();
    scrollToEnd();
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => listEl.setAttribute('aria-live', 'polite'), 300);
  }

  const persist = () => session.set(KEYS.CHAT, { writer: INSTANCE, messages });

  async function init() {
    const stored = await session.get(KEYS.CHAT);
    messages = Array.isArray(stored?.messages) ? stored.messages : [];
    renderAll();

    // Keep several panels (e.g. different windows) in sync.
    chrome.storage.onChanged.addListener((changes, area) => {
      const change = changes[KEYS.CHAT];
      if (area !== 'session' || !change) return;
      if (change.newValue?.writer === INSTANCE) return;
      messages = change.newValue?.messages ?? [];
      renderAll();
    });
  }

  async function add(role, text) {
    const msg = { id: crypto.randomUUID(), role, text, ts: Date.now() };
    messages.push(msg);
    listEl.append(buildItem(msg)); // appended live => announced by aria-live="polite"
    while (messages.length > MAX_MESSAGES) {
      messages.shift();
      listEl.firstElementChild?.remove();
    }
    updateEmpty();
    scrollToEnd();
    await persist();
    return msg;
  }

  async function clear() {
    messages = [];
    renderAll();
    await persist();
  }

  return { init, add, clear };
}
