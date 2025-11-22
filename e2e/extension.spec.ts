import { test, expect, chromium, BrowserContext, Page, Worker } from '@playwright/test';
import * as path from 'path';

type ExtensionAction = 'applyReform' | 'revertReform' | 'applyAnglish' | 'revertAnglish';

const TEST_PAGE_BASE_URL = 'http://localhost:8080/e2e-test.html';

let context: BrowserContext;
let extensionId: string;
let background: Worker | null = null;

test.beforeAll(async () => {
  const pathToExtension = path.join(__dirname, '..');
  context = await chromium.launchPersistentContext('', {
    headless: process.env.CI === 'true',
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });

  background = await ensureBackgroundWorker();
  extensionId = background.url().split('/')[2];
});

test.afterAll(async () => {
  if (context) {
    const pages = context.pages();
    for (const page of pages) {
      await page.close().catch(() => {});
    }
    await context.close();
  }
});

async function ensureBackgroundWorker(): Promise<Worker> {
  if (background) return background;
  let [worker] = context.serviceWorkers();
  if (!worker) {
    worker = await context.waitForEvent('serviceworker');
  }
  background = worker;
  return worker;
}

async function evaluateInBackground<T>(callback: (arg: any) => T | Promise<T>, arg: any): Promise<T> {
  let worker = await ensureBackgroundWorker();
  try {
    return await worker.evaluate(callback, arg);
  } catch (error) {
    background = null;
    worker = await ensureBackgroundWorker();
    return await worker.evaluate(callback, arg);
  }
}

async function createTestPage(testName: string): Promise<Page> {
  const page = await context.newPage();
  const url = `${TEST_PAGE_BASE_URL}?case=${encodeURIComponent(testName)}-${Date.now()}`;
  await page.goto(url);
  await page.waitForLoadState('load');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(250);
  return page;
}

async function sendActionToPage(page: Page, action: ExtensionAction): Promise<void> {
  const targetUrl = page.url();
  await evaluateInBackground(({ action, targetUrl }) => {
    return new Promise<void>((resolve, reject) => {
      chrome.tabs.query({ url: targetUrl }, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        const tab = tabs && tabs[0];
        if (!tab || !tab.id) {
          reject(new Error(`Tab not found for URL ${targetUrl}`));
          return;
        }

        const send = (allowRetry: boolean) => {
          chrome.tabs.sendMessage(tab.id!, { action }, () => {
            if (chrome.runtime.lastError) {
              if (!allowRetry) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }
              chrome.scripting.executeScript({
                target: { tabId: tab.id! },
                files: ['wordbook.js', 'grammar_engine.js', 'dist/content.js'],
              }, () => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  setTimeout(() => send(false), 500);
                }
              });
            } else {
              resolve();
            }
          });
        };

        send(true);
      });
    });
  }, { action, targetUrl });
}

async function resetTransformations(page: Page): Promise<void> {
  try {
    await sendActionToPage(page, 'revertAnglish');
  } catch (_err) {
    // Ignore errors when no Anglish transformations were applied.
  }
  try {
    await sendActionToPage(page, 'revertReform');
  } catch (_err) {
    // Ignore errors when no spelling transformations were applied.
  }
}

async function openExtensionPopup(context: BrowserContext): Promise<Page> {
  const popupUrl = `chrome-extension://${extensionId}/popup.html`;
  const popup = await context.newPage();
  await popup.goto(popupUrl);
  await popup.waitForLoadState('networkidle');
  return popup;
}

test.describe('English Improvement Extension', () => {
  test('should load extension popup', async () => {
    const popup = await openExtensionPopup(context);
    await expect(popup.locator('h1')).toContainText('English Improvement');
    await expect(popup.locator('#spellingRadio')).toBeVisible();
    await expect(popup.locator('#anglishRadio')).toBeVisible();
    await expect(popup.locator('#enableButton')).toBeVisible();
    await popup.close();
  });

  test('should apply spelling reform transformations', async () => {
    const page = await createTestPage('spelling-basic');
    try {
      await resetTransformations(page);
      await sendActionToPage(page, 'applyReform');
      await expect(page.locator('#spelling-basic')).toContainText('thot');
      await expect(page.locator('#spelling-basic')).toContainText('thru');
      await expect(page.locator('#spelling-basic')).toContainText('ruff');
      await expect(page.locator('#spelling-basic')).toContainText('tho');
      await expect(page.locator('#spelling-basic')).toContainText('tuff');
      await expect(page.locator('#spelling-basic')).toContainText('enuff');

      await expect(page.locator('#spelling-complex')).toContainText('brakethru');
      await expect(page.locator('#spelling-complex')).toContainText('grate');
      await expect(page.locator('#spelling-complex')).toContainText('brake');
    } finally {
      await resetTransformations(page);
      await page.close();
    }
  });

  test('should apply spelling reform to link text', async () => {
    const page = await createTestPage('spelling-link');
    try {
      await resetTransformations(page);
      await sendActionToPage(page, 'applyReform');
      await expect(page.locator('#spelling-link')).toContainText('thru');
      await expect(page.locator('#spelling-link')).toContainText('ruff');
      await expect(page.locator('#spelling-link')).toHaveAttribute('href', '#test');
    } finally {
      await resetTransformations(page);
      await page.close();
    }
  });

  test('should revert spelling reform transformations', async () => {
    const page = await createTestPage('spelling-revert');
    try {
      await resetTransformations(page);
      await sendActionToPage(page, 'applyReform');
      await expect(page.locator('#spelling-basic')).toContainText('thot');

      await sendActionToPage(page, 'revertReform');
      await expect(page.locator('#spelling-basic')).toContainText('thought');
      await expect(page.locator('#spelling-basic')).toContainText('through');
      await expect(page.locator('#spelling-basic')).not.toContainText('thot');
      await expect(page.locator('#spelling-basic')).not.toContainText('thru');
    } finally {
      await resetTransformations(page);
      await page.close();
    }
  });

  test('should apply Anglish translations', async () => {
    const page = await createTestPage('anglish-basic');
    try {
      await resetTransformations(page);
      await sendActionToPage(page, 'applyAnglish');
      await expect(page.locator('#anglish-basic')).toContainText('oversight');
      await expect(page.locator('#anglish-basic')).toContainText('thew');
      await expect(page.locator('#anglish-complex')).toContainText('fellowship');
    } finally {
      await resetTransformations(page);
      await page.close();
    }
  });

  test('should apply Anglish to link text', async () => {
    const page = await createTestPage('anglish-link');
    try {
      await resetTransformations(page);
      await sendActionToPage(page, 'applyAnglish');
      await expect(page.locator('#anglish-link')).toContainText('oversight');
      await expect(page.locator('#anglish-link')).toContainText('thew');
      await expect(page.locator('#anglish-link')).toHaveAttribute('href', '#test');
    } finally {
      await resetTransformations(page);
      await page.close();
    }
  });

  test('should revert Anglish translations', async () => {
    const page = await createTestPage('anglish-revert');
    try {
      await resetTransformations(page);
      await sendActionToPage(page, 'applyAnglish');
      await expect(page.locator('#anglish-basic')).toContainText('oversight');

      await sendActionToPage(page, 'revertAnglish');
      await expect(page.locator('#anglish-basic')).toContainText('government');
      await expect(page.locator('#anglish-basic')).toContainText('policy');
      await expect(page.locator('#anglish-basic')).not.toContainText('oversight');
    } finally {
      await resetTransformations(page);
      await page.close();
    }
  });

  test('should skip code, pre, and textarea elements', async () => {
    const page = await createTestPage('skip-elements');
    try {
      await resetTransformations(page);
      await sendActionToPage(page, 'applyReform');
      await expect(page.locator('code')).toHaveText('through thought rough');
      await expect(page.locator('pre')).toHaveText('through thought rough');
      await expect(page.locator('textarea')).toHaveValue('through thought rough');
    } finally {
      await resetTransformations(page);
      await page.close();
    }
  });

  test('should switch between modes correctly', async () => {
    const page = await createTestPage('mode-switch');
    try {
      await resetTransformations(page);
      await sendActionToPage(page, 'applyReform');
      await expect(page.locator('#mixed-content')).toContainText('tho');
      await expect(page.locator('#mixed-content')).toContainText('thot');

      await sendActionToPage(page, 'revertReform');
      await expect(page.locator('#mixed-content')).not.toContainText('thot');

      await sendActionToPage(page, 'applyAnglish');
      await expect(page.locator('#mixed-content')).toContainText('oversight');
      await expect(page.locator('#mixed-content')).toContainText('thew');
    } finally {
      await resetTransformations(page);
      await page.close();
    }
  });

  test('should update button text when enabled/disabled', async () => {
    const popup = await openExtensionPopup(context);

    await expect(popup.locator('#enableButton')).toContainText('Enable');

    await popup.locator('#spellingRadio').check();
    await popup.locator('#enableButton').click();

    await expect(popup.locator('#enableButton')).toContainText('Disable');

    await popup.locator('#enableButton').click();

    await expect(popup.locator('#enableButton')).toContainText('Enable');

    await popup.close();
  });
});

