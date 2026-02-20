# 🔧 Installation & Setup Guide

## What Changed?

We've updated the backend to use **yt-dlp directly** instead of an npm wrapper package. This is actually better because:

✅ More reliable - uses the system's yt-dlp
✅ Simpler dependencies - fewer npm packages
✅ Better control - direct command execution
✅ No npm package version conflicts

---

## 📦 System Requirements

### You Need to Install These:

1. **Node.js 16+** (with npm included)
2. **FFmpeg** (for MP3 encoding)
3. **yt-dlp** (YouTube downloader)

### Installation by OS:

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install nodejs npm ffmpeg
sudo apt-get install yt-dlp
```

#### macOS:
```bash
brew install node ffmpeg yt-dlp
```

#### Windows:
1. Download and install **Node.js** from https://nodejs.org/
2. Download and install **FFmpeg** from https://ffmpeg.org/download.html
3. Download and install **yt-dlp** from https://github.com/yt-dlp/yt-dlp/releases
   - Download the `.exe` file
   - Add the directory to your Windows PATH environment variable

---

## 🚀 Now Run Setup

After installing system dependencies:

```bash
# Linux/macOS
./start-dev.sh

# Windows
start-dev.bat
```

This will automatically install all npm packages (no more yt-dlp-wrap errors!).

---

## ⚙️ Start the Application

### Terminal 1 - Backend:
```bash
cd backend
npm start
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

Visit: **http://localhost:3000**

---

## ✅ Verification

Make sure everything is installed correctly:

```bash
node --version       # Should be v16 or higher
npm --version        # Should be installed
ffmpeg -version      # Should show FFmpeg version
yt-dlp --version     # Should show yt-dlp version
```

---

## ❓ Troubleshooting

### "yt-dlp is not installed"
If you get this error when trying to download, make sure yt-dlp is in your system PATH:

**Ubuntu/Debian:**
```bash
sudo apt-get install yt-dlp
which yt-dlp  # Should show the path
```

**macOS:**
```bash
brew install yt-dlp
which yt-dlp  # Should show the path
```

**Windows:**
- Download from: https://github.com/yt-dlp/yt-dlp/releases
- Run the `.exe` or extract and add to PATH
- Test: Open Command Prompt and type `yt-dlp --version`

### "Cannot find module" errors
If npm install still fails:

```bash
cd backend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### FFmpeg not found
```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Windows - Add FFmpeg to PATH after installation
```

---

## 📝 Backend Dependencies (Fixed)

Your `backend/package.json` now has these dependencies:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "fluent-ffmpeg": "^2.1.2",
    "sqlite3": "^5.1.6",
    "uuid": "^9.0.0",
    "dotenv": "^16.3.1"
  }
}
```

**NO MORE yt-dlp-wrap!** We use the system's yt-dlp directly.

---

## 🎯 What Happens During Download

1. User pastes YouTube URL in the web UI
2. Backend calls `yt-dlp --dump-json` to get video info
3. Backend shows video title in UI
4. User clicks download
5. Backend calls `yt-dlp` to download and convert to MP3
6. File is saved locally
7. User can download the MP3

All powered by the system's yt-dlp and FFmpeg!

---

**Ready to go! 🎵**
