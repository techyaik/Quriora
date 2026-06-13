# Audio Manual Test Checklist

Prerequisites
- Run the API server from `server/` (`npm run dev`).
- Start the Expo app from `mobile/` (`npm start`).

Quick start commands
```bash
# from repo root
cd server
npm run dev
# in another terminal
cd mobile
npm start
```

Test cases
- First-time playback
  - Open `Listen` or a `Surah` and press Play.
  - Expect audio to start and progress bar to move.
- Pause and resume
  - Press Pause, confirm audio stops; press Play/Resume, confirm it continues.
- Screen navigation during playback
  - Start playback, navigate to another screen, verify audio continues and bottom bar reflects state.
- Background mode
  - Put app in background or lock device, confirm audio continues.
- Seek behavior
  - (If seek UI exists) Seek to mid-track and confirm playback jumps.
- Speed control
  - Change playback speed and confirm voice speed changes.
- Repeat modes
  - Toggle repeat ayah and repeat surah and confirm behavior at track end.
- Change reciter
  - Switch reciter and confirm playback uses the new reciter's audio.
- Error handling
  - Disable network and attempt playback; confirm an error is shown in the bottom bar and playback fails gracefully.

Notes
- If audio doesn't start, check the Metro/Expo logs for errors and the server logs for failed `/api/audio` requests.
- Ensure `axios.defaults.baseURL` resolves to your machine IP when using Expo Go on a physical device.

Next steps
- Add unit tests mocking `expo-av`.
- Add UI to retry failed audio loads.
