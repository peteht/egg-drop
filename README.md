# 🥚 Egg Drop

A STEM app for egg-drop competitions. Wrap your phone in your armor design, drop it, and find out if your egg would have survived — no eggs wasted.

---

## What it does

Instead of cracking real eggs to test your armor, you use your phone as a stand-in sensor. The app reads your phone's accelerometer during the drop, measures the peak impact force, and gives you a **Protection Score** you can compare across designs.

The physics is real: the same forces that would crack an egg act on your phone. If your armor keeps the peak g-force below the crack threshold, the egg survives.

---

## How to use it

1. **Build your armor** — wrap your phone in whatever padding, foam, bubble wrap, or contraption you're testing.
2. **Put the phone where the egg would go** — the app measures what the phone experiences, so position it the same way you'd position a real egg.
3. **Tap Start Drop** on the home screen.
4. **Drop from at least 1 meter** — short drops underestimate impact force and may show "safe" when the egg would actually crack.
5. **Full release** — let go completely and step back. Don't guide the drop or catch it on landing.
6. **Read the result** — you'll see your Protection Score, the peak g-force, and drop height.
7. **Iterate** — try to beat your score with a better design.
8. **Test a real egg** — once you're confident in your armor, use the history screen to log whether an actual egg survived and see if the app's prediction was right.

---

## The result screen

### Protection Score (0–100)
The headline number. Higher is better. Derived directly from peak g-force — less peak force on landing = higher score. Use this to compare designs.

The background color scales with the score:
- 🟢 **Green** — score 50 or above (well-cushioned landing)
- 🟠 **Orange** — score 20–49 (borderline)
- 🔴 **Red** — score below 20 (high-impact landing)

### Peak g-force
The highest force reading captured during impact. This is the single number that determines whether the egg cracks. The crack threshold is currently **30g** — calibrate this against real egg results using the history screen.

### Drop Height
Calculated from how long the phone was in free-fall before impact. Drop from higher for more meaningful data — a taller drop spreads design differences further apart.

---

## History screen

Every drop is automatically saved.

- **Filter** — switch between All / Safe / Cracked at the top.
- **Protection score badge** — compare your designs at a glance.
- **I tested a real egg →** — after a drop, record whether an actual egg survived and see if the app's prediction was correct. This is the science experiment part: hypothesis vs. observed result.
- **Delete** — tap 🗑 to remove a single record.
- **Clear** — remove all history at once (with confirmation).

---

## Tips for accurate results

Tap the **?** button on any screen for the full list. The short version:

- **Never drop your phone unprotected**
- **Drop from at least 1 meter** — short drops underestimate force
- **Full release** — don't guide or catch the phone
- **Drop straight down** — throwing or angling skews the velocity calculation
- **Step back** — don't touch the phone until the result appears

---

## The physics (for the curious)

The app captures the **peak g-force** at the moment of impact. Peak g is the single most reliable indicator of whether an egg cracks:

- A hard surface stops the phone almost instantly → high peak g
- Good armor compresses slowly → lower peak g spread over time

This means surface type, drop angle, and cushion duration are all already baked into the peak reading. The only threshold that matters is whether peak g exceeded the crack threshold.

```
prediction = peakG >= CRACK_THRESHOLD_G ? 'cracked' : 'safe'
score      = max(0, min(100, round(100 − peakG × 2.5)))
```

The crack threshold (currently 30g) is a starting point. Use the "I tested a real egg" feature to collect real crack vs. survive data and calibrate it for your specific setup.

---

## Known limitations

**Sensor floor at `< 10ms`**  
The phone samples every ~10ms (100Hz). Any impact faster than that registers at the sensor floor. Peak g is still captured correctly; only the cushion time display is affected.

**Drop, don't throw**  
The free-fall timer starts the moment the phone leaves your hand. Throwing upward inflates the calculated drop height.

**1 meter minimum**  
Below 1 meter, free-fall phase is short enough that release-motion noise can interfere with detection. The result screen shows a warning if the detected height is under 1m.

**Calibration**  
The 30g crack threshold is a physics-based starting point. Collect real egg results to dial it in for your class.

---

## Running locally

**Prerequisites:** Node.js, the [Expo Go](https://expo.dev/client) app on your phone (SDK 54).

```bash
git clone https://github.com/peteht/egg-drop.git
cd egg-drop
npm install
npx expo start
```

Scan the QR code with Expo Go. **A real device is required** — the accelerometer doesn't work in a simulator.

### Running tests

```bash
npm test
```

Full coverage on the physics engine and storage layer. 37 tests, 100% statement/branch/function/line coverage.

---

## Tech stack

| | |
|---|---|
| Framework | Expo (React Native, SDK 54) |
| Language | TypeScript (strict mode) |
| Sensors | `expo-sensors` — Accelerometer at 100Hz |
| Storage | `@react-native-async-storage/async-storage` |
| Navigation | `@react-navigation/native-stack` |
| Graphics | `react-native-svg` |
| Haptics | `expo-haptics` |
| Tests | Jest 29 + jest-expo |

### Architecture notes

- **`src/types/index.ts`** — single source of truth for `DropRecord`, `DropResult`, `Prediction`, and `RootStackParamList`.
- **`src/utils/dropDetection.ts`** — self-contained 3-state machine (waiting → freefall → impact). No React dependencies; pure logic with 100% test coverage.
- **`src/utils/storage.ts`** — generic `getAll<T>` / `prepend<T>` / `removeById<T>` / `updateById<T>` helpers under typed public functions. Structured for a future API swap without touching call sites.
- **`src/components/HelpModal.tsx`** — shared FAQ modal used on Home, Drop, and Result screens.

---

## Privacy Policy

Egg Drop does not collect, store, or transmit any personal data.

- All drop history is stored locally on your device only and never leaves it.
- The app accesses the device accelerometer to measure impact force. No sensor data is transmitted or shared.
- The app does not use analytics, advertising, or third-party tracking of any kind.
- The app does not require an account or any personal information to use.

If you have questions, contact: peterugh@gmail.com
