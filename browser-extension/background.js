// Background service worker for Chrome extension
chrome.commands.onCommand.addListener((command) => {
    let popupUrl = null;

    if (command === "open-notes-tab") {
        popupUrl = "popup.html?tab=note";
    } else if (command === "open-search-tab") {
        popupUrl = "popup.html?tab=search";
    }

    if (!popupUrl) {
        return;
    }

    chrome.action.setPopup({ popup: popupUrl });

    chrome.action.openPopup().then(() => {
        setTimeout(() => {
            chrome.action.setPopup({ popup: "popup.html" });
        }, 100);
    }).catch((error) => {
        console.log("Could not open popup programmatically:", error);
        chrome.action.setPopup({ popup: "popup.html" });
    });
});
