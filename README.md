# GraphQL Education Tracker

A front-end app that displays student data (XP, Skills, Progress) from the university GraphQL API.  
Includes **JWT login**, **dark/light theme**, and **chart export**.

---

## Table of Contents
- [Screenshots](#screenshots)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
  
---

## Screenshots

> Place images in `/assets`. Filenames below must match.

| Login | Dashboard (Info) |
|---|---|
| ![Login](assets/login.png) | ![Dashboard Info](assets/dashboard-info.png) |

| Charts |
|---|---|
| ![Charts Top](assets/charts-top.png) | ![XP Over Time](assets/chart-line.png) |

---

## Features
- **JWT Login**: Basic auth → JWT (Bearer) for GraphQL requests.
- **Profile Info**: ID, Name, Audit Ratio, Groups, and XP totals (Go/JS/Module).
- **Charts**: Bar (XP by project), Pie (skills), Line (XP over time) — **export to PNG**.
- **UI/UX**: Clean, responsive layout; **dark/light** mode persisted in `localStorage`.
- **No HTML injection**: JS only binds data to existing nodes and renders charts.

---

## Architecture
- **Vanilla HTML/CSS/JS** — small, dependency-light.
- **Axios** for HTTP; **Chart.js** for visualizations.
- **CSS controls chart heights** (prevents stretching) with fixed canvas heights.
- **Theme toggle**: adds/removes `.dark` on `<body>`; value saved in `localStorage`.
- **Auth flow**:
  1. Basic auth → `POST /api/auth/signin` → JWT.
  2. GraphQL queries via `POST /api/graphql-engine/v1/graphql` with `Authorization: Bearer <JWT>`.

---

## Getting Started

Some browsers block network requests from `file://`. Use a simple local server:

```bash
# Clone
git clone <your-repo-url>
cd <your-repo>

# Serve (choose one)
python3 -m http.server 5500
# or: npm i -g http-server && http-server -p 5500

# Open
# http://localhost:5500/
