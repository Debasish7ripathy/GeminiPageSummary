# Gemini Page Summarizer

Gemini Page Summarizer is a Chrome extension that allows you to summarize the current web page using the Gemini API. By simply clicking the "Summarize" button in the popup, the extension fetches and processes the content of the page, generating a concise summary.

## Features

- **Summarizes the Current Web Page**: Click on the "Summarize" button, and the extension extracts content from the page to generate a summary.
- **Gemini API Integration**: Utilizes the Gemini API to generate summaries of web pages.
- **Customizable API Key**: Users can enter and save their Gemini API key to personalize the summarization process.
- **Popup and Options Page**: The extension includes a popup with a summary display and an options page to input the API key.

## Installation

1. Clone this repository or download the extension files.
2. Go to Chrome and type `chrome://extensions` in the URL bar.
3. Enable **Developer Mode** (top-right).
4. Click **Load unpacked** and select the folder containing the extension files.
5. Once installed, you will see the Gemini Page Summarizer icon in the toolbar.

## Usage

1. **Enter API Key**: Click on the extension icon and go to the options page to enter your Gemini API key.
2. **Summarize a Page**: Click the extension icon and then click the "Summarize" button. The content of the current page will be analyzed and a summary will appear.
3. **Error Handling**: If there is no active tab, or if the API key is missing, appropriate error messages will be displayed.

## File Structure

```
Gemini-Page-Summarizer/
│
├── manifest.json             # Chrome extension manifest
├── popup.html                # Popup HTML for the extension UI
├── options.html              # Options HTML for API key configuration
├── popup.js                  # JavaScript for handling the popup actions
├── options.js                # JavaScript for managing the API key
└── styles.css                # Styling for the popup and options page
```

### `manifest.json`

The manifest file for the extension that defines its metadata and permissions.

```json
{
  "manifest_version": 3,
  "name": "Gemini Page Summarizer",
  "version": "1.0",
  "description": "Summarizes the current page using the Gemini API.",
  "action": {
    "default_popup": "popup.html"
  },
  "options_ui": {
    "page": "options.html",
    "open_in_tab": false
  },
  "permissions": [
    "activeTab",
    "scripting",
    "storage"
  ],
  "host_permissions": [
    "<all_urls>"
  ]
}
```

### `popup.html`

Defines the layout and structure for the popup that shows when the extension is clicked. It includes the "Summarize" and "Options" buttons.

### `options.html`

A simple form where users can input and save their Gemini API key.

```html
<!DOCTYPE html>
<html>
<head>
  <title>Options</title>
</head>
<body>
  <h1>API Key</h1>
  <form id="api-key-form">
    <input type="text" id="api-key" placeholder="Enter your Gemini API key" />
    <button type="submit">Save</button>
  </form>
  <script src="options.js"></script>
</body>
</html>
```

### `options.js`

Handles the saving of the Gemini API key in Chrome's local storage.

```javascript
document.getElementById('api-key-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const apiKey = document.getElementById('api-key').value;
  chrome.storage.sync.set({ 'geminiApiKey': apiKey }, () => {
    alert('API key saved!');
  });
});
```

### `popup.html`

The popup interface with a button for summarizing the page and navigating to the options page.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Summarizer</title>
  <style>
    /* Add your styles here */
  </style>
</head>
<body>
  <h1>Page Summarizer</h1>
  <button id="summarize">Summarize</button>
  <button id="options">Options</button>
  <div id="summary">
    <p>Click "Summarize" to generate a summary of the page.</p>
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

### `popup.js`

This script manages user interactions in the popup, such as fetching the Gemini API key, requesting the summary, and displaying the result.

```javascript
document.getElementById('options').addEventListener('click', function() {
  chrome.runtime.openOptionsPage();
});

document.getElementById('summarize').addEventListener('click', async () => {
  const summaryDiv = document.getElementById('summary');
  summaryDiv.textContent = 'Generating summary...';
  summaryDiv.className = 'loading';

  // Retrieve the API key from storage
  const storage = await chrome.storage.sync.get('geminiApiKey');
  const apiKey = storage.geminiApiKey;

  if (!apiKey) {
    summaryDiv.textContent = 'Please enter your Gemini API key in the options.';
    summaryDiv.className = 'error';
    return;
  }

  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) throw new Error('No active tab found.');

    // Execute script in the page context to extract content
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const article = document.querySelector('article');
        if (article) return article.textContent;
        const body = document.body.cloneNode(true);
        body.querySelectorAll('script, style, nav, header, footer, iframe').forEach(el => el.remove());
        return body.textContent || '';
      },
    });

    if (!result || !result.result) throw new Error('Failed to retrieve page content.');

    const cleanContent = result.result.replace(/\s+/g, ' ').trim().slice(0, 5000);

    // Prepare API call
    const prompt = `Please provide a concise summary of the following web page content:\n\n${cleanContent}`;
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    const apiResponse = await fetch(`${API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }], 
      }),
    });

    const data = await apiResponse.json();
    if (data.error) throw new Error(data.error.message || 'API error');

    summaryDiv.textContent = data.candidates[0].content.parts[0].text || 'No summary available.';
    summaryDiv.className = '';
  } catch (error) {
    summaryDiv.textContent = `Error: ${error.message}`;
    summaryDiv.className = 'error';
    console.error('Error generating summary:', error);
  }
});
```

## Contributing

Feel free to fork this project and submit issues or pull requests for improvements.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- The Gemini API for content summarization.
