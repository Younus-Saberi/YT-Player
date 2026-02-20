# 🎵 YouTube to MP3 Converter - Quick Start Guide

## Pure JavaScript Full-Stack Application
**Backend:** Node.js + Express  
**Frontend:** React  
**Database:** SQLite  
**No Python Required!**

---

## 📋 Prerequisites

Install only these two things on your system:

1. **Node.js 16+** (includes npm)
   - Download from: https://nodejs.org/
   
2. **FFmpeg** (for audio conversion)
   - **Ubuntu/Debian:** `sudo apt-get install ffmpeg`
   - **macOS:** `brew install ffmpeg`
   - **Windows:** Download from https://ffmpeg.org/download.html

---

## 🚀 Quick Start (5 minutes)

### Step 1: Initial Setup
```bash
# Linux/macOS
./start-dev.sh

# Windows
start-dev.bat
```

This will automatically install all npm dependencies for both backend and frontend.

### Step 2: Start the Backend (Terminal 1)
```bash
cd backend
npm start

# Or with auto-reload during development:
npm run dev
```

Backend will be available at: **http://localhost:5000**

### Step 3: Start the Frontend (Terminal 2)
```bash
cd frontend
npm start
```

Frontend will be available at: **http://localhost:3000**

---

## 📁 What You Get

### Backend (Node.js/Express)
- **app.js** - Main Express server with all routes
- **config.js** - Configuration management
- **database.js** - SQLite database wrapper
- **services/youtube.js** - YouTube download service using yt-dlp
- **services/converter.js** - FFmpeg MP3 conversion
- **services/cleanup.js** - Automatic file cleanup
- **routes/download.js** - Download API endpoints
- **routes/history.js** - History & statistics endpoints
- **middleware/rateLimit.js** - Rate limiting protection

### Frontend (React)
- **Downloader** Component - URL input & download interface
- **ProgressBar** Component - Real-time progress tracking
- **DownloadHistory** Component - View & manage downloads
- **QualitySelector** Component - Audio quality selection
- Beautiful responsive UI with gradient design

---

## ✨ Features Implemented

✅ Download YouTube videos as MP3  
✅ Multiple audio quality options (128-320 kbps)  
✅ Queue multiple downloads for batch processing  
✅ Real-time progress tracking  
✅ Download history with statistics  
✅ Automatic cleanup of old files after 7 days  
✅ Privacy-first (no external tracking/analytics)  
✅ Input validation and error handling  
✅ Rate limiting (5 downloads/minute per IP)  
✅ Beautiful, responsive web UI  

---

## 🔧 Configuration

### Backend Port
Edit `backend/config.js` or set `PORT` environment variable:
```bash
PORT=5000
```

### Audio Quality (Default: 192 kbps)
Options: 128, 192, 256, 320 kbps

### File Cleanup
- Default: Delete files older than 7 days
- Edit `FILE_CLEANUP_DAYS` in `backend/config.js`

---

## 📚 API Endpoints

All endpoints start with: `http://localhost:5000/api`

### Download Operations
- `POST /download` - Create new download
- `GET /download/<id>` - Get download status
- `GET /download/<id>/file` - Download MP3 file
- `DELETE /download/<id>` - Delete download

### History & Statistics
- `GET /history` - View download history
- `GET /history/stats` - Get statistics
- `GET /history/recent` - Get last 10 downloads
- `DELETE /history/clear` - Clear old downloads

### Health Check
- `GET /health` - Check if API is running

---

## 🛠️ Troubleshooting

### FFmpeg not found
```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Windows - Add to PATH after installing
```

### Port 5000 already in use
```bash
# Change port
PORT=5001 npm start
```

### npm install fails
```bash
# Clear npm cache
npm cache clean --force
npm install
```

### Can't connect to API
- Ensure backend is running on port 5000
- Check CORS_ORIGINS in backend/config.js matches frontend URL

---

## 📦 Project Structure

```
yt-player/
├── backend/              (Node.js/Express API)
│   ├── app.js
│   ├── config.js
│   ├── database.js
│   ├── package.json
│   ├── services/
│   ├── routes/
│   └── middleware/
├── frontend/             (React SPA)
│   ├── src/
│   ├── public/
│   └── package.json
├── start-dev.sh          (Linux/macOS automatic setup)
├── start-dev.bat         (Windows automatic setup)
└── README.md
```

---

## 🚢 Deployment

### Docker (Single command)
```bash
docker-compose up
```

### Manual Production Deployment
1. Build frontend: `cd frontend && npm run build`
2. Deploy `/frontend/build` to a web server (nginx, Apache)
3. Configure proxy to `/api` → `localhost:5000`
4. Run backend on stable Node.js server
5. Set `NODE_ENV=production` in backend

---

## 📝 Environment Variables

Create `.env` file in backend directory:
```bash
PORT=5000
NODE_ENV=development
SECRET_KEY=your-secret-key
CORS_ORIGINS=http://localhost:3000
LOG_LEVEL=info
```

---

## ⚙️ Development Commands

```bash
# Backend
cd backend
npm start              # Production mode
npm run dev            # Development with auto-reload
npm install            # Install dependencies

# Frontend
cd frontend
npm start              # Development server
npm run build          # Production build
npm test               # Run tests
npm install            # Install dependencies
```

---

## 🔒 Security Features

- No tracking or analytics
- No data sent to third-party services
- Input validation on all endpoints
- Rate limiting to prevent abuse
- Automatic deletion of old files
- SQLite database (local, encrypted if needed)
- HTTPS ready for production

---

## 📞 Support

All issues are typically related to:

1. **FFmpeg not installed** - Follow installation steps above
2. **Node.js version** - Ensure Node 16+ installed (`node --version`)
3. **Port conflicts** - Change PORT in config.js
4. **CORS errors** - Update CORS_ORIGINS in backend/config.js

---

## 🎓 Learning Resources

- Express.js: https://expressjs.com/
- React: https://react.dev/
- SQLite: https://www.sqlite.org/
- yt-dlp: https://github.com/yt-dlp/yt-dlp
- FFmpeg: https://ffmpeg.org/

---

**Happy downloading! 🎵**
