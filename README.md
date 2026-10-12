# CampusConnect — Faculty & Student Coordination Board

A single-page React application that lets students request meetings with faculty members for specific academic reasons, and lets faculty reply, schedule, and track those visits — all in real time with `localStorage` persistence.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18 (JSX) |
| Build | Vite 6 |
| Styling | Plain CSS (`styles.css`) |
| State | React `useState` / `useEffect` |
| Persistence | `localStorage` + cross-tab sync via `storage` event |

---

## Features

- **Targeted Meeting Requests** — Students pick a specific faculty member (cabin auto-fills) and a reason: Project Review, Doubt Clarification, Internship / LOR, Attendance / Leave, Exam / Marks Query, or Lab / Research Help.
- **Dashboard Summary** — Live counts for Pending Requests, Available Faculty, Approved / Scheduled Meetings, and Completed Visits.
- **Quick Filters & Search** — Filter by reason, faculty, urgency level, or free-text keyword.
- **Request Workflow** — Submit → Faculty replies / schedules → Student marks met → Completed.
- **Faculty Quick Replies** — Pre-built reply templates ("I am in cabin now", "Come at 3:00 PM", "Tomorrow 10:30 AM") plus a free-text reply box.
- **Alternate Advisor Suggestions** — If the requested faculty hasn't replied, the app surfaces other faculty who handle the same topic.
- **My Meetings View** — Students see their own requests; faculty see requests assigned to them.
- **Notifications** — Unread-count badge, dropdown list, toast alerts on every status change.
- **Persistence & Expiry** — All data survives page refresh via `localStorage`; visits expire after 24 hours; cross-tab sync keeps multiple open tabs consistent.
- **Demo Reset** — One-click button to restore the seeded demo data.

---

## Project Structure

```
src/
├── data/
│   ├── faculty.json      # Faculty roster (name, cabin, topics, availability)
│   ├── students.json     # Student roster (name, roll number)
│   └── visits.json       # Seed visits & notifications for demo
├── App.jsx               # Entire app — state, logic, and all components
├── main.jsx              # React DOM entry point
└── styles.css            # All styles
index.html
vite.config.js
package.json
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Run locally

```bash
npm install
npm run dev
```

Open the URL shown by Vite (default: `http://localhost:5173`).

### Production build

```bash
npm run build      # outputs to dist/
npm run preview    # serves the dist/ build locally
```

---

## Roles

| Role | How to switch | What they can do |
|------|--------------|-----------------|
| **Student** | Select your name from the student dropdown | Submit visit notes, withdraw pending requests, mark meetings complete |
| **Faculty** | Select your name from the faculty dropdown | Reply to visit notes (quick or custom), edit replies, mark meetings completed |

---

## Data Flow

```
Student submits visit note
        │
        ▼
  Status: "Pending Reply"
        │
        ▼  Faculty sends reply
  Status: "Replied"
        │
        ▼  Student confirms meeting happened
  Status: "Completed"
```

Visits not acted on within 24 hours automatically move to **Expired**.

---

## License

MIT
