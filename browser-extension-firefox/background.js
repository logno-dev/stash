// Background script for Firefox extension
browser.commands.onCommand.addListener((command) => {
    let popupUrl = null;

    if (command === "open-notes-tab") {
        popupUrl = "popup.html?tab=note";
    } else if (command === "open-search-tab") {
        popupUrl = "popup.html?tab=search";
    }

    if (!popupUrl) {
        return;
    }

    browser.browserAction.setPopup({ popup: popupUrl });

    browser.browserAction.openPopup().then(() => {
        setTimeout(() => {
            browser.browserAction.setPopup({ popup: "popup.html" });
        }, 100);
    }).catch((error) => {
        console.log("Could not open popup programmatically:", error);
        browser.browserAction.setPopup({ popup: "popup.html" });
    });
});
