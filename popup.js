
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
  
  document.getElementById("status").textContent = "Checking tabs...";
  
  chrome.tabs.query({}, (tabs) => {
    const openUrls = new Set(tabs.map(t => normalize(t.url)));
    const normalizedRecovered = recoveredUrls.map(normalize);
    const notOpened = normalizedRecovered.filter(url => !openUrls.has(url));
  
    const results = document.getElementById("results");
    results.innerHTML = `
      <p>Total in recovery list: <strong>${recoveredUrls.length}</strong></p>
      <p>Already open: <strong>${recoveredUrls.length - notOpened.length}</strong></p>
      <p>Not open: <strong>${notOpened.length}</strong></p>
    `;
  
    const openBtn = document.createElement("button");
    openBtn.id = "openBtn";
    openBtn.textContent = "Launch Unopened Tabs (via Background)";
    openBtn.style.marginTop = "12px";
    results.appendChild(openBtn);
  
    openBtn.onclick = () => {
      chrome.runtime.sendMessage({ action: "launch_tabs", urls: recoveredUrls });
      document.getElementById("status").textContent = "Launch started in background.";
    };
  });
  