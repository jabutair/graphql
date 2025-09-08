# GraphQL Education Tracker ✨

A front-end app that displays student data (XP, Skills, Progress) from the university GraphQL API.  
Includes **JWT login**, **dark/light theme**, and **chart export**.

---

## 📸 Screenshots
> Place images in `/assets` with these filenames.

| Login | Dashboard (Info) |
|---|---|
| ![Login](assets/login.png) | ![Dashboard Info](assets/dashboard-info.png) |

| Charts (Top) | XP Over Time |
|---|---|
| ![Charts Top](assets/charts-top.png) | ![XP Over Time](assets/chart-line.png) |

---

## ✨ Features
- 🔐 **JWT login** (Basic → Bearer)
- 🧾 **Profile info**: ID, Name, Audit Ratio, Groups, XP totals (Go/JS/Module)
- 📊 **Charts**: Bar, Pie, Line — **export to PNG**
- 🌓 **Dark/Light theme** (saved in `localStorage`)
- 📱 **Responsive** UI

---

## 🚀 Quick Start

**Option A — Python (simple & built-in on macOS/Linux/WSL):**
```bash
git clone <your-repo-url>
cd <your-repo>
python3 -m http.server 5500
# Open: http://localhost:5500/
