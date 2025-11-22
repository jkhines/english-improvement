/// <reference path="./types.d.ts" />

document.addEventListener('DOMContentLoaded', function() {
  const spellingRadio = document.getElementById('spellingRadio') as HTMLInputElement;
  const anglishRadio = document.getElementById('anglishRadio') as HTMLInputElement;
  const enableButton = document.getElementById('enableButton') as HTMLButtonElement;
  
  if (!spellingRadio || !anglishRadio || !enableButton) {
    return;
  }

  chrome.storage.sync.get(['selectedMode', 'extensionEnabled'], function(result: StorageResult) {
    const selectedMode: Mode = result.selectedMode || 'spelling';
    if (selectedMode === 'spelling') {
      spellingRadio.checked = true;
      anglishRadio.checked = false;
    } else {
      anglishRadio.checked = true;
      spellingRadio.checked = false;
    }
    const isEnabled = result.extensionEnabled || false;
    updateIconState(isEnabled);
    updateButtonText(isEnabled);
  });

  spellingRadio.addEventListener('change', function() {
    if (spellingRadio.checked) {
      anglishRadio.checked = false;
      // Storage change listener in background.ts will handle applying to all tabs
      chrome.storage.sync.set({ selectedMode: 'spelling' });
    }
  });

  anglishRadio.addEventListener('change', function() {
    if (anglishRadio.checked) {
      spellingRadio.checked = false;
      // Storage change listener in background.ts will handle applying to all tabs
      chrome.storage.sync.set({ selectedMode: 'anglish' });
    }
  });

  enableButton.addEventListener('click', function() {
    chrome.storage.sync.get(['extensionEnabled', 'selectedMode'], function(result: StorageResult) {
      const currentState = result.extensionEnabled || false;
      const newState = !currentState;
      const selectedMode: Mode = result.selectedMode || 'spelling';
      
      chrome.storage.sync.set({ extensionEnabled: newState });
      updateIconState(newState);
      updateButtonText(newState);
      
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && tabs[0].id) {
          let action: Action | undefined;
          if (newState && selectedMode === 'spelling') {
            action = 'applyReform';
          } else if (newState && selectedMode === 'anglish') {
            action = 'applyAnglish';
          } else if (!newState && selectedMode === 'spelling') {
            action = 'revertReform';
          } else if (!newState && selectedMode === 'anglish') {
            action = 'revertAnglish';
          }
          
          if (!action) return;
          
          chrome.tabs.sendMessage(tabs[0].id, { action: action }, function() {
            if (chrome.runtime.lastError) {
              chrome.scripting.executeScript({
                target: { tabId: tabs[0].id! },
                files: ['wordbook.js', 'grammar_engine.js', 'dist/content.js']
              }, function() {
                if (chrome.runtime.lastError) {
                  alert('Could not inject scripts. Please reload this page and try again.');
                } else {
                  setTimeout(function() {
                    chrome.tabs.sendMessage(tabs[0].id!, { action: action! }, function() {
                      if (chrome.runtime.lastError) {
                        alert('Please reload this page to use the extension.');
                      }
                    });
                  }, 500);
                }
              });
            }
          });
        }
      });
    });
  });

  function updateIconState(isEnabled: boolean): void {
    const iconSet = isEnabled ? {
      '16': 'icon16-inverted.png',
      '48': 'icon48-inverted.png',
      '128': 'icon128-inverted.png'
    } : {
      '16': 'icon16.png',
      '48': 'icon48.png',
      '128': 'icon128.png'
    };
    
    chrome.action.setIcon({ path: iconSet });
  }

  function updateButtonText(isEnabled: boolean): void {
    enableButton.textContent = isEnabled ? 'Disable' : 'Enable';
  }
});

