# 🥚 Egg Drop

A STEM app for egg-drop competitions. Wrap your phone in your armor design, drop it, and find out if your egg would have survived — no eggs wasted.

---

## What it does

Instead of cracking real eggs to test your armor, you use your phone as a stand-in sensor. The app reads your phone's accelerometer during the drop, measures how well your armor cushioned the impact, and gives you a **Protection Score** you can compare across designs.

The physics is real: the same forces that would crack an egg act on your phone. If your armor is good enough to protect the phone's internals, it's good enough for an egg.

---

## How to use it

1. **Build your armor** — wrap your phone in whatever padding, foam, bubble wrap, or contraption you're testing.
2. **Tap Start Drop** on the home screen.
3. **Drop your phone** from your target height. Drop, don't throw — throwing inflates the height reading (see [Known Limitations](#known-limitations)).
4. **Read the result** — you'll see your Protection Score, the estimated impact force, cushion time, and drop height.
5. **Iterate** — try to beat your score with a better design.
6. **Test a real egg** — once you're confident in your armor, use the history screen to log whether an actual egg survived and see if the app's prediction was right.

---

## The result screen

### Protection Score (0–100)
The headline number. Higher is better. It reflects how gently your armor absorbed the landing — lower impact force = higher score. Use this to compare designs and set a class record.

### Cushion Time
How long your armor took to bring the phone to a stop. This is the key engineering metric — **longer stop = less force on the egg**. Good armor compresses over 30–100ms; bare phone on tile stops in under 10ms.

When cushion time shows **`< 10ms`**, the impact was faster than the sensor can measure (see [Known Limitations](#known-limitations)).

### Force
The estimated average deceleration in g-force during impact. Eggs crack at roughly 30g. Your armor's job is to keep this number low.

### Drop Height
Calculated from how long the phone was in free-fall before impact. Drop from higher for more meaningful data — a taller drop spreads design differences further apart.

---

## History screen

Every drop is automatically saved. Tap a record to expand it.

- **Filter** — switch between All / Safe / Cracked at the top.
- **Protection score badge** — compare your designs at a glance.
- **I tested a real egg** — after a drop, you can record whether an actual egg survived and see if the app's prediction was correct. This is the science experiment part: hypothesis vs. observed result.
- **Delete** — tap 🗑 to remove a record and keep your history tidy.

---

## The physics (for the curious)

Standard apps try to read the **peak g-force** on impact. This doesn't work well here because a hard impact on concrete lasts ~2ms — faster than the phone's sensor (which samples every ~10ms). The sensor misses the spike entirely and reports a falsely safe reading.

This app uses a different approach:

1. **Free-fall timing** → impact velocity  
   During a drop the phone is weightless (~0g). The app times this free-fall period precisely (it lasts hundreds of milliseconds — well within sensor range) to calculate how fast the phone was traveling at impact.

2. **Stopping time** → deceleration  
   The app measures how long the deceleration pulse lasts after impact. Good armor compresses slowly (many samples); no armor stops the phone in a single sample (~10ms).

3. **Estimated force**  
   `G = velocity ÷ (stop_time × 9.81)`  
   Combining reliable velocity with measurable stop time gives a physically grounded force estimate — no fudge factors.

This means the sensor is actually *better* at measuring soft, cushioned landings (exactly the ones worth scoring) than hard, bare ones. A hard bare drop saturates at the sensor floor; a well-cushioned drop spreads over many samples and gives a real reading.

---

## Known limitations

**Sensor floor at `< 10ms`**  
The phone samples every ~10ms (100Hz). Any impact faster than that — a bare drop on tile, for example — registers at the floor. You'll see `< 10ms` cushion time rather than the true sub-millisecond value. The verdict is still correct (a floor-speed stop from meaningful height will score low/cracked), but the exact g-force number is an estimate, not a measurement.

**Drop, don't throw**  
The free-fall timer starts the moment the phone leaves your hand. If you throw it upward, the phone is weightless during the entire arc — up and down — so the timer runs from release to landing, not just from the apex. This inflates the calculated height and velocity. For accurate readings, release from rest (drop straight down).

**Calibration**  
The 30g crack threshold and the score formula are based on published egg-drop physics, not measured against a specific egg. The "test a real egg" feature in the history screen exists so a class can validate and calibrate against actual results over time.

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

### Architecture notes

- **`src/types/index.ts`** — single source of truth for `DropRecord`, `DropResult`, `Prediction`, and `RootStackParamList`. All screens and utilities import from here.
- **`src/utils/dropDetection.ts`** — self-contained state machine (waiting → freefall → impact). No React dependencies; pure logic, easily testable.
- **`src/utils/storage.ts`** — generic `getAll<T>` / `prepend<T>` / `removeById<T>` / `updateById<T>` helpers underneath typed public functions. Structured for a future API swap without touching call sites.

