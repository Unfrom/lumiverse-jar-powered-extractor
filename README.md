# JAR Janitor Character Ripper for Lumiverse

A Lumiverse extension that integrates [JAR (Janitor AI Ripper)](https://github.com/alpha-omicron/JAR) into Lumiverse, allowing you to **search**, **extract**, and **import** public and private JanitorAI character cards & lorebooks with one click.

---

## Features

- **Live JanitorAI Search**: Search character cards directly from Lumiverse by name, trope, or tags.
- **Card Catalog Grid**: View character avatars, creators, descriptions, and stats.
- **One-Click Extract & Import**:
  - Automatically parses public definitions or triggers Cloudflare-cleared prompt capture in JAR for private definitions.
  - Recovers character name, description, personality, scenario, first message, example dialogues, alternate greetings, and tags.
  - Automatically extracts and converts attached lorebooks / world info into native Lumiverse World Books.
  - Uploads the character avatar directly into Lumiverse's asset library.
- **Direct URL / UUID Ripper**: Paste any JanitorAI or Saucepan character URL or UUID to inspect and rip.
- **Capture History**: Revisit and re-import previously scraped characters from JAR's local storage.

---

## Setup Guide

### Step 1: Start the Local JAR Service
1. Open your terminal in the cloned JAR folder:
   ```bash
   cd C:/Users/labso/Documents/JAR
   npm install
   npm start
   ```
2. JAR will start its local API at `http://localhost:4577`.
3. If not already logged into JanitorAI, log in via the JAR browser prompt so Cloudflare clearance and sessions persist in `user-data/`.

### Step 2: Install the Extension in Lumiverse
1. The extension files are pre-built in `C:/Users/labso/Documents/lumiverse-jar-extractor`:
   - `spindle.json` (Manifest)
   - `dist/backend.js` (Backend module)
   - `dist/frontend.js` (Frontend module)
2. In Lumiverse, open **Extensions** → **Install Local Extension** (or point to `C:/Users/labso/Documents/lumiverse-jar-extractor`).
3. Grant the requested permissions:
   - `characters` (to create imported cards)
   - `world_books` (to import lorebooks)
   - `images` (to store avatars)
   - `cors_proxy` (to communicate with local JAR at `localhost:4577`)

### Step 3: Usage
1. Open the **JAR** drawer tab in Lumiverse's left sidebar.
2. Search for any character (e.g. `maid`, `detective`, `fantasy`).
3. Click **"Rip & Import"** on any card.
4. The character is saved to your Lumiverse character list, complete with avatar and attached world book!
