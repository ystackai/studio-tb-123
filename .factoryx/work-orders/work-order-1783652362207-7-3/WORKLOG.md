# Worklog

## What Changed

- Recovered the useful integration intent from the stalled first Qwen run onto a durable branch.
- Integrated the precompiled authored rotorcraft with validated node names and procedural fallback.
- Corrected the authored asset scale after live browser evidence showed the first draft was oversized, then verified the exported glTF rotor axes directly.
- Tightened chase framing without removing radar-gate or canyon readability.
- Added deterministic runtime asset markers and preserved the existing audio/gameplay loop.

## What Was Learned

- The first run's creative direction was viable; its failure was durability and verifier infrastructure, not goal specificity.
- A process can generate a correct-looking diff and still yield zero learning value if it stalls before commit/evidence.
- Visual inspection was necessary: syntax checks did not reveal the initial 2.2x scale error or the wrong rotor axes.

## Next Lowest-Waste Action

Merge only after branch review, then reassess the exact deployed artifact. The next intervention should be selected from the resulting state rather than advancing a fixed stage sequence.
