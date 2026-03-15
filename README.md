# Coding Editor

An AI-powered desktop coding editor that scaffolds React Native projects using natural language prompts. Built with Tauri, React, FastAPI, and PydanticAI.

[![YouTube](https://img.shields.io/badge/YouTube-TutorialSeries-red)](https://youtu.be/2GripaOtlbY)
![License](https://img.shields.io/badge/license-MIT-green)

## Series Roadmap

- **Part 1** — Scaffolding Agent + Expo Snack Preview ✅
- **Part 2** — Editor Agent ✅
- **Part 3** — Collaboration with YJS ✅
- **Part 4** — Release Build & Distribution ✅

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Tauri 2.0 + Rust |
| Frontend | React + TypeScript |
| Backend | FastAPI + Python |
| AI | PydanticAI via OpenRouter |
| Preview | Expo Snack |
| Collaboration | Node.js + YJS |

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)
- [Rust](https://rustup.rs/)
- [Python](https://www.python.org/) 3.11+
- [Poetry](https://python-poetry.org/)

---

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

### 4. Socket Server

```bash
cd socket
```

Create a `.env` file inside the `socket` folder:

```env
PORT=your-port
```

Then start the server:

```bash
pnpm dev
```

Update the WebSocket URL in the app by clicking the gear icon on the **Editor** page.

### 5. Running the frontend on the web (optional)

If you want to run the React frontend without the Rust backend:

```bash
cd app && pnpm dev --port 1421
```

---

## Project Structure

```
coding-editor/
├── app/                        # Tauri + React desktop app
│   ├── src/                    # React source
│   └── src-tauri/              # Rust backend + Tauri config
│       ├── tauri.conf.json     # App config, CSP, updater
│       ├── icons/              # Auto-generated app icons
│       └── Cargo.toml          # Rust dependencies
├── backend/                    # FastAPI + PydanticAI agent
├── socket/                     # Node.js YJS collaboration server
└── .github/
    └── workflows/
        └── release.yml         # CI/CD release pipeline
```

---

## Architecture

```
React (webview)
  │
  ├── invoke() ──→ Rust ──→ FastAPI backend    (not subject to CSP)
  │
  └── new WebSocket() ──→ YJS socket server    (must be whitelisted in CSP)
```

All FastAPI calls are routed through Rust commands — the webview never calls FastAPI directly. Only the YJS WebSocket connection is made directly from React, so only that URL needs to be in the CSP.

---

## Production Release

This section documents how to build and ship a signed, auto-updating release using GitHub Actions.

### How it works

The `backend/` and `socket/` folders are server-side services — they are not bundled into the Tauri binary and deploy separately. The GitHub Actions release workflow only builds the `app/` folder.

Each release is triggered by pushing a git tag. The workflow builds the app across all platforms in parallel, signs the macOS binary, and uploads all artifacts plus a `latest.json` updater manifest to a GitHub Release.

---

### Step 1 — Generate app icons

I get my source icon image from https://icon.kitchen which usually comes as a `.icns` image then I convert to `.png` by running this:

```bash
sips -s format png ~/Desktop/your-icon.icns --out ~/Desktop/source.png
```
I copy the image to the icons folder inside `src-tauri` and then run this from inside the `app/` folder:

```bash
pnpm tauri icon src-tauri/icons/source.png
```

This auto-generates all required icon sizes into `app/src-tauri/icons/`. No manual changes to `tauri.conf.json` are needed — the config already points to these paths by default.

---

### Step 2 — Configure CSP

The CSP (Content Security Policy) controls what network connections the Tauri webview is allowed to make. Since all FastAPI calls go through Rust, only the YJS WebSocket URL and the images url need to be listed.

In `app/src-tauri/tauri.conf.json`:

```json
"app": {
  "security": {
    "csp": "default-src 'self'; connect-src 'self' ws://localhost:1234 https://*.amazonaws.com; img-src 'self' blob: data: https://*.amazonaws.com https://api.qrserver.com; style-src 'self' 'unsafe-inline'"
  }
}
```

Replace `1234` with the port your YJS socket server runs on.

When you deploy the socket server, update this to use your real domain:

```json
"connect-src 'self' wss://socket.yourapp.com"
```

> Note: `ws://` (local) becomes `wss://` (production) once your server is behind HTTPS.

---

### Step 3 — Configure the updater

#### 3a. Generate the signing key pair

Run this once from inside the `app/` folder:

```bash
pnpm tauri signer generate -w ~/.tauri/release.key
```

Set a password when prompted and write it down. This creates two files:
- `~/.tauri/release.key` — private key (never commit this)
- `~/.tauri/release.key.pub` — public key

Get the public key:

```bash
cat ~/.tauri/release.key.pub | pbcopy
```

#### 3b. Update tauri.conf.json

Add the updater config to `app/src-tauri/tauri.conf.json`:

```json
"plugins": {
  "updater": {
    "pubkey": "PASTE_PUBLIC_KEY_HERE",
    "endpoints": [
      "https://github.com/YOUR_USERNAME/YOUR_REPO/releases/latest/download/latest.json"
    ]
  }
}
```

Replace `YOUR_USERNAME` and `YOUR_REPO` with your actual GitHub username and repo name.

#### 3c. Install the updater plugin

From inside the `app/` folder:

```bash
pnpm tauri add updater
```

This automatically updates `Cargo.toml` and registers the plugin. Confirm `app/src-tauri/Cargo.toml` now contains:

```toml
tauri-plugin-updater = "2"
```

And that your `lib.rs` registers it:

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_updater::Builder::new().build())
```

---

### Step 4 — Apple code signing (macOS)

Without signing, macOS Gatekeeper blocks your app entirely on other machines. Notarized apps open without any warnings.

#### 4a. Create a Developer ID Application certificate

1. Go to [developer.apple.com/account](https://developer.apple.com/account) → **Certificates, Identifiers & Profiles** → **Certificates** → click **+**
2. Select **Developer ID Application** → click **Continue**
3. Before uploading, generate a CSR on your Mac:
   - Open **Keychain Access** → top menu → **Certificate Assistant** → **Request a Certificate from a Certificate Authority**
   - Fill in your email and name, select **Saved to disk**, click **Continue**
   - Save the `.certSigningRequest` file to your Desktop
4. Back in the browser, select **G2 Sub-CA (Xcode 11.4.1 or later)**, upload the CSR file, click **Continue**
5. Download the resulting `developerID_application.cer` and double-click it to install into Keychain

#### 4b. Export as .p12

1. Open **Keychain Access** → **My Certificates**
2. Find **Developer ID Application: Your Name (TEAMID)**
3. Expand it — confirm a private key is nested underneath
4. Right-click the certificate → **Export** → save as `certificate.p12` on your Desktop
5. Set a strong password when prompted — this becomes `APPLE_CERTIFICATE_PASSWORD`

#### 4c. Encode for GitHub

```bash
base64 -i ~/Desktop/certificate.p12 | pbcopy
```

#### 4d. Get your app-specific password

1. Go to [appleid.apple.com](https://appleid.apple.com) → **Sign-In and Security** → **App-Specific Passwords** → **Generate**
2. Name it `tauri-ci` or whatever makes sense to you → copy the `xxxx-xxxx-xxxx-xxxx` password

---

### Step 5 — Add GitHub secrets

Go to your repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

Add all of the following:

| Secret | Value | Where to get it |
|--------|-------|-----------------|
| `APPLE_CERTIFICATE` | base64 encoded .p12 | Step 4c above |
| `APPLE_CERTIFICATE_PASSWORD` | .p12 export password | Step 4b above |
| `APPLE_ID` | your Apple developer email | your Apple account |
| `APPLE_PASSWORD` | app-specific password | Step 4d above |
| `APPLE_TEAM_ID` | 10-char ID e.g. `AB12CD34EF` | [developer.apple.com/account](https://developer.apple.com/account) → Membership |
| `TAURI_SIGNING_PRIVATE_KEY` | contents of `~/.tauri/release.key` | run `cat ~/.tauri/release.key` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | password set in Step 3a | what you wrote down |

> `GITHUB_TOKEN` does not need to be added — it is provided automatically by GitHub Actions on every run.

---

### Step 6 — Create the release workflow

Create the file `.github/workflows/release.yml` in your repo:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    permissions:
      contents: write

    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: macos-latest
            args: '--target aarch64-apple-darwin'
          - platform: macos-latest
            args: '--target x86_64-apple-darwin'
          - platform: ubuntu-22.04
            args: ''
          - platform: windows-latest
            args: ''

    runs-on: ${{ matrix.platform }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: aarch64-apple-darwin

      - name: Install Linux dependencies
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y \
            libwebkit2gtk-4.1-dev \
            libappindicator3-dev \
            librsvg2-dev \
            patchelf

      - name: Install frontend dependencies
        working-directory: app
        run: pnpm install

      - name: Build and release
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
          APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
          APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        with:
          projectPath: app
          tagName: ${{ github.ref_name }}
          releaseName: 'v__VERSION__'
          releaseBody: 'See changelog for details.'
          releaseDraft: true
          prerelease: true
          args: ${{ matrix.args }}
```

---

### Step 7 — Versioning

The version in `app/src-tauri/tauri.conf.json` is the source of truth. To avoid updating it manually, point it at your `package.json`:

```json
{
  "version": "../package.json"
}
```

Then bump with:

```bash
cd app
pnpm version patch   # 1.0.0 → 1.0.1
```

---

### Step 8 — Trigger a release

Commit everything and push, then tag:

```bash
git add .
git commit -m "chore: configure production release"
git push origin main

git tag v1.0.0-beta.1
git push origin v1.0.0-beta.1
```

The tag push triggers the workflow. Go to the **Actions** tab to watch it run across all 4 platform runners in parallel (~15 minutes). When complete, a draft release appears in **Releases** with all artifacts attached:

```
YourApp_1.0.0_aarch64.dmg          ← macOS Apple Silicon
YourApp_1.0.0_x64.dmg              ← macOS Intel
YourApp_1.0.0_x64-setup.exe        ← Windows
YourApp_1.0.0_amd64.deb            ← Linux Debian
YourApp_1.0.0_amd64.AppImage       ← Linux universal
latest.json                         ← auto-updater manifest
```

Review then click **Publish release**.

---

### Deleting and redoing a beta tag

```bash
git tag -d v1.0.0-beta.1                   # delete locally
git push origin --delete v1.0.0-beta.1    # delete from GitHub
```

Then retag and push again. Only do this with beta/prerelease tags — never delete a real release tag.

---

### Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| macOS runner fails on signing | `APPLE_CERTIFICATE` is malformed | Re-run `base64 -i certificate.p12` and re-paste the secret |
| Notarization timeout | Apple servers are slow | Re-run the failed job |
| App blocked by Gatekeeper on install | Not signed or not notarized | Ensure all 5 Apple secrets are set correctly |
| YJS connection refused in app | URL not in CSP | Add the WebSocket URL to `connect-src` in `tauri.conf.json` |
| `latest.json` missing from release | Updater plugin not configured | Confirm `pnpm tauri add updater` was run and `pubkey` is set |

---

## Contributing

This project is under active development. Feel free to open issues or PRs.

---

⭐ If you find this useful, star the repo and subscribe for the rest of the series!