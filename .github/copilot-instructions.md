# Nihon - Japanese Kana Learning Application

## Project Overview
Nihon is a comprehensive web application designed for learning and practicing Japanese Hiragana and Katakana. It provides an interactive interface for users to test their knowledge, track their progress, and customize their learning experience.

### Main Technologies
- **Frontend**: [Next.js](https://nextjs.org/) (App Router), React 19, [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend**: Next.js API Routes
- **Database**: MySQL (managed via `mysql2/promise`)
- **Authentication**: Custom implementation using `bcryptjs`
- **State Management**: React Hooks and Context API
- **Internationalization**: Custom localization system with support for French and Japanese, including automatic Furigana (Ruby) generation for Kanji.

### Architecture
The project follows a modular structure within the Next.js App Router:
- `app/`: Contains page layouts, the main entry point, and API routes.
- `components/`: UI components for different screens (Auth, Game, Home, Profile, Score).
- `context/`: Global state management, primarily for localization.
- `hooks/`: Custom hooks for game logic, timers, and authentication state.
- `data/`: JSON files containing Kana definitions and Furigana mappings.
- `lib/`: Shared utility functions, including database connection logic.
- `locales/`: Translation files for supported languages.

---

## Building and Running

### Prerequisites
- Node.js (v18+ recommended)
- MySQL database

### Environment Variables
Create a `.env` file (or set environment variables) with the following:
```env
DB_HOST=your_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database_name
```

### Commands
- **Start Development Server**: `npm run dev`
- **Build for Production**: `npm run build`
- **Start Production Server**: `npm run start`
- **Linting**: `npm run lint`

---

## Development Conventions

### Localization and Furigana
The project uses a custom `LanguageProvider` (`context/LanguageContext.js`) for translations:
- Use `t("key.path")` for simple text translations.
- Use `tWithVars("key.path", { var: value })` for translations with dynamic variables.
- Use `tNode("key.path")` when Japanese text needs automatic Furigana (Ruby characters). It uses `data/furigana.json` for mapping.

### Game Logic
The core game engine is encapsulated in the `useKanaEngine` hook (`hooks/useKanaEngine.js`). This hook manages:
- Current screen state (`home`, `game`, `score`, `profile`).
- User session and authentication.
- Game configuration (mode, count, timer).
- Answer validation and score tracking.

### Components
- **Screen Components**: Components in `components/` ending in `Screen.js` represent major application states.
- **Utility Components**: `Furigana.js`, `Ruby.js`, and `Navbar.js` provide reusable UI elements.

### Database Operations
- All database queries should use the `query` helper from `lib/db.js`.
- SQL scripts for database initialization can be found in `scripts/`.

### Styling
- The project uses Tailwind CSS 4.
- `globals.css` contains global styles and theme variables.
- Dark mode is supported and managed via the `useDarkMode` hook.
