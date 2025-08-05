// Background script for Firefox extension
browser.commands.onCommand.addListener((command) => {
    if (command === "open-notes-tab") {
        // Open popup with notes tab parameter
        browser.browserAction.setPopup({
            popup: "popup.html?tab=note"
        });
        
        // Trigger the popup to open
        browser.browserAction.openPopup().then(() => {
            // Reset popup URL after opening
            setTimeout(() => {
                browser.browserAction.setPopup({
                    popup: "popup.html"
                });
            }, 100);
        }).catch((error) => {
            // Fallback: open popup normally if openPopup() fails
            console.log("Could not open popup programmatically:", error);
            browser.browserAction.setPopup({
                popup: "popup.html"
            });
        });
    }
});