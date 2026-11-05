<div align="center">
  <img src="./public/favicon.svg" alt="TalentMatch ATS Logo" width="96" height="96" />
  <h1 align="center">TalentMatch ATS</h1>
  <p align="center">
    <strong>Enterprise Clinical Staffing &amp; AI Candidate Matching Platform</strong><br />
    <em>Built with React 18, TypeScript, Vite, Tailwind CSS, Zustand, and Electron Desktop integration</em>
  </p>

  <p align="center">
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-6.3-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
    <a href="https://www.electronjs.org/"><img src="https://img.shields.io/badge/Electron-Desktop-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron" /></a>
    <a href="https://ollama.com/"><img src="https://img.shields.io/badge/Ollama-Local_LLM-000000?style=for-the-badge&logo=ollama&logoColor=white" alt="Ollama" /></a>
  </p>

  <p align="center">
    <a href="#-overview">Overview</a> •
    <a href="#-brand-identity">Brand Identity</a> •
    <a href="#-key-capabilities">Key Capabilities</a> •
    <a href="#-desktop-app--local-ai">Desktop &amp; Local AI</a> •
    <a href="#-diagnostic-benchmark">Diagnostic Benchmark</a> •
    <a href="#-real-time-notifications--sound">Notifications &amp; Sound</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-author">Author</a>
  </p>
</div>

---

## 📖 Overview

**TalentMatch** is a clinical applicant tracking and intelligent talent-matching platform engineered specifically for hospital networks, travel nurse staffing, and high-acuity healthcare recruitment.

Healthcare staffing presents unique complexities: compact multi-state licensing, critical care certifications (BLS, ACLS, CCRN, TNCC, NRP), clinical tenure verification, and strict HIPAA-conscious data privacy. TalentMatch solves this by providing:

1. **Air-gapped local AI resume extraction** via on-device Ollama models (`llama3.2:3b`) or deterministic pattern matching.
2. **Continuous folder watching** with persistent operating system directory permissions.
3. **100% verified ground-truth clinical diagnostic testing** (`npm run benchmark`).
4. **Real-time OS background notifications** and Web Audio harmonic sound chimes for uninterrupted recruiter multitasking.
5. **Universal keyboard ergonomics** and high-contrast clinical themes.

---

## 🎨 Brand Identity

TalentMatch features an intentional, architectural visual identity rooted in executive clinical craft:

* **Dark Obsidian & Charcoal (`#0f172a` / `#090d16`)**: Grounded, high-contrast canvas designed for sustained clinical recruiting workflows without visual fatigue.
* **Crisp Pure White (`#ffffff`)**: High-contrast, razor-sharp typography and geometric letterforms with zero AI-generated rainbow gradients or artificial neon bloom.
* **The Precision Match Mark**: Two dynamic architectural brackets (representing Candidate Talent and Requisition Opportunity) converging upon a central match diamond point.
* **Executive Recruiter Presence**: A human, illustrated recruiter portrait for Jordan Rivera with active presence indicators (🟢 Available, 🟡 In Interview, ⚪ Away) and real-time clinical pipeline metrics.
* **Humanistic Typography**: Clean standard sans typography (`DM Sans` & system-ui) strictly avoiding overused generic tech defaults.

---

## ✨ Key Capabilities

### 🎯 1. Explainable Clinical Match Engine
* **Multi-Factor Scoring**: Evaluates candidate fit across specialty alignment (ICU, Trauma ER, Orthopedics, NICU), clinical tenure, geographic licensing, and credential requirements.
* **Transparent Breakdown**: Explains fit percentages for every factor rather than black-box AI scores.
* **Recruiter Actioning**: Instant one-click pipeline stage updates (`pending`, `reviewed`, `accepted`, `rejected`).

### 📂 2. Continuous Local Folder Watcher & Universal Ingestion
* **Multi-Strategy Document Parser**: Robust 4-tier document extraction (Mammoth, raw docx XML `<w:t>` tags, PDF.js spatial parsing, binary `BT ... ET` streams, and ASCII run scanner) that handles both pristine and irregular/multi-column resumes (e.g. `Anieth Daley`, `Ariane Kouassi`).
* **Sub-Second Speed**: High-throughput deterministic extraction operating in $< 1\text{ ms}$ at over 1.77M characters per second, with an automatic 12-second failover from cold local LLMs.
* **Live Facility Location Lookup**: Automatically queries the Wikipedia API in real-time to find missing city/state locations for healthcare facilities listed on candidate resumes (zero fabricated data).
* **Zero Repeated Dialogs**: Connects directly to local folders (e.g. `C:\Recruiting\Resumes\`) with background monitoring and automatic ingestion.

### 📊 3. Live Excel Requisition Importer (`.xlsx`, `.xls`, `.csv`)
* **Real Spreadsheet Ingestion**: Powered by `exceljs` — upload vendor requisition files (e.g. `JobVendors.xlsx`) via drag-and-drop or file picker.
* **Intelligent Auto-Mapping**: Automatically detects and matches varying vendor portal column names (`Job Title` $\rightarrow$ Position, `Discipline` $\rightarrow$ Specialty, `Site Location` $\rightarrow$ Facility, `City`, `State`, `Shift Type`, `Pay Rate`).
* **Instant Candidate Re-Matching**: Imported requisitions are saved directly to device storage and immediately re-scored against all active candidates.

### 👤 4. Executive Recruiter Workspace Hub
* **Duty Status Controls**: Toggle between **Available & Sourcing** (🟢), **In Clinical Interview** (🟡), or **Away** (⚪).
* **Live Pipeline Metrics**: Real-time counter of active requisitions, sourced clinicians, and match precision rate.
* **Recruiter Monogram Badge**: Distinctive clinical avatar with active duty pulse ring and credential verification tag.

### ⚡ 5. Universal Keyboard Shortcuts
* **Power-Recruiter Ergonomics**: Universal bindings for macOS (<kbd>⌘</kbd> / <kbd>⌥</kbd>) and Windows / Linux (<kbd>Ctrl</kbd> / <kbd>Alt</kbd>).
* **Sequence Navigation**: Two-key rapid jumps (<kbd>G</kbd> then <kbd>O</kbd>, <kbd>C</kbd>, <kbd>J</kbd>, <kbd>M</kbd>, <kbd>R</kbd>, <kbd>S</kbd>) with visual floating indicator.
* **Global Search**: <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> or <kbd>/</kbd> anywhere.
* **Cheat Sheet**: Press <kbd>?</kbd> anytime to open the modal cheat sheet.

---

## 💻 Desktop App & Local AI

TalentMatch can run in any modern web browser or as a native desktop application with full operating system privileges.

### 1-Step Terminal Launch (No manual binary download needed)

**Windows (PowerShell / Command Prompt):**
```powershell
git clone https://github.com/codewithabhiishek/TalentMatch.git ; cd TalentMatch ; npm install ; npm run electron
```

**macOS & Linux (Terminal):**
```bash
git clone https://github.com/codewithabhiishek/TalentMatch.git && cd TalentMatch && npm install && npm run electron
```

### Free Open-Source Local AI Model (Ollama)

Run 100% offline, private candidate extraction on your machine with Meta's Llama 3.2 3B:

```bash
# 1. Install Ollama Engine:
# Windows (Option A - Recommended CLI): winget install Ollama.Ollama
# Windows (Option B - Direct Installer): Download https://ollama.com/download/OllamaSetup.exe
# Windows (Option C - PowerShell):      powershell -Command "Invoke-WebRequest -Uri 'https://ollama.com/download/OllamaSetup.exe' -OutFile '$env:TEMP\OllamaSetup.exe'; Start-Process '$env:TEMP\OllamaSetup.exe' -Wait"
# macOS:                                brew install ollama (or download Ollama-darwin.zip)
# Linux:                                curl -fsSL https://ollama.com/install.sh | sh

# 2. Run Meta Llama 3.2 3B model (offline AI)
ollama run llama3.2:3b

# 3. For web browser CORS access, start Ollama with:
# Windows PowerShell: $env:OLLAMA_ORIGINS="*" ; ollama serve
# macOS / Linux:      OLLAMA_ORIGINS="*" ollama serve
```

---

## 🧪 Diagnostic Benchmark Suite

TalentMatch includes an automated diagnostic benchmark that validates the extraction pipeline against real clinical resumes with known medical ground truth, including multi-column layouts, messy formatting, and Strix XSS / prototype pollution vectors.

Run the automated CLI benchmark suite:
```bash
npm run benchmark
```

**Benchmark Results:**
```
================================================================
  TALENTMATCH AI EXTRACTION ENGINE: ACCURACY & SPEED BENCHMARK  
================================================================

[TEST 1/12]  ✓ ICU Critical Care Travel Nurse (Multi-credential)       -> 100%
[TEST 2/12]  ✓ Physical Therapist Orthopedics Specialist               -> 100%
[TEST 3/12]  ✓ Emergency Department Trauma RN                          -> 100%
[TEST 4/12]  ✓ Neonatal Respiratory Care Specialist                    -> 100%
[TEST 5/12]  ✓ Strix Security & Defensive Sanitization                 -> 100%
[TEST 6/12]  ✓ CRNA Advanced Practice Anesthetist                      -> 100%
[TEST 7/12]  ✓ Operating Room Perioperative Circulating Nurse          -> 100%
[TEST 8/12]  ✓ Speech-Language Pathologist Acute Neuro Rehab           -> 100%
[TEST 9/12]  ✓ Interventional Cardiology & Cath Lab Specialist         -> 100%
[TEST 10/12] ✓ Strix Prototype Pollution & Deep Payload Attack         -> 100%
[TEST 11/12] ✓ Irregular Docx with Dates in Name (Anieth Daley style)  -> 100%
[TEST 12/12] ✓ Messy Column Layout with Postal Top (Ariane Kouassi)    -> 100%

 OVERALL ACCURACY SCORE : 100% (12 / 12 Scenarios Passed)
 AVERAGE PARSING TIME   : < 1 ms per document
 TOTAL THROUGHPUT       : 1,770,000+ characters/second
 STRIX SECURITY AUDIT   : PASSED (Zero HTML/script leak, Prototype pollution blocked)
 SPREADSHEET IMPORTER   : REAL (.xlsx / .xls / .csv) with dynamic portal column auto-mapping
 FACILITY LOCATOR       : Live internet lookup via Wikipedia for missing hospital locations
```

The benchmark can also be run interactively inside the web application via the **Run Self-Test Benchmark** button in Resume Imports or Settings.

---

## 🔔 Real-Time Notifications & Sound

TalentMatch features an alert pipeline designed for multitasking recruiters:

1. **Native OS Desktop Notifications**: When background folder scans or resume extractions finish, TalentMatch pushes system alerts directly to the **Windows Action Center** or **macOS Notification Center**.
2. **Window Attention Cues**: Automatically flashes the Windows taskbar icon (`flashFrame(true)`) or bounces the macOS dock icon (`app.dock.bounce('informational')`). Clicking the notification restores and focuses the window.
3. **Synthesized Multi-Sound Chime Library**: 6 selectable, zero-latency audio chimes synthesized via the Web Audio API (zero external audio files or downloads required):
   - **Clinical Harmonic** (Default): Uplifting 2-tone medical chime (D5 $\rightarrow$ A5)
   - **Crystal Bell**: Bright 3-tone crystalline arpeggio with high shimmer decay
   - **Warm Marimba**: Resonant acoustic wooden percussion chords
   - **Zen Harp**: Soothing pentatonic harp pluck
   - **Radar Pulse**: High-tech frequency sweep sonar pulse
   - **Minimalist Pop**: Ultra-quick dual droplet micro-click
4. **Floating In-App Toast**: A slide-up card with 5-second auto-dismissal and a 1-click **"View details $\rightarrow$"** button.
5. **Interactive Controls**: Test the chime and system notifications anytime in **Settings $\rightarrow$ Notifications**.

### Updating an Existing Installation

If you already downloaded TalentMatch previously, pull the latest updates and dependencies with a single command:

**Windows (PowerShell):**
```powershell
git pull ; npm install ; npm run electron
```

**macOS / Linux:**
```bash
git pull && npm install && npm run electron
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/codewithabhiishek/TalentMatch.git
cd TalentMatch

# Install dependencies
npm install

# Run web development server
npm run dev

# Or run as native desktop application
npm run electron
```

### Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server with HMR |
| `npm run build` | Compiles optimized production bundle in `dist/` |
| `npm run typecheck` | Executes TypeScript type checking (`tsc --noEmit`) |
| `npm run benchmark` | Executes the 100% clinical extraction accuracy & speed benchmark |
| `npm run electron` | Launches the native Electron desktop application |
| `npm run build:win:portable` | Packages standalone Windows portable executable (`.exe`) |
| `npm run build:mac` | Packages macOS application bundle (`.dmg`) |

---

## 👤 Author

- **Developer**: [Abhishek Jain](https://github.com/codewithabhiishek)
- **GitHub**: [@codewithabhiishek](https://github.com/codewithabhiishek)
- **Repository**: [https://github.com/codewithabhiishek/TalentMatch](https://github.com/codewithabhiishek/TalentMatch)
- **Email**: socials.abhiishek@gmail.com
