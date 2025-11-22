/// <reference path="./types.d.ts" />

// Background service worker for automatic application on tab changes

function getActionForState(enabled: boolean, mode: Mode): Action | null {
  if (!enabled) return null;
  
  if (mode === 'spelling') {
    return 'applyReform';
  } else if (mode === 'anglish') {
    return 'applyAnglish';
  }
  return null;
}

function applyToTab(tabId: number, action: Action): void {
  chrome.tabs.sendMessage(tabId, { action: action }, () => {
    if (chrome.runtime.lastError) {
      // Scripts may not be loaded yet, try injecting them
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['wordbook.js', 'grammar_engine.js', 'dist/content.js']
      }, () => {
        if (!chrome.runtime.lastError) {
          // Wait a bit for scripts to initialize, then send message
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, { action: action }, () => {
              // Silently handle errors
            });
          }, 500);
        }
      });
    }
  });
}

// Listen for tab updates (page loads, navigation)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only process when page is fully loaded
  if (changeInfo.status !== 'complete') return;
  
  // Skip chrome:// and extension:// URLs
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return;
  }
  
  chrome.storage.sync.get(['extensionEnabled', 'selectedMode'], (result: StorageResult) => {
    const enabled = result.extensionEnabled || false;
    const mode: Mode = result.selectedMode || 'spelling';
    
    if (enabled) {
      const action = getActionForState(enabled, mode);
      if (action) {
        // Add a small delay to ensure content script is ready
        setTimeout(() => {
          applyToTab(tabId, action);
        }, 200);
      }
    }
  });
});

// Listen for tab activation (when user switches tabs)
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab.url) return;
    
    // Skip chrome:// and extension:// URLs
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      return;
    }
    
    chrome.storage.sync.get(['extensionEnabled', 'selectedMode'], (result: StorageResult) => {
      const enabled = result.extensionEnabled || false;
      const mode: Mode = result.selectedMode || 'spelling';
      
      if (enabled) {
        const action = getActionForState(enabled, mode);
        if (action) {
          // Check if page is loaded
          if (tab.status === 'complete') {
            applyToTab(activeInfo.tabId, action);
          }
        }
      }
    });
  });
});

// Listen for storage changes (when user enables/disables or changes mode)
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'sync') return;
  
  // Get current state
  chrome.storage.sync.get(['extensionEnabled', 'selectedMode'], (result: StorageResult) => {
    const enabled = result.extensionEnabled || false;
    const mode: Mode = result.selectedMode || 'spelling';
    const previousMode = changes.selectedMode?.oldValue as Mode | undefined;
    const previousEnabled = changes.extensionEnabled?.oldValue as boolean | undefined;
    
    // Apply to all open tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (!tab.id || !tab.url) return;
        
        // Skip chrome:// and extension:// URLs
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
          return;
        }
        
        if (!tab.id) return;
        
        // If mode changed and extension is enabled, revert old mode first
        if (changes.selectedMode && enabled && previousMode && previousMode !== mode) {
          if (previousMode === 'spelling') {
            applyToTab(tab.id, 'revertReform');
            setTimeout(() => {
              const action = getActionForState(enabled, mode);
              if (action && tab.status === 'complete') {
                applyToTab(tab.id!, action);
              }
            }, 100);
          } else if (previousMode === 'anglish') {
            applyToTab(tab.id, 'revertAnglish');
            setTimeout(() => {
              const action = getActionForState(enabled, mode);
              if (action && tab.status === 'complete') {
                applyToTab(tab.id!, action);
              }
            }, 100);
          }
        } else if (enabled) {
          // Extension enabled: apply current mode
          const action = getActionForState(enabled, mode);
          if (action && tab.status === 'complete') {
            applyToTab(tab.id, action);
          }
        } else if (previousEnabled && !enabled) {
          // Extension disabled: revert based on previous mode
          const modeToRevert = previousMode || mode;
          if (modeToRevert === 'spelling') {
            applyToTab(tab.id, 'revertReform');
          } else if (modeToRevert === 'anglish') {
            applyToTab(tab.id, 'revertAnglish');
          }
        }
      });
    });
  });
});

