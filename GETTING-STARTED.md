# 🚀 Getting Started

Follow these steps to set up and run the Multiplayer Mini-Games application.

## Step 1: Install Backend Dependencies

```bash
cd minigames-backend
yarn install
```

## Step 2: Install Frontend Dependencies

```bash
cd ../minigames-frontend
yarn install
```

## Step 3: Start the Backend Server

```bash
cd ../minigames-backend
yarn dev
```

You should see:

```
🚀 Server running on port 3001
📡 WebSocket server ready
🎮 Ready to host games!
```

## Step 4: Start the Frontend (in a new terminal)

```bash
cd minigames-frontend
yarn dev
```

You should see:

```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

## Step 5: Open Your Browser

1. Open `http://localhost:5173`
2. Create a lobby with your username and color
3. Share the lobby code with a friend (or open another browser window)
4. Join the lobby with the code
5. Click "Start Game" and enjoy!

## Testing Locally with Multiple Players

### Option 1: Multiple Browser Windows

- Open the app in multiple browser windows or tabs
- Each window will be treated as a different player

### Option 2: Multiple Browsers

- Open the app in Chrome, Firefox, Safari, etc.
- Each browser will be a different player

### Option 3: Incognito/Private Windows

- Use incognito or private browsing mode
- Each window will have a separate session

## Environment Variables (Optional)

If you want to customize the server URL or port:

### Backend (.env)

```bash
PORT=3001
CLIENT_URL=http://localhost:5173
```

### Frontend (.env)

```bash
VITE_SERVER_URL=http://localhost:3001
```

## Troubleshooting

### "EADDRINUSE" Error

- Port 3001 is already in use
- Kill the process: `lsof -ti:3001 | xargs kill -9`
- Or change the port in backend/.env

### "Failed to connect to server"

- Make sure the backend is running on port 3001
- Check console for errors
- Verify VITE_SERVER_URL is correct

### "Lobby not found"

- Make sure the lobby code is correct (case-sensitive)
- The lobby may have expired (no players)
- Try creating a new lobby

## Next Steps

- Read `PROJECT-SPEC.md` for project overview
- Read `DEVELOPMENT-GUIDE.md` to add new games
- Check `README.md` for detailed documentation

## Quick Test Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads at http://localhost:5173
- [ ] Can create a lobby
- [ ] Lobby code is displayed
- [ ] Can join lobby with code (in another window)
- [ ] Both players appear in lobby
- [ ] Host can start game
- [ ] Reaction Time game loads
- [ ] Screen turns from red to green
- [ ] Can click and record response
- [ ] Round ends and shows winner
- [ ] Scores are updated
- [ ] Can play multiple rounds
- [ ] Victory screen shows after reaching points goal
- [ ] Can return to lobby for rematch

Happy Gaming! 🎮
