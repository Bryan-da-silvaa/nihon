# Nihon - All-in-One Japanese Learning Platform

## Project Overview
Nihon is a premium, full-stack web application designed for mastering the Japanese language. It combines modern pedagogical techniques with advanced technology to provide a seamless learning journey.

### Core Pillars
- **SRS Foundations**: Mastery of Hiragana and Katakana through an intelligent Spaced Repetition System (SRS).
- **Advanced Analytics**: Detailed tracking of progress via mastery heatmaps, accuracy charts, and historical session data.
- **Immersion Hub**: A sophisticated media player for video and audio content, featuring interactive transcriptions (Whisper-powered), A-B looping, and cinematic viewing modes.
- **Linguistic Engine**: Automatic Furigana (Ruby) generation and Romaji conversion for immersive study.
- **JLPT Progression**: Structured paths for Kanji and Vocabulary from N5 to N1.

---

## Technical Stack

### Frontend & Backend
- **Framework**: [Next.js](https://nextjs.org/) 16.2.4 (App Router)
- **Runtime**: React 19
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with custom cinematic animations.
- **Linguistics**: `kuroshiro` & `kuromoji` for Japanese text processing.

### Data & Infrastructure
- **Database**: MySQL (handled via `mysql2/promise`)
- **Persistence**: Custom SQL-based maintenance tools (Import/Export).
- **Media**: Integrated Whisper API support for synchronized transcriptions.
- **Authentication**: Secure custom implementation with `bcryptjs`.

---

## Architecture & Project Structure

The project follows a modular, screen-based architecture within the Next.js App Router:

- `app/`: Routing, layout, and API endpoints (Score tracking, Admin, Whisper sync, Profile).
- `components/`: UI layer, categorized by state:
  - `*Screen.js`: High-level screens (Home, Game, Library, Player, Profile, Admin).
  - `Utility`: Reusable elements like `Furigana.js`, `Ruby.js`, and `Navbar.js`.
- `hooks/`: Business logic extraction:
  - `useKanaEngine.js`: Global state, game orchestration, and SRS logic.
  - `useGameTimer.js`: Precision timing for sessions.
- `context/`: `LanguageContext.js` for custom localization and Furigana injection.
- `lib/`: Core utilities including `db.js` (MySQL query helper) and `kana.js` (Linguistic constants).
- `data/`: Static mappings for Kana and Furigana.

---

## Development & Deployment

### Prerequisites
- Node.js v18+
- MySQL Instance

### Environment Setup
Create a `.env` file:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=nihon
```

### Commands
- `npm run dev`: Start development server (Port 3000).
- `npm run build`: Production optimization.
- `npm run start`: Production server launch.

---

## Key Conventions

### 1. Localization & Furigana
The system uses a custom provider (`context/LanguageContext.js`):
- `t("key.path")`: Simple translations.
- `tWithVars("key", { var: value })`: Dynamic variables.
- `tNode("key")`: Japanese text with automatic Furigana injection.

### 2. Player Experience (Immersion)
The `PlayerScreen.js` is built for immersion:
- **Cinema Mode (`T`)**: Expands video to full width.
- **Fullscreen Hub (`H`)**: Toggles a sleek transcription overlay in fullscreen.
- **Scrubbing**: Click and drag on the progress bar for precise navigation.
- **Shortcuts**: `Space` (Play/Pause), `F` (Fullscreen), `Arrows` (Seek/Volume).

### 3. Database Maintenance
Admin tools are located in `AdminScreen.js`:
- **SQL Export**: Generates a full database dump.
- **SQL Import**: Destructive restoration from a `.sql` file.

### 4. Styling System
- Uses Tailwind CSS 4 with `@theme` variables in `globals.css`.
- Support for smooth transitions and dark mode is deeply integrated.
