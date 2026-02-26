# Coding Editor

An AI-powered desktop coding editor that scaffolds React Native projects using natural language prompts. Built with Tauri, React, FastAPI, and PydanticAI.

[![YouTube](https://img.shields.io/badge/YouTube-Part%201-red)](https://youtu.be/2GripaOtlbY)
![Tauri](https://img.shields.io/badge/Tauri-2.0-blue)
![Python](https://img.shields.io/badge/Python-3.11+-yellow)
![License](https://img.shields.io/badge/license-MIT-green)

## Series Roadmap
- **Part 1** — Scaffolding Agent + Expo Snack Preview ✅
- **Part 2** — Editor Agent *(coming soon)*
- **Part 3** — Collaboration with YJS *(coming soon)*
- **Part 4** — Release Build & Distribution *(coming soon)*

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Tauri 2.0 + Rust |
| Frontend | React + TypeScript |
| Backend | FastAPI + Python |
| AI | PydanticAI via OpenRouter |
| Preview | Expo Snack |

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)
- [Rust](https://rustup.rs/)
- [Python](https://www.python.org/) 3.11+
- [Poetry](https://python-poetry.org/)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/bjoxiah/coding-editor.git
cd coding-editor
```

### 2. Desktop App

```bash
cd app
pnpm install
pnpm tauri dev
```

### 3. Python Backend

```bash
cd backend
```

Create a `.env` file inside the `backend` folder:

```env
OPEN_ROUTER_API_KEY=your-openrouter-api-key
```

> Get your API key at [openrouter.ai](https://openrouter.ai)

Then start the server:

```bash
poetry install
poetry run serve
```

Both the desktop app and backend must be running simultaneously. Once up, open the desktop app, configure the API URL in settings, and start scaffolding.

## Project Structure

```
coding-editor/
├── app/                 # Tauri + React frontend
│   ├── src/             # React source
│   └── src-tauri/       # Rust backend
└── backend/             # FastAPI + PydanticAI agent
```

## Contributing

This project is under active development. Feel free to open issues or PRs — follow along with the series for context on what's coming next.

---

⭐ If you find this useful, star the repo and subscribe for the rest of the series!