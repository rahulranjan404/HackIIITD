# WebWhisper — Phase 1 (UI shell)

A Chrome MV3 side-panel extension for vision-impaired users. Phase 1 is the accessible UI, session chat,
page awareness and a fake echo assistant. No AI, backend, speech or page actions yet.

## Load it
1. Open `chrome://extensions` (Chrome 114 or newer).
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose the `extension/` folder.
4. Pin WebWhisper, then click its toolbar icon. The side panel opens.

After editing code, click the reload icon on the extension card and reopen the panel.
Pages that were already open need a refresh to get the updated content script.

## Layout
```
extension/
  manifest.json
  background.js          message router, page-info relay, echo assistant (Phase 2 hook)
  content/content.js     reports {url, title} on load and SPA navigation
  shared/messages.js     ALL message-type constants + send/listen helpers
  shared/storage.js      storage keys + helpers
  shared/tokens.css      ALL colors, spacing, radii, fonts (Poppins bundled in /fonts)
  sidepanel/             index.html, panel.css, panel.js, chat.js, textsize.js, pageinfo.js, assistant.js
server/                  empty; Node + Express arrives in Phase 2
```

## Where later phases plug in (search for `PHASE`)
- Phase 2: `background.js` USER_MESSAGE handler calls the server. `sidepanel/assistant.js` stays unchanged.
- Phase 3: `panel.js` mic click, speak-after-reply, enable Stop speaking (`SPEAK_STOP`).
- Phase 4: `content/content.js` and `background.js` for PAGE_ACTION / PAGE_READ.
- New message types go only in `shared/messages.js`.

## Manual test checklist
**Setup**
- [ ] Extension loads with no errors on `chrome://extensions`.
- [ ] Toolbar icon opens the side panel.

**Chat**
- [ ] Type "hello" and press Enter: your message appears (mint left border), then "Phase 1 demo: I heard 'hello'" on a green card.
- [ ] Empty messages are not sent. Timestamps are muted.
- [ ] Type text, press Escape: the input clears.

**Persistence**
- [ ] Close and reopen the panel: messages are still there.
- [ ] Navigate the tab to another site: messages persist.
- [ ] Quit Chrome fully and relaunch: chat is gone (session storage only).
- [ ] Clear chat empties the list and shows the empty state.

**Text size**
- [ ] A+ and A- step through 5 sizes (14, 17, 20, 24, 28 px); everything scales.
- [ ] At each limit the button is dimmed and focus stays on it.
- [ ] Reload the panel: the size is remembered.

**Page awareness**
- [ ] "You are on:" shows the current page title.
- [ ] Switch tabs: it updates.
- [ ] On a single-page app (e.g. youtube.com, GitHub), click around without reloading: the title updates.
- [ ] On `chrome://extensions` it shows that page's title (no content script runs there).

**Mic and Stop**
- [ ] Mic toggles off/on: the label changes, mint active state appears, `aria-pressed` flips (check in DevTools).
- [ ] Stop speaking is visible and disabled.

**Accessibility**
- [ ] Tab order: A-, A+, Clear chat, conversation, input, Mic, (Stop skipped), Send.
- [ ] Every focused control has a clear mint ring.
- [ ] With a screen reader (NVDA, VoiceOver, ChromeVox): a new message is announced once; reopening the panel does not read the whole history.
- [ ] Text size, mic and clear actions are announced.
- [ ] Zoom the panel to 200%: nothing is clipped.
