# E2E Test Troubleshooting

## Terminal Hangs After Tests Complete

If the terminal command hangs after tests complete (but you can see the Playwright HTML report), this is a known issue with Playwright's persistent context when testing Chrome extensions. The tests complete successfully, but the process doesn't exit cleanly.

### Solutions

1. **Use Ctrl+C to exit** - The tests have already completed, so it's safe to interrupt.

2. **Run in CI mode** - Set `CI=true` environment variable to run in headless mode:
   ```powershell
   $env:CI='true'; npm run test:e2e
   ```

3. **Use UI mode** - Run tests with Playwright UI which handles cleanup better:
   ```powershell
   npm run test:e2e:ui
   ```

4. **Check test results** - Even if the terminal hangs, check the `playwright-report` folder for the HTML report with full test results.

## Common Issues

### Tests Fail with "Protocol error (Page.handleJavaScriptDialog)"

This means an alert dialog appeared. The tests now include dialog handlers, but if you see this error:
- Check that the extension is built: `npm run build`
- Ensure the HTTP server is running on port 8080
- Check browser console for errors

### Extension Not Loading

- Verify `dist/` folder contains all required files
- Check that `manifest.json` points to correct file paths
- Ensure Chrome extension permissions are correct

### Transformations Not Working

- Verify content script is injected (check browser console)
- Ensure wordbook.js and grammar_engine.js are loaded
- Check that the test page is accessible at `http://localhost:8080/e2e-test.html`

