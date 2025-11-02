# ?? Running on Your MacBook Air

## ? Quick Fix

Instead of `npm start`, run:

```bash
npx expo start
```

This uses the locally installed Expo without needing a global install.

---

## ?? Complete Steps for Your Mac

### 1. Make sure you're in the project folder
```bash
cd ~/Desktop/paws-main  # or wherever you saved it
ls  # Should see App.tsx, package.json, etc.
```

### 2. Install dependencies (if you haven't)
```bash
npm install
```

### 3. Start the app
```bash
npx expo start
```

### 4. Scan QR code with your phone
- **iPhone**: Camera app ? Point at QR ? Tap notification
- **Android**: Expo Go app ? Scan QR code

---

## ?? What `npx` Does

`npx` runs packages from `node_modules/.bin/` without installing them globally.

So:
- ? `expo start` - looks for global Expo (not installed)
- ? `npx expo start` - uses local Expo from node_modules

---

## ??? Alternative: Update package.json script

If you want to keep using `npm start`, edit `package.json`:

```json
{
  "scripts": {
    "start": "npx expo start"
  }
}
```

---

## ?? Expected Output

After running `npx expo start`, you'll see:

```
Starting project at /Users/dreva/Desktop/paws-main
Starting Metro Bundler

???????????????????????????
? ????? ????? ?? ????? ?
? ?   ? ? ?? ?? ?   ? ?
? ????? ?  ?? ? ????? ?
???????????????????????????

? Metro waiting on exp://192.168.x.x:8081
? Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

---

## ?? TL;DR - Just Run This

```bash
cd ~/Desktop/paws-main
npx expo start
```

Then scan QR code with your phone! ??
