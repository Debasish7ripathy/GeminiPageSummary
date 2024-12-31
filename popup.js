document.getElementById('options').addEventListener('click', function() {
  chrome.runtime.openOptionsPage();
});

document.getElementById('summarize').addEventListener('click', async () => {
  const summaryDiv = document.getElementById('summary');
  summaryDiv.textContent = 'Generating summary...';
  summaryDiv.className = 'loading';

  const storage = await chrome.storage.sync.get('geminiApiKey');
  const apiKey = storage.geminiApiKey;

  if (!apiKey) {
    summaryDiv.textContent = 'Please enter your Gemini API key in the options.';
    summaryDiv.className = 'error';
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) throw new Error('No active tab found.');

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

    const prompt = `Please provide a concise summary of the following web page content:\n\n${cleanContent}`;
    const API_URL = ' https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
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