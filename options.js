document.getElementById('api-key-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const apiKey = document.getElementById('api-key').value;
    chrome.storage.sync.set({ 'geminiApiKey': apiKey }, () => {
      alert('API key saved!');
    });
  });