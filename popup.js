document.addEventListener('DOMContentLoaded', function() {
  const spellingRadio = document.getElementById('spellingRadio');
  const anglishRadio = document.getElementById('anglishRadio');
  const enableButton = document.getElementById('enableButton');

  chrome.storage.sync.get(['selectedMode', 'extensionEnabled'], function(result) {
    const selectedMode = result.selectedMode || 'spelling';
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

  function sendMessageWithFallback(tabId, action, callback) {
    chrome.tabs.sendMessage(tabId, { action: action }, function(response) {
      if (chrome.runtime.lastError) {
        console.warn('Message failed, scripts may not be loaded on this page');
      }
      if (callback) callback(response);
    });
  }

  spellingRadio.addEventListener('change', function() {
    if (spellingRadio.checked) {
      anglishRadio.checked = false;
      chrome.storage.sync.set({ selectedMode: 'spelling' });
      
      chrome.storage.sync.get(['extensionEnabled'], function(result) {
        const isEnabled = result.extensionEnabled || false;
        if (isEnabled) {
          chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0]) {
              sendMessageWithFallback(tabs[0].id, 'revertAnglish');
              setTimeout(() => sendMessageWithFallback(tabs[0].id, 'applyReform'), 100);
            }
          });
        }
      });
    }
  });

  anglishRadio.addEventListener('change', function() {
    if (anglishRadio.checked) {
      spellingRadio.checked = false;
      chrome.storage.sync.set({ selectedMode: 'anglish' });
      
      chrome.storage.sync.get(['extensionEnabled'], function(result) {
        const isEnabled = result.extensionEnabled || false;
        if (isEnabled) {
          chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0]) {
              sendMessageWithFallback(tabs[0].id, 'revertReform');
              setTimeout(() => sendMessageWithFallback(tabs[0].id, 'applyAnglish'), 100);
            }
          });
        }
      });
    }
  });

  enableButton.addEventListener('click', function() {
    chrome.storage.sync.get(['extensionEnabled', 'selectedMode'], function(result) {
      const currentState = result.extensionEnabled || false;
      const newState = !currentState;
      const selectedMode = result.selectedMode || 'spelling';
      
      chrome.storage.sync.set({ extensionEnabled: newState });
      updateIconState(newState);
      updateButtonText(newState);
      
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0]) {
          let action;
          if (newState && selectedMode === 'spelling') {
            action = 'applyReform';
          } else if (newState && selectedMode === 'anglish') {
            action = 'applyAnglish';
          } else if (!newState && selectedMode === 'spelling') {
            action = 'revertReform';
          } else if (!newState && selectedMode === 'anglish') {
            action = 'revertAnglish';
          }
          
          console.log('Sending message:', action, 'to tab:', tabs[0].id);
          chrome.tabs.sendMessage(tabs[0].id, { action: action }, function(response) {
            if (chrome.runtime.lastError) {
              console.error('Error sending message:', chrome.runtime.lastError.message);
              
              chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ['wordbook.js', 'grammar_engine.js', 'content.js']
              }, function() {
                if (chrome.runtime.lastError) {
                  alert('Could not inject scripts. Please reload this page and try again.');
                } else {
                  setTimeout(function() {
                    chrome.tabs.sendMessage(tabs[0].id, { action: action }, function(response) {
                      if (chrome.runtime.lastError) {
                        alert('Please reload this page to use the extension.');
                      } else {
                        console.log('Message sent successfully after injection:', response);
                      }
                    });
                  }, 500);
                }
              });
            } else {
              console.log('Message sent successfully:', response);
            }
          });
        }
      });
    });
  });

  function updateIconState(isEnabled) {
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

  function updateButtonText(isEnabled) {
    enableButton.textContent = isEnabled ? 'Disable' : 'Enable';
  }
});

