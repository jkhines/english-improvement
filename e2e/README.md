# End-to-End Tests

This directory contains Playwright end-to-end tests for the English Improvement Chrome extension.

## Setup

1. Install dependencies:
   ```powershell
   npm install
   ```

2. Build the extension:
   ```powershell
   npm run build
   ```

3. Install Playwright browsers (first time only):
   ```powershell
   npx playwright install chromium
   ```

## Running Tests

### Option 1: Manual Server (Recommended)

1. Start a local HTTP server in the project root:
   ```powershell
   npx http-server . -p 8080 -c-1
   ```

2. In another terminal, run the tests:
   ```powershell
   npm run test:e2e
   ```

### Option 2: Headed Mode (See Browser)

Run tests with visible browser window:
```powershell
npm run test:e2e:headed
```

### Option 3: Debug Mode

Run tests in debug mode with Playwright Inspector:
```powershell
npm run test:e2e:debug
```

### Option 4: UI Mode

Run tests with Playwright's UI mode:
```powershell
npm run test:e2e:ui
```

## Test Files

- `extension.spec.ts` - Main test suite covering:
  - Extension popup functionality
  - Spelling reform transformations
  - Anglish translations
  - Link text transformations
  - Reverting transformations
  - Skipping code/pre/textarea elements
  - Mode switching

## Test Page

The tests use `e2e-test.html` in the project root, which contains test cases with specific IDs for reliable element selection.

