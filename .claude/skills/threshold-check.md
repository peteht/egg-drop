---
name: threshold-check
description: Audit every hardcoded numeric threshold or magic number in sensor-based or scoring logic. Use before committing any change that introduces or modifies a numeric constant used in a decision, score, or classification. Magic numbers that "seem right" are silent bugs waiting for the edge case that exposes them.
---

# Threshold Audit

A threshold is a commitment. It says: above this value, one thing is true; below it, something else is. If the number came from intuition rather than data, it's a hypothesis dressed as a fact. Find every threshold and demand its source.

## For each numeric constant, answer:

**1. What is the source?**
- Measured empirically from real data → acceptable, document the data points
- Derived from published physics or engineering specs → acceptable, cite the source
- Copied from a similar system → weak, verify it applies here
- Estimated, guessed, or "seemed reasonable" → **must be flagged as a placeholder**

**2. What is the failure mode when it's wrong?**
- False positive (safe when cracked): often worse — user trusts a wrong result
- False negative (cracked when safe): conservative, annoying but not dangerous
- Silent drift: the threshold is right today but the system it measures changes

**3. Is it calibrated for this specific context?**
A threshold valid for one device model, drop height, or use case may be wrong for another. Document the conditions under which it was validated.

**4. Is it reachable in tests?**
If no test exercises the boundary — the value itself plus one and minus one — the threshold is untested. The happy path never crosses the threshold.

**5. Is it exposed for calibration?**
Any threshold expected to need tuning (e.g. a crack threshold that depends on real egg data not yet collected) should be a named constant at the top of its file, not an inline literal. Makes future calibration a one-line change.

## Common threshold smells in this codebase

- `CRACK_THRESHOLD_G`: currently 30g. Based on published egg-drop physics, not measured. Needs calibration against real crack data. Known surviving drops: 19.3g, 21.7g. First confirmed crack data point not yet collected.
- `FREEFALL_THRESHOLD`, `IMPACT_THRESHOLD`, `REST_THRESHOLD`: tuned empirically during development. Document any future changes with the drop scenario that motivated the change.
- Score formula multiplier (`peakG * 2.5`): chosen to make 30g score ~25. Cosmetic — no calibration needed, but document the intent.

## Call

- **Blocking:** threshold drives a safety or correctness decision and has no empirical or published basis.
- **Should fix:** placeholder threshold not named as a constant; boundary not covered by a test.
- **Note:** threshold may need re-calibration as more real-world data is collected.
