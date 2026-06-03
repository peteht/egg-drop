---
name: sensor-change-review
description: Review any change to the drop detection state machine or accelerometer sampling logic. Use before committing modifications to dropDetection.ts or any code that changes how freefall, impact, or settle phases are detected. The state machine has three known failure modes that interact — fixing one without checking the others has repeatedly reintroduced bugs.
---

# Sensor Detection Change Review

The drop detector is a 3-state machine (waiting → freefall → impact) with known failure modes that trade off against each other. Every change must be checked against all three — a fix for one has historically broken another.

## The three failure modes

### 1. False trigger during release
**Symptom:** Result fires before the phone has landed, reporting a suspiciously short cushion time (`< 10ms`) or a stop time that doesn't match the drop.  
**Cause:** The user's grip releases unevenly, causing a g-spike above `IMPACT_THRESHOLD` while the phone is still in hand or just leaving it.  
**Current mitigation:** Mid-air bump detection — if g drops back below `FREEFALL_THRESHOLD` from impact state, discard the pseudo-impact and resume freefall.  
**Check:** Does the change affect the conditions under which a freefall→impact transition is accepted? Does it change what happens when g drops back to near-zero from impact state?

### 2. Bounce counting
**Symptom:** Stop time reads anomalously high (200ms+) on hard surfaces with minimal padding.  
**Cause:** After landing, the phone bounces or vibrates. Each bounce above `REST_THRESHOLD` extends `stopSamples`.  
**Current mitigation:** Result fires on the first sample where g drops below `REST_THRESHOLD` (first-pulse-only approach).  
**Check:** Does the change affect when `stopSamples` increments or when the result fires? Could it cause the detector to count across multiple bounces?

### 3. Short drop / insufficient freefall
**Symptom:** Results from drops under ~1m are unreliable — low freefall sample count means release noise is a larger fraction of total freefall time.  
**Current mitigation:** UI warning when `height < 1.0m`. Drop screen instructs "at least 1 meter."  
**Check:** Does the change affect `freefallSamples` counting? Does it change the minimum freefall required before impact is recognized?

## For every change to the state machine

1. **Trace the happy path:** normal drop from 1m+ → clean freefall → impact → settle. Does it still work?
2. **Trace failure mode 1:** release bump at 50ms into drop → g spikes → g drops to near-zero. Does the bump get discarded?
3. **Trace failure mode 2:** landing → bounce → bounce → settle. Does the result fire on the first pulse, not after all bounces?
4. **Trace failure mode 3:** drop from 0.5m. Is there a warning? Does the detector still fire correctly?
5. **Check the tests:** do the existing tests in `dropDetection.test.ts` cover the changed code path? Add a test for any new branch.

## Constants reference

| Constant | Value | Purpose |
|---|---|---|
| `FREEFALL_THRESHOLD` | 0.3g | Below this = weightless / true freefall |
| `MIN_FREEFALL_SAMPLES` | 4 | Consecutive freefall samples to enter freefall state |
| `IMPACT_THRESHOLD` | 1.8g | Above this in freefall = impact detected |
| `REST_THRESHOLD` | 1.3g | Above this in impact = still decelerating |
| `CRACK_THRESHOLD_G` | 30g | peakG at or above this = cracked prediction |

Any change to these values must go through `/threshold-check` first.

## Call

- **Blocking:** change breaks any of the three failure mode traces; a new branch is not covered by tests.
- **Should fix:** happy path still works but a failure mode is now unhandled; constant changed without a threshold-check.
- **Note:** opportunity to simplify state transitions without affecting correctness.
