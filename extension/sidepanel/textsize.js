import { KEYS, local } from '../shared/storage.js';

export const SIZES = [14, 17, 20, 24, 28]; // px; min 14, max 28
const DEFAULT_STEP = 2;

export async function initTextSize({ downBtn, upBtn, announce }) {
  let step = clamp(await local.get(KEYS.TEXT_SIZE, DEFAULT_STEP));

  function clamp(n) {
    n = Number.isInteger(n) ? n : DEFAULT_STEP;
    return Math.min(SIZES.length - 1, Math.max(0, n));
  }

  function apply() {
    document.documentElement.style.setProperty('--font-base', `${SIZES[step]}px`);
    // aria-disabled (not disabled) so keyboard focus is never lost at the limits
    downBtn.setAttribute('aria-disabled', String(step === 0));
    upBtn.setAttribute('aria-disabled', String(step === SIZES.length - 1));
  }

  function change(delta) {
    const next = clamp(step + delta);
    if (next === step) {
      announce(delta > 0 ? 'Text is already at its largest size.' : 'Text is already at its smallest size.');
      return;
    }
    step = next;
    apply();
    local.set(KEYS.TEXT_SIZE, step);
    announce(`Text size ${step + 1} of ${SIZES.length}.`);
  }

  downBtn.addEventListener('click', () => change(-1));
  upBtn.addEventListener('click', () => change(+1));
  apply();
}
