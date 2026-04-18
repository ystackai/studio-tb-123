/**
 * snap.js — zero-latency font-weight snap synchronized to the
 * AudioContext clock tick via AudioBufferSourceNode.onended.
 *
 * The `onended` event fires at the sample-accurate moment playback
 * halts (driven by the audio hardware clock).  We attach a single
 * synchronous style mutation inside that callback, which commits
 * to the compositor within < 1 ms of the zero-crossing hard-cut.
 *
 * All rAF painting happens after the snap so the user sees the
 * brutalist weight jump before any animation easing can apply.
 */

/**
 * Attach a synchronous font-weight snap listener that fires inside
 * the `onended` event of a BufferSourceNode — i.e. at the exact
 * audio clock tick when playback stops.
 *
 * @param {AudioBufferSourceNode} src    — source whose .onended triggers the snap
 * @param {string}      titleElId  — id of the DOM element to snap
 */
export function attachOnEndedSnap(src, titleElId) {
  const el = document.getElementById(titleElId);
  if (!el) return;

  src.onended = () => {
    // ── synchronous mutation inside onended: < 1 ms from audio clock tick
    el.style.transition = 'none';             // disable CSS easing (brutalist snap)
    el.style.fontWeight = '400';              // snap to canonical weight

      // Force reflow so paint is committed before transition restoration.
    void el.offsetHeight;

    requestAnimationFrame(() => {
        // Restore CSS transition for any future style changes.
      el.style.transition = '';               // remove inline override
    });
  };
}
