# ?? SonarQube Configuration Fix

## ?? The Issue

SonarQube was warning:
```
At least one referenced/extended tsconfig.json was not found in the project. 
Please run 'npm install' for a more complete analysis.
```

**Root cause:** The main `tsconfig.json` extends `expo/tsconfig.base`, but `npm install` hasn't been run yet, so the `expo` package (and its tsconfig) doesn't exist.

---

## ? Solutions Provided

### Option 1: Run npm install (Recommended)

```bash
npm install
```

This installs all dependencies including `expo`, which provides the base tsconfig that's being extended.

**After this, SonarQube will work fine with the main `tsconfig.json`.**

---

### Option 2: Use Standalone tsconfig for SonarQube

I created `tsconfig.sonarqube.json` - a standalone config that doesn't depend on expo.

**To use it, configure SonarQube:**

In your `sonar-project.properties`:
```properties
sonar.typescript.tsconfigPath=tsconfig.sonarqube.json
```

Or via command line:
```bash
sonar-scanner -Dsonar.typescript.tsconfigPath=tsconfig.sonarqube.json
```

---

### Option 3: Use the Complete sonar-project.properties

I created a complete `sonar-project.properties` file that:
- ? Excludes node_modules, .expo, assets
- ? Uses the standalone tsconfig
- ? Defines project metadata
- ? Configures code analysis

**To use:**
```bash
# Make sure sonar-project.properties is in your project root
sonar-scanner
```

---

## ?? Files Created

1. **`tsconfig.sonarqube.json`** - Standalone TypeScript config for SonarQube
2. **`sonar-project.properties`** - Complete SonarQube configuration
3. **Updated `tsconfig.json`** - Added include/exclude for better IDE support

---

## ?? Quick Fix

**Just run:**
```bash
npm install
```

Then re-run SonarQube analysis. The warning will disappear!

---

## ?? Understanding the Files

### tsconfig.json (Main - for development)
```json
{
  "extends": "expo/tsconfig.base",  // ? Needs npm install
  "compilerOptions": { ... }
}
```
- Used by your IDE and Expo
- Requires `npm install` first
- Best for development

### tsconfig.sonarqube.json (For SonarQube)
```json
{
  "compilerOptions": { ... }  // ? No "extends"
}
```
- Standalone configuration
- No external dependencies
- Perfect for CI/CD pipelines

---

## ?? Recommended Workflow

### Local Development:
```bash
npm install          # Install dependencies
npm start            # Use main tsconfig.json
```

### CI/CD Pipeline:
```bash
npm install          # Install dependencies
npm run test         # Run tests (optional)
sonar-scanner        # Use sonar-project.properties
```

### Without npm install:
```bash
# If you must run SonarQube without npm install:
sonar-scanner -Dsonar.typescript.tsconfigPath=tsconfig.sonarqube.json
```

---

## ?? Common SonarQube Issues

### Issue: "Cannot find module"
**Solution:** Run `npm install` first

### Issue: "Too many files to analyze"
**Solution:** Check `sonar.exclusions` in sonar-project.properties

### Issue: "TypeScript version mismatch"
**Solution:** Ensure TypeScript is in devDependencies:
```bash
npm install --save-dev typescript
```

### Issue: "Memory issues"
**Solution:** Increase Node memory:
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
sonar-scanner
```

---

## ? Verification

After running `npm install`, verify setup:

```bash
# Check expo is installed
npm list expo

# Check TypeScript works
npx tsc --noEmit

# Run SonarQube
sonar-scanner
```

All should work without warnings!

---

## ?? Summary

**The fix is simple: Run `npm install`**

But I've also provided:
- ? Standalone tsconfig for SonarQube
- ? Complete sonar-project.properties
- ? Proper exclusions for React Native
- ? Documentation

**Choose what works best for your workflow!** ??
