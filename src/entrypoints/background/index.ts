export default defineBackground(() => {
  const targetUrl = "https://hiring.amazon.ca/app#/jobSearch";

  browser.runtime.onInstalled.addListener(() => {
    browser.tabs.query({}, (tabs) => {
      const targetTab = tabs.find((tab) => tab.url?.startsWith(targetUrl));

      if (targetTab && targetTab.id !== undefined) {
        // Activate and reload the existing tab
        browser.tabs.update(targetTab.id, { active: true }, () => {
          browser.tabs.reload(targetTab.id!);
        });
      } else {
        // Open a new tab with the target URL
        browser.tabs.create({ url: targetUrl });
      }
    });
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "queryTabs") {
      chrome.tabs.query({}, (tabs) => {
        const existingTab = tabs.find((tab) =>
          tab.url?.includes(message.jobId),
        );

        if (existingTab) {
          chrome.tabs.update(existingTab.id!, { active: true });
        } else {
          const jobDetailUrl = `https://hiring.amazon.ca/app#/jobDetail?jobId=${message.jobId}&locale=en-CA`;
          chrome.tabs.create({ url: jobDetailUrl });
        }
      });
    }
  });
});
