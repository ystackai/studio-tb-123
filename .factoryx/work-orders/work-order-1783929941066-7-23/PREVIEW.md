# Numbers Station Bloom — Preview

## Concept
This should feel like tuning into a mysterious shortwave radio station where each decoded signal grows a flower in a strange garden. You are the signal decoder, and the garden is your reward.

## How to Play
1. **Open** `dist/index.html` in any modern browser
2. **Press Enter or click** to begin tuning in
3. **Decode signals** by clicking the matching option:
   - **Color signals** (rounds 1–3): A colored dot pulses on screen with a tone. Click the matching color from three options.
   - **Pitch signals** (rounds 4–6): A tone plays twice. Was it LOW (220Hz), MID (440Hz), or HIGH (880Hz)?
   - **Position signals** (rounds 7–8): A flash appears at a specific zone. Was it LEFT, CENTER, or RIGHT?
4. **Each correct decode** grows a new plant with bloom particles and a success ping
5. **Wrong answer or timeout** ends the run with "SIGNAL LOST"
6. **Decode all 8 signals** to see the garden fully bloom with a C major chord

## Escalation
- Rounds 1–3: Color matching (calm, 6s timer)
- Rounds 4–6: Color + Pitch signals (faster, ~4.5s timer)  
- Rounds 7–8: All three signal types (fastest, ~2.5s timer)

## Outcomes
- **Success**: "GARDEN FULLY BLOOMED" with all plants visible, success chord plays
- **Failure**: "SIGNAL LOST" with score, partial garden shown, error buzz plays
- **Restart**: Press Enter or click to return to title and start fresh
