# YouTube to MP3 Converter

A privacy-focused, self-hosted full-stack application to download YouTube videos and convert them to MP3 format. All data stays on your machine - nothing is sent to third-party services.

## Features

✅ **Privacy First**
- All data remains on your local machine
- No tracking or analytics
- No third-party service dependencies (except YouTube)

✅ **Easy to Use**
- Simple, intuitive web interface
- Paste YouTube URL and download MP3
- Queue multiple downloads for batch processing

✅ **Flexible Quality Options**
- 128 kbps (Low - Small file size)
- 192 kbps (Normal - Recommended)
- 256 kbps (High - Good quality)
- 320 kbps (Very High - Best quality)

✅ **Download Management**
- View download history with statistics
- Real-time download progress tracking
- Download completion notifications
- Delete downloaded files

✅ **Automatic Cleanup**
- Old files automatically deleted after 7 days
- Database records cleaned up automatically
- Configurable cleanup intervals

## System Requirements

### Prerequisites
- Node.js 16+ (with npm)
- FFmpeg (with libmp3lame for MP3 encoding)

### Installation

#### 1. Install System Dependencies

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install nodejs npm ffmpeg
```

**macOS:**
```bash
# Using Homebrew
brew install node ffmpeg
```

**Windows:**
- Download and install [Node.js 16+](https://nodejs.org/)
- Download and install [FFmpeg](https://ffmpeg.org/download.html)

#### 2. Clone or Download the Project

```bash
cd /path/to/yt-player
```

#### 3. Setup Backend

```bash
cd backend

# Install dependencies
npm install
```

#### 4. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install
```

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend

# Run Node.js server
npm start

# Or with auto-reload (requires nodemon):
npm run dev
```

The backend will be available at: `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend

# Start React development server
npm start
```

The frontend will be available at: `http://localhost:3000`

### Production Mode

#### Using Node.js directly

```bash
cd backend

# Run with Node.js
npm start
```

#### Building Frontend

```bash
cd frontend

# Create production build
npm run build

# The build folder contains static files to serve
```

Serve the `frontend/build` folder using nginx or another web server, and configure it to proxy API requests to the backend.

## Configuration

### Backend Configuration

Edit `backend/config.js` to customize settings:

```javascript
// File cleanup (days)
FILE_CLEANUP_DAYS: 7

// Cleanup interval (milliseconds)
FILE_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000

// Allowed audio qualities
ALLOWED_QUALITIES: ['128', '192', '256', '320']

// Default quality
DEFAULT_QUALITY: '192'

// Rate limiting (max downloads per minute per IP)
RATELIMIT_PER_MINUTE: 5

// CORS origins
CORS_ORIGINS: 'http://localhost:3000'
```

### Environment Variables

Create a `.env` file in the `backend` directory:

```bash
PORT=5000
NODE_ENV=development
SECRET_KEY=your-secret-key
CORS_ORIGINS=http://localhost:3000
LOG_LEVEL=info
```

### Frontend Configuration

The frontend uses `http://localhost:5000/api` for API calls. For production, update the API base URL in `frontend/src/services/api.js`:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

Or set the environment variable:
```bash
REACT_APP_API_URL=https://your-domain.com/api
```

## Project Structure

```
yt-player/
├── backend/               (Node.js/Express API)
│   ├── app.js            # Express application
│   ├── config.js         # Configuration
│   ├── database.js       # SQLite database
│   ├── package.json      # Node dependencies
│   ├── .env.example      # Environment template
│   ├── services/         # YouTube, converter, cleanup
│   ├── routes/           # Download, history endpoints
│   └── middleware/       # Rate limiting, etc.
│
├── frontend/              (React SPA)
│   ├── public/index.html
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.js
│   │   ├── components/    (4 React components)
│   │   ├── services/      (API client)
│   │   └── styles/        (Component CSS)
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml     (Full-stack deployment)
├── README.md             (This file)
├── start-dev.sh          (Linux/Mac setup)
├── start-dev.bat         (Windows setup)
└── .env.example
```

## API Endpoints

### Download Management

**Create Download**
- `POST /api/download`
- Body: `{ "url": "https://...", "quality": "192" }`
- Response: `{ "download_id": 1, "status": "pending" }`

**Get Download Status**
- `GET /api/download/<id>`
- Response: Download status, progress, error message

**Download File**
- `GET /api/download/<id>/file`
- Response: Binary MP3 file

**Delete Download**
- `DELETE /api/download/<id>`
- Response: Confirmation message

### History Management

**Get History**
- `GET /api/history?status=completed&limit=50&offset=0`
- Response: Array of downloads

**Get Statistics**
- `GET /api/history/stats`
- Response: Download statistics

**Get Recent**
- `GET /api/history/recent`
- Response: Last 10 completed downloads

**Clear History**
- `DELETE /api/history/clear?older_than_days=7`
- Response: Confirmation with deleted count

### Health Check

**Health Check**
- `GET /api/health`
- Response: `{ "status": "healthy" }`

## Troubleshooting

### FFmpeg not found
Ensure FFmpeg is installed and in your system PATH:
```bash
ffmpeg -version
```

### Port already in use
Change the port in `config.py` or run on a different port:
```bash
FLASK_PORT=5001 python app.py
```

### CORS errors
Update `CORS_ORIGINS` in `backend/config.py` to match your frontend URL.

### Database errors
Delete the `backend/instance/yt_converter.db` file to reset the database.

### Downloads not working
1. Check if FFmpeg is installed: `ffmpeg -version`
2. Check backend logs for errors
3. Ensure YouTube URL is valid
4. Try a different YouTube video

## Security Notes

- **No Data Leakage**: All downloads are processed locally
- **No Analytics**: No tracking or telemetry
- **Input Validation**: All URLs and inputs are validated
- **File Cleanup**: Old files are automatically deleted
- **HTTPS Recommended**: Use HTTPS in production
- **Secret Key**: Change `SECRET_KEY` in production

## Performance Tips

1. Use quality 192 kbps for best balance of size and quality
2. Run on SSD for faster conversion
3. Increase `RATELIMIT_PER_MINUTE` if you need more concurrent downloads
4. Use a reverse proxy (nginx) in production for better performance

## Limitations

- Downloads one video at a time (configurable)
- Limited to audio only (no video)
- Video must be publicly available on YouTube
- Very large videos may take time to download
- Bitrate conversion quality depends on source

## Future Enhancements

- [ ] Support for other formats (FLAC, WAV, OGG, M4A)
- [ ] Playlist bulk download
- [ ] YouTube channel download
- [ ] Mobile app version
- [ ] User accounts with cloud storage
- [ ] Scheduled downloads
- [ ] Download queue management
- [ ] Search YouTube directly from app
- [ ] Download metadata (artist, album art)
- [ ] Advanced audio settings

## License

This project is provided as-is for educational and personal use.

## Disclaimer

This tool is for downloading content you have rights to. Respect copyright laws and YouTube's Terms of Service. The creators are not responsible for misuse.

## Support & Contributions

For issues, feature requests, or contributions, please contribute to the project.

## Privacy & Terms

- **Your Data**: All data stays on your machine
- **No Collection**: We don't collect any usage data
- **No Tracking**: No analytics or tracking
- **Open Source**: Code is transparent and auditable

---

**Enjoy your private, secure YouTube to MP3 converter!** 🎵
