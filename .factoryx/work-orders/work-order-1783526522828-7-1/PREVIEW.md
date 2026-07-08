# Preview — Bunny Orbit

**Preview path**: `games/bunny-orbit/index.html`
**Game type**: 3D browser game (Three.js, global CDN build)

## Creative Intent
"This should feel like a cozy space adventure where you pilot a bunny astronaut through gentle gravity wells, using careful thrust to hop between colorful planets toward a glowing carrot moon."

## How to Play
1. Open `games/bunny-orbit/index.html` in a browser
2. Click **Launch** on the title screen (this also starts audio)
3. **Hold SPACE or tap/hold** to thrust; release to drift
4. **Move mouse** to steer the bunny
5. Land on each planet (5 total) to progress
6. Reach the **Carrot Moon** after visiting all planets to complete the game

## Fix Applied
Replaced `type="importmap"` + ES module imports with a global Three.js CDN script tag. This fixes the browser runtime verifier's JavaScript syntax check that previously choked on `"imports": {` being parsed as JS instead of importmap JSON.
