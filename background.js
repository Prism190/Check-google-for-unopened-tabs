
const recoveredUrls = [
  //add your URLs here
];

const normalize = (url) => {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const path = u.pathname.replace(/\/$/, "");
    return `${u.protocol}//${host}${path}`;
  } catch {
    return url;
  }
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "launch_tabs" && msg.urls) {
    openInBatches(msg.urls);
  }
  return true;
});

async function openInBatches(recoveredUrls) {
  const tabsPerWindow = 100;
  const delay = 200;

  const openUrlsSet = new Set();
  chrome.tabs.query({}, async (tabs) => {
    tabs.forEach(tab => openUrlsSet.add(normalize(tab.url)));

    let notOpened = recoveredUrls.map(normalize).filter(url => !openUrlsSet.has(url));
    let currentWindowId = null;

    console.log("Total recovered:", recoveredUrls.length);
    console.log("Open already:", recoveredUrls.length - notOpened.length);
    console.log("Still unopened:", notOpened.length);

    for (let i = 0; i < notOpened.length; i++) {
      if (i % tabsPerWindow === 0) {
        await new Promise(resolve => {
          chrome.windows.create({ url: "about:blank", focused: false }, (win) => {
            currentWindowId = win.id;
            resolve();
          });
        });
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      const url = notOpened[i];
      chrome.tabs.create({ windowId: currentWindowId, url, active: false }, (tab) => {
        const checkAndDiscard = () => {
          chrome.tabs.get(tab.id, (updatedTab) => {
            if (!updatedTab || !updatedTab.url || updatedTab.url === "about:blank") {
              setTimeout(checkAndDiscard, 100);
            } else {
              chrome.tabs.discard(tab.id);
            }
          });
        };
        checkAndDiscard();
      });
    }
  });
}
