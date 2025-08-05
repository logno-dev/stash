// Background service worker for Chrome extension
chrome.commands.onCommand.addListener((command) => {
    if (command === "open-notes-tab") {
        // Set popup URL with notes tab parameter
        chrome.action.setPopup({
            popup: "popup.html?tab=note"
        });
        
        // Open the popup
        chrome.action.openPopup().then(() => {
            // Reset popup URL after opening
            setTimeout(() => {
                chrome.action.setPopup({
                    popup: "popup.html"
                });
            }, 100);
        }).catch((error) => {
            // Fallback: reset popup URL if openPopup() fails
            console.log("Could not open popup programmatically:", error);
            chrome.action.setPopup({
                popup: "popup.html"
            });
        });
    }
});