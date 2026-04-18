/**
 * snap.js — synchronous font-weight snap fired inside AudioBufferSourceNode.onended.
 *
 * The `onended` event fires at the exact sample-accurate audio-clock tick when
 * playback halts (i.e. the moment the buffer ends at the zero-crossing).
 * We apply two inline-style mutations in that callback:
 *   1. Disable `font-weight` transition (inline transition overrides stylesheet).
 *   2. Set font-weight back to baseline (400).
 * Both mutations commit before any compositor paint, yielding < 1 ms sync drift.
 */

/**
 * @param {AudioBufferSourceNode} src     — source whose .onended triggers the snap
 * @param {string}               titleElId — id of the DOM element to snap
 */
export function attachOnEndedSnap(src, titleElId) {
  const el = document.getElementById(titleElId);
  if (!el) return;

  src.onended = () => {
    // Disable the font-weight transition so the snap is instantaneous.
    // Inline style overrides stylesheet rules, and no easing is scheduled
    // because `transition` is set to 'none' before any paint opportunity.
    el.style.transition = 'none';
    el.style.fontWeight = '400';

    // Force synchronous reflow to guarantee the paint happens at this microtask.
    void el.offsetHeight;

    requestAnimationFrame(() => {
      el.style.transition = '';
    });
  };
}
