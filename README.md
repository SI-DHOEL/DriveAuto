# DriveSync 🚀 - Future Uplink

A modern, cyberpunk-themed Google Drive file upload manager built with vanilla JavaScript and glassmorphism UI.

## Features ✨

- **One-time OAuth2 Login** - Login once, token saved to localStorage, auto-login on page reload
- **Google Drive Integration** - Upload files, create folders, browse your Drive
- **Modern UI Design** - Cyberpunk aesthetic with neon colors, glassmorphism, and smooth animations
- **Drag & Drop Upload** - Intuitive file selection with drag-and-drop support
- **REST API Based** - Uses pure Google Drive REST API v3 (no dependency on gapi.client.load)
- **Dark/Light Modes** - Toggle between visual themes
- **Zen Mode** - Relaxing mode with ambient music and visual effects

## Setup 🔧

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Drive API
4. Create an OAuth 2.0 Web Application credential:
   - Add authorized JavaScript origins: `http://localhost:8888`
   - Add authorized redirect URIs: (leave empty for GIS flow)
5. Copy your **Client ID** and **API Key**

### 2. Update Credentials

Edit `script.js` and replace:
```javascript
const CLIENT_ID = 'YOUR_CLIENT_ID';
const API_KEY = 'YOUR_API_KEY';
```

### 3. Run Local Server

```bash
cd path/to/DriveSync
python -m http.server 8888
```

Then open: **http://localhost:8888**

## Architecture 🏗️

### Authentication Flow
- **GIS (Google Identity Services)** - Handles OAuth2 token acquisition
- **localStorage** - Stores token with 1-hour expiry
- **Auto-Login** - Detects valid token on page load, auto-logs in

### API Integration
- **Pure REST API** - Direct fetch calls to Google Drive API v3
- **No gapi.client** - Avoids discovery docs issues (502 errors)
- **Direct Headers** - Manual Authorization bearer tokens

### File Operations
1. **List Folders** - `GET /files?q=mimeType='folder'`
2. **Create Folder** - `POST /files` with folder metadata
3. **Upload File** - `POST /upload?uploadType=multipart` with metadata + file content

## File Structure 📁

```
DriveSync/
├── index.html      # Main HTML structure
├── script.js       # All JavaScript logic
├── style.css       # Modern glassmorphism styling
├── music/          # Background music files
├── sound/          # UI sound effects
└── README.md       # This file
```

## Troubleshooting 🛠️

### Error: "API discovery response missing required fields"
- ✅ Fixed in current version - uses pure REST API instead of discovery docs

### Error: "502 Bad Gateway" on Drive API calls
- ✅ Fixed - no longer depends on discovery docs endpoint

### Token not persisting
- Check browser localStorage is enabled
- Check token expiry (localStorage keys: `drivesync_access_token`, `drivesync_token_expiry`)

### Folders not loading
- Verify OAuth scope includes `https://www.googleapis.com/auth/drive.file`
- Check browser console for API errors
- Verify API key is valid in Google Cloud Console

## Version

**V.3.1** - Final release with pure REST API architecture

## Author

**SI DHOELL** - Architect

---

Made with ❤️ using vanilla JS, CSS, and Google APIs
