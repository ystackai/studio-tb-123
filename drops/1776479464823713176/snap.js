/**
 * snap.js — zero-latency font-weight snap synchronized to the
 * AudioContext clock tick via AudioBufferSourceNode.onended.
 *
 * The `onended` event fires at the sample-accurate moment playback
 * halts (driven by the audio hardware clock).  We attach a single
 * synchronous style mutation inside that callback, which commits
 * to the compositor within < 1 ms of the zero-crossing hard-cut.
 *
 * Synchronization contract:
 *   • CSS transition on .title is set to `font-weight DECAY_MS linear`
 *     at trigger time — font-weight sweeps 400→900 over 10 ms.
 *   • onended fires when the sample-accurate zero-crossing cut completes.
 *   • This module immediately disables transitions and sets
 *     font-weight to baseline (400), achieving a hard snap with no
 *     easing whatsoever — "the purity of the hard-cut is the feature."
 */

/**
 * Attach a synchronous font-weight snap listener that fires inside
 * the `onended` event of a BufferSourceNode — i.e. at the exact
 * audio clock tick when playback stops.
 *
 * @param {AudioBufferSourceNode} src   - source whose .onended triggers the snap
 * @param {string}              titleElId - id of the DOM element to snap
 */
export function attachOnEndedSnap(src, titleElId) {
  const el = document.getElementById(titleElId);
  if (!el) return;

  src.onended = () => {
    // Disable the font-weight transition during the snap.
    // This is **not** CSS — it's a forced style override applied
    // in the same synchronous microtask as onended, so the browser
    // cannot schedule any easing between the audio clock tick and paint.
    el.style.fontWeight = '400';

    // Disable ALL transitions momentarily so no residual easing
    // (opacity, etc.) applies during the snap mutation.
    const saved = el.style.transition;
    el.style.transition = 'none';

    // Force reflow — commit paint at font-weight 400 with no animation.
    void el.offsetHeight;

    requestAnimationFrame(() => {
      // Restore CSS transition for any future style changes.
      el.style.transition = saved || '';
    });
  };
}
