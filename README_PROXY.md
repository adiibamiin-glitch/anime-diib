Local server + proxy for DIIB

Purpose
- Run a local Node.js server that serves the static site and proxies external video URLs (with Range support). This allows video playback to work inside the site without opening external pages and avoids many CORS restrictions.

Setup (Windows)
1. Install Node.js (v14+ recommended).
2. Open PowerShell at d:\DIIB
3. Install dependencies:

```powershell
npm install
```

4. Start the server:

```powershell
npm start
```

5. Open in browser:

http://localhost:8000/

Notes
- The player will automatically use `/proxy?url=...` for video sources. The proxy forwards Range headers so seeking works.
- If you deploy to a real server, you can run the same server.js there or implement an equivalent proxy on your hosting.
