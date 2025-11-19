# Wheel of Life

Desktop application for tracking life areas, scores, and action items with a visual life wheel.

## Features

- 🎯 **Life Areas Management**: Create and manage different areas of your life
- 📊 **Score Tracking**: Record scores (0-10) for each area over time
- 📈 **Visual Life Wheel**: Interactive circular visualization of your life areas
- ✅ **Action Items**: Create and track action items to improve each area
- 📅 **History**: View evolution of scores over time with charts
- 💾 **Local Storage**: All data stored locally using SQLite

## Prerequisites

1. **Rust**: Install from [rustup.rs](https://rustup.rs/)
2. **Node.js**: Version 18 or higher

## Installation

1. **Clone/Download this repository**

2. **Install dependencies:**
```bash
npm install
```

3. **Run in development mode:**
```bash
npm run tauri:dev
```

4. **Build for production:**
```bash
npm run tauri:build
```

The installer will be in `src-tauri/target/release/bundle/`:
- macOS: `.dmg` file
- Windows: `.exe` installer
- Linux: `.AppImage` or `.deb`

## Usage

1. **Launch the app**
2. **Create life areas** (e.g., Health, Finance, Relationships)
3. **Record scores** for each area (0-10)
4. **View the life wheel** to see your current state
5. **Create action items** to improve areas with low scores
6. **Track progress** over time with history charts

## Data Storage

All data is stored locally in SQLite database at:
- `~/.roda-da-vida/data.db`

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Recharts
- **Desktop**: Tauri (Rust)
- **Database**: SQLite (rusqlite)

## License

MIT

## Author

Felipe Santos

