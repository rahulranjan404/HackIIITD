import { MSG, listen } from '../shared/messages.js';
import { createChat } from './chat.js';
import { initTextSize } from './textsize.js';
import { createPageInfo } from './pageinfo.js';
import { getAssistantReply } from './assistant.js';

const $ = (id) => document.getElementById(id);

function createAnnouncer(el) {
  let t;
  return (message) => {
    el.textContent = '';
    clearTimeout(t);
    t = setTimeout(() => { el.textContent = message; }, 50);
  };
}

async function main() {
  const announce = createAnnouncer($('announcer'));
  const input = $('message-input');
  const statusEl = $('status');

  await initTextSize({ downBtn: $('size-down'), upBtn: $('size-up'), announce });

  const chat = createChat({ scrollEl: $('chat'), listEl: $('messages'), emptyEl: $('empty') });
  await chat.init();

  const page = createPageInfo($('page-title'));
  listen({ [MSG.PAGE_INFO_CHANGED]: (info) => page.render(info) });
  page.refresh();

  /* ---- Status ---- */
  let pending = 0;
  const setStatus = (state, label) => { statusEl.dataset.state = state; statusEl.textContent = label; };

  /* ---- Send ---- */
  async function handleSend() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    await chat.add('user', text);

    pending++;
    setStatus('busy', 'Working');
    try {
      const reply = await getAssistantReply(text, { page: page.current() });
      await chat.add('assistant', reply);
      // PHASE 3 HOOK: speak(reply) and enable the "Stop speaking" button while speaking.
      pending--;
      if (!pending) setStatus('ready', 'Ready');
    } catch (err) {
      pending--;
      setStatus('error', 'Error');
      await chat.add('assistant', `Sorry, something went wrong: ${err.message}`);
    }
  }

  $('composer-form').addEventListener('submit', (e) => { e.preventDefault(); handleSend(); }); // Enter sends

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && input.value) {
      e.preventDefault();
      input.value = '';
      announce('Message cleared.');
    }
  });

  /* ---- Mic toggle (UI only in Phase 1) ---- */
  const mic = $('mic');
  mic.addEventListener('click', () => {
    const on = mic.getAttribute('aria-pressed') !== 'true';
    mic.setAttribute('aria-pressed', String(on));
    $('mic-state').textContent = on ? 'on' : 'off';
    announce(on ? 'Microphone on. Voice input is not available in this demo yet.' : 'Microphone off.');
    // PHASE 3 HOOK: start/stop speech recognition here.
  });

  /* ---- Stop speaking (disabled until Phase 3) ---- */
  // PHASE 3 HOOK: enable the button and: $('stop-speaking').addEventListener('click', () => send(MSG.SPEAK_STOP));

  /* ---- Clear chat ---- */
  $('clear-chat').addEventListener('click', async () => {
    await chat.clear();
    announce('Chat cleared.');
    input.focus();
  });

  input.focus();
}

main();
