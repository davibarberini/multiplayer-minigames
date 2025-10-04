# Network Setup Guide - Connecting via IP

This guide explains how to connect to the multiplayer mini-games from other devices on your local network.

## 🔧 Configuration Changes Made

### Frontend (Vite)

- ✅ Configured to listen on all network interfaces (`host: true`)
- ✅ Port: 8080

### Backend (Node.js)

- ✅ Configured to listen on all network interfaces (`0.0.0.0`)
- ✅ CORS configured to allow all origins in development
- ✅ Port: 3001

## 📱 How to Connect from Other Devices

### Step 1: Find Your Machine's IP Address

#### On macOS/Linux:

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

#### On Windows:

```bash
ipconfig
```

Look for your local IP address (usually starts with `192.168.x.x` or `10.0.x.x`)

Example: `192.168.1.100`

### Step 2: Configure Frontend Environment Variable

Create a `.env` file in the `minigames-frontend` directory:

```bash
cd minigames-frontend
touch .env
```

Add this line (replace `YOUR_IP` with your actual IP):

```env
VITE_SERVER_URL=http://YOUR_IP:3001
```

Example:

```env
VITE_SERVER_URL=http://192.168.1.100:3001
```

### Step 3: Restart Both Servers

**Terminal 1 - Backend:**

```bash
cd minigames-backend
yarn dev
```

**Terminal 2 - Frontend:**

```bash
cd minigames-frontend
yarn dev
```

### Step 4: Connect from Other Devices

On other devices on the same network:

1. Open a browser
2. Navigate to: `http://YOUR_IP:8080`

   Example: `http://192.168.1.100:8080`

3. Create or join a lobby
4. Play!

## 🔥 Firewall Configuration

If you still can't connect, you may need to allow the ports through your firewall:

### macOS:

1. Go to System Preferences → Security & Privacy → Firewall
2. Click "Firewall Options"
3. Allow incoming connections for Node

### Windows:

1. Search for "Windows Defender Firewall"
2. Click "Advanced settings"
3. Add inbound rules for ports 3001 and 8080

### Linux:

```bash
sudo ufw allow 3001
sudo ufw allow 8080
```

## ✅ Testing the Connection

### Test Backend:

From another device, visit:

```
http://YOUR_IP:3001/health
```

You should see:

```json
{ "status": "ok", "timestamp": "2025-10-03T..." }
```

### Test Frontend:

From another device, visit:

```
http://YOUR_IP:8080
```

You should see the game landing page.

## 🚀 Quick Setup for Same Network Play

1. **On Host Machine:**

   - Find your IP: `ifconfig` or `ipconfig`
   - Edit `minigames-frontend/.env`:
     ```env
     VITE_SERVER_URL=http://YOUR_IP:3001
     ```
   - Start backend: `cd minigames-backend && yarn dev`
   - Start frontend: `cd minigames-frontend && yarn dev`

2. **On Other Devices:**
   - Open browser
   - Go to: `http://YOUR_IP:8080`
   - Play!

## 🎮 Different Connection Scenarios

### Same Machine (Localhost)

```env
VITE_SERVER_URL=http://localhost:3001
```

Access at: `http://localhost:8080`

### Local Network (Other Devices)

```env
VITE_SERVER_URL=http://192.168.1.100:3001
```

Access at: `http://192.168.1.100:8080`

### Deployed (Production)

```env
VITE_SERVER_URL=https://your-backend-domain.com
```

Access at: `https://your-frontend-domain.com`

## 🐛 Troubleshooting

### Can't connect from other devices?

1. **Check if both servers are running:**

   - Backend should show: `🚀 Server running on port 3001`
   - Frontend should show: `Local: http://localhost:8080` and `Network: http://YOUR_IP:8080`

2. **Verify IP address:**

   - Make sure you're using your actual local IP, not `127.0.0.1`

3. **Check same network:**

   - All devices must be on the same WiFi/network

4. **Test backend directly:**

   - Visit `http://YOUR_IP:3001/health` from another device

5. **Check firewall:**

   - Make sure ports 3001 and 8080 are not blocked

6. **Restart servers:**
   - After changing `.env`, you MUST restart the frontend

### CORS errors in browser console?

- Make sure you restarted the backend after the CORS changes
- Check that `NODE_ENV` is not set to "production"

### Connection established but can't join lobby?

- Check the browser console for errors
- Verify Socket.IO is connecting (should see "Connected to server" in console)
- Make sure the backend is accessible at the URL in your `.env`

## 📝 Note

The `.env` file is gitignored, so you'll need to create it on each machine. Use `.env.example` as a template.

Remember to update the IP address in `.env` if your machine's IP changes (this can happen with DHCP).
