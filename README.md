<div align="center">
<img width="1200" height="475" alt="McGill Exam Planner Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# McGill Exam Planner

**The unofficial tool for McGill students to search, organize, and export their exam schedule.**

[Live App](https://mcgill-exam-planner.netlify.app) · [Official McGill Exams Page](https://www.mcgill.ca/exams/)

</div>

---

## Overview

McGill Exam Planner lets students search for their Winter 2026 exam dates, build a personalized schedule, detect conflicts and hardships, and export directly to Apple Calendar, Google Calendar, or Outlook — all in one place.

> **Unofficial project.** Not affiliated with McGill University.

---

## Features

- **Course search** — Search by one or more course codes (e.g. `MATH 140, COMP 202, ECSE 206`)
- **Schedule builder** — Add and remove exams to build your personalized schedule in the sidebar
- **Conflict & hardship detection** — Automatically flags direct overlaps and McGill exam hardship scenarios (3+ exams within 24 hours)
- **Calendar export** — Export to Apple Calendar (ICS), Google Calendar, or Outlook with one tap
- **Historical data** — Browse past exam schedules for reference and planning
- **Building location lookup** — Click any building name to open its location in Google Maps
- **Saved searches** — Authenticated users can bookmark frequently searched courses
- **Dark / light theme** — Persisted per-device via `localStorage`
- **Guest mode** — Full schedule building without an account; schedule saved to `localStorage`
- **Account sync** — Authenticated users' schedules sync across devices via Supabase

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Backend / Auth | Supabase |
| Location Lookup | Google Gemini API |

---

## Getting Started

**Prerequisites:** Node.js

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set environment variables** — create a `.env.local` file in the project root:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```
   The Gemini key powers building location lookups. Supabase keys enable auth and cross-device schedule sync. The app works in guest mode without them.

3. **Start the dev server**
   ```bash
   npm run dev
   ```
   Opens at `http://localhost:3000`.

4. **Build for production**
   ```bash
   npm run build
   ```

---

## Project Structure

```
mcgill-exam-planner/
├── App.tsx                   # Root component — search, filtering, layout
├── index.tsx                 # App entry point
├── types.ts                  # Shared TypeScript interfaces (Exam, User, ViewMode)
├── constants.ts              # Winter 2026 exam data (CSV)
├── historical_data.ts        # Historical exam data (CSV)
├── components/
│   ├── SearchBar.tsx         # Search input with saved searches dropdown
│   ├── ExamCard.tsx          # Individual exam result card
│   ├── ScheduleSidebar.tsx   # Sidebar: schedule list, conflict alerts, export modal
│   ├── AuthModal.tsx         # Login / signup modal
│   └── ContactPage.tsx       # Feedback & contact page
├── context/
│   ├── AuthContext.tsx       # Auth state, login/signup/logout, Supabase sync
│   └── ThemeContext.tsx      # Light/dark theme state
├── lib/
│   └── supabase.ts           # Supabase client
└── utils/
    ├── helpers.ts            # Date parsing, conflict detection, ICS generation, calendar URLs
    └── gemini.ts             # Gemini API — building → Maps location
```

---

## Calendar Export

| Platform | Method |
|---|---|
| **Apple Calendar** | Web Share API (iOS) / `.ics` file download (desktop) |
| **Google Calendar** | Direct event creation link (opens pre-filled in Google Calendar) |
| **Outlook** | Direct event creation link (opens pre-filled in Outlook) |

On iOS (Safari), tapping "Download .ICS File" triggers the native share sheet — tap **Add to Calendar** to import all exams into Apple Calendar at once.

---

## Conflict Detection

The app checks for two schedule issues defined by McGill:

- **Conflict** — Two exams with overlapping time windows
- **Hardship** — Three or more exams starting within any 24-hour period

Affected courses are highlighted in the sidebar with a link to [McGill's deferral & conflict info](https://www.mcgill.ca/exams/dates/conflicts).

---

## Data

Exam data is sourced from the official McGill exam schedule and embedded directly in the app (no external API calls for exam data). The current dataset covers **Winter 2026** (last updated February 2026). Historical data from prior terms is also included for reference.
