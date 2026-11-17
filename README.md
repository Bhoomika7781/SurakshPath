# SurakshPath(सुरक्षापथ)
### Transparent Safe-Route Planning for Night Travel • Central Mangalore Prototype

> Built for the 24-hour hackathon. Works 100% locally with zero paid services, zero API keys, and bundled offline demo fallback corridors.

---

## 🌟 The Problem SurakshPath Solves
Standard navigation systems optimize solely for distance or travel time. For someone traveling alone at night, safety depends on **street lighting, active 24/7 public spaces, proximity to transit, verified help points (police & hospital ERs), recent verified incidents, and active road closures**.

**SurakshPath** introduces a transparent, risk-aware routing prototype that compares routes, explains the factors behind every safety score in plain words, updates instantly to dynamic real-time condition changes, and gives the user full control over the trade-off between safety and travel time.

---

## ⚖️ Fairness & Ethics Rules (Non-Stigmatizing Design)
Traditional safety heatmaps often paint entire neighborhoods red, creating systemic prejudice and stigmatizing communities. SurakshPath adheres strictly to 4 fairness tenets:
1. **Granular Segment Scoring (~50 m):** Evaluates physical variables (lighting, open shops, bus stops) on specific ~50 m segments right now—**never entire neighborhoods**.
2. **Half-Life Incident Decay (~30 Days):** Past incident reports fade exponentially over a 30-day half-life. Unverified citizen reports carry only a 25% weight discount. A single incident can never permanently brand a street.
3. **Sparse Data Shrinkage & Confidence Tags:** An absence of sensor data is never assumed to be danger. Sparse areas are flagged as **Low Confidence** and scores shrink toward a neutral baseline (50) with an explicit note: *"Limited data here; score adjusted toward neutral 50"*.
4. **Permanent Visible Reminder:** *"Scores describe current conditions on this route, not the people or the area."*

---

## ⚡ Quick Start (Under 60 seconds)

### Prerequisites
- Node.js (v18+) & npm

### Installation & Run
```bash
# 1. Install dependencies
npm install

# 2. Run unit tests
npm test

# 3. Start local development server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## ⏱️ 3-Minute Hackathon Demo Script

Follow these steps to demonstrate every requirement in under 3 minutes:

### 1. Show Fastest vs. Safest Route (10:00 PM Default)
- Observe the default trip: **Hampankatta (Clock Tower) → Kankanady Bypass**.
- **Route A (Via Balmatta & Bendorewell Corridor):** Scores **86/100** (Safest, high continuous lighting, passes 24x7 Apollo Pharmacy, MedPlus, and beat patrols).
- **Route B (Via Falnir Road):** Takes **5.6 minutes** (Fastest, scores **74/100**, slightly darker residential pocket).
- Point to the **Factor Breakdown panel**: Plain words explain: *"Route A scores higher because 82% of it is lit and passes 2 open pharmacies and a 24/7 hospital ER"*.

### 2. Move the Trade-off Slider ("Faster ↔ Safer")
- Move slider to **0% (Faster)**: Notice **Route B (Falnir Road)** immediately becomes the **#1 Recommended Route**.
- Move slider back toward **70%–100% (Safer)**: **Route A (Balmatta Arterial)** reclaims the **#1 Recommended** spot.
- Click **"How is this calculated?"** to show the live formula:
  $$\text{Combined Cost} = (1 - w) \times \text{normalisedTime} + w \times \text{normalisedRisk}$$

### 3. Real-Time Condition Change: "Close a Road"
- In the **Hackathon Demo Controls** drawer, click **"Close a Road"**.
- A simulated water main burst closes a segment on Balmatta Road.
- **Route A is immediately marked INFEASIBLE (0/100, dashed red line)**.
- The app automatically reroutes and elevates **Route B (Falnir Direct)** as the new recommended safe path.
- A high-visibility banner announces:
  *"Road closed on Balmatta Road. Rerouted. Route A blocked by excavation barrier. New recommended safe corridor: Via Falnir Road."*

### 4. Real-Time Condition Change: "Add Verified Incident"
- Click **"Add Verified Incident"**.
- A new verified report appears on the map as a localized dot near Falnir Avenue.
- The safety engine recalculates: note that the penalty is local to that segment and subject to the 30-day half-life decay.

### 5. Start Trip Simulation & Safety Anomaly Check
- Click **"Start Trip Simulation"** to watch the vehicle marker animate along the selected route.
- Click **"Simulate Unexpected Stop"** (or **"Simulate Deviation"**).
- The trip halts and triggers the safety monitor modal:
  *"Are you okay? We noticed an unexpected stop exceeding 20 seconds during your journey."*
- A **15-second countdown** begins.
- Click **"I Need Help (SOS)"** (or let it count down): An instant simulated encrypted SMS alert is broadcast to trusted contact **Priya (Sister)** with live coordinates `[12.8715, 74.8532]`.
- Click **"I'm Fine"** to dismiss and resume journey. Note the monitor toggle that keeps user in full control.

---

## 🧮 Multi-Factor Scoring Specification

Each route is subdivided into $\sim 50\text{ m}$ discrete segments. Within a $60\text{ m}$ buffer radius around each segment midpoint:

| Factor | Weight | Scoring Mechanism |
| :--- | :---: | :--- |
| **Continuous Lighting** | `25%` | Density & intensity of overhead smart street lights within 60 m buffer. |
| **Active Public Spaces** | `20%` | Venues open at query hour (24/7 pharmacies, open fuel stations, night food stalls). |
| **Help Points** | `20%` | Proximity to 24/7 hospital emergency rooms and police beat stations. |
| **Public Transit** | `15%` | Proximity to active bus stops and transit terminals. |
| **Incident Resilience** | `20%` | Absence of recent incidents, exponentially decayed: $\text{Decay} = 2^{-\Delta t / 30\text{ days}}$. |
| **Road Closures** | Critical | Any intersecting active closure flags the segment and renders the route **infeasible**. |

---

## 📱 Mobile & Desktop Ergonomics
- Responsive design tailored for **390 px mobile screen widths** (iPhone / Pixel) as well as full-screen desktop displays.
- Dark, map-friendly palette minimizes nighttime eye fatigue.
- Color is **never the sole indicator** of score: badges display numerical values (`86/100`), confidence levels (`High/Medium/Low`), and explanatory text.

---

## 🧪 Unit Tests
The pure functions for segmenting, distance calculation, time-of-night opening hours, incident half-life decay, sparse-data shrinkage, and ranking are tested with Vitest:
```bash
npm test
```
All 7 unit tests pass with zero failures.
