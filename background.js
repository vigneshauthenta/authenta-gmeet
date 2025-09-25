chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get("token", (data) => {
    if (!data.token) {
      chrome.tabs.create({ url: "options/options.html" });
    }
  });
}); 
