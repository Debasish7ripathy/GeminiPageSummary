// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageContent') {
      // Extract text from the page
      const pageContent = document.body.innerText || document.body.textContent;
      sendResponse({ content: pageContent });
    }
  });