---
name: physics-check
description: Verify the physics model before writing or modifying any sensor-based detection logic. Use before touching accelerometer detection, threshold values, timing calculations, or any code that maps raw sensor readings to real-world measurements. Catches measurement design errors before they become code bugs.
---

# Physics Model Check

Code that computes the wrong thing perfectly is worse than code that crashes — it ships silently wrong results. Before writing or changing any sensor-based logic, verify the measurement model first.

## Order

1. **State what you're measuring and why.** One sentence. If you can't, the model is under-specified and that's the first finding.
2. **Check the sensor's actual constraints.** What is the sample rate? What is the noise floor? What values does it produce at rest, in freefall, at maximum impact? Can it physically capture the event you're trying to measure?
3. **Identify what the sensor already captures.** Don't reconstruct information the raw reading already contains. Layering derived calculations on top of a direct measurement compounds error.
4. **Check every magic number.** Where did each threshold come from? Is it based on real measured data, published physics, or a guess that "seemed right"? Guesses must be flagged.
5. **Trace the failure modes.** What does the model output when the input is noisy, partial, or out of expected range?

## Sensor floor problem

If the physical event (e.g. a hard impact) occurs faster than the sample interval, the sensor cannot resolve it. The reading will be clamped at the floor — not zero, not an error, just the floor value — and will look like valid data. Any threshold-based logic must account for this.

## Derived vs. direct measurement

Before adding a formula, ask: does the sensor already measure this directly? Surface modifiers, mass scaling, and impulse reconstruction are all ways to re-derive something the accelerometer already captured in the peak reading. Each layer of reconstruction adds assumptions and error. Prefer the direct reading.

## Call

- **Blocking:** measurement is physically impossible given sensor constraints; formula reconstructs something the sensor already measures directly; magic number has no empirical or published basis.
- **Should fix:** threshold value is a placeholder pending real calibration data; sensor floor case not handled in UI.
- **Note:** opportunities to simplify the model without losing accuracy.
