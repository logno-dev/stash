const ext = globalThis.browser || globalThis.chrome;

ext.commands.onCommand.addListener((command) => {
    let popupUrl = null;

    if (command === "open-notes-tab") {
        popupUrl = "popup.html?tab=note";
    } else if (command === "open-search-tab") {
        popupUrl = "popup.html?tab=search";
    }

    if (!popupUrl) {
        return;
    }

    ext.action.setPopup({ popup: popupUrl });

    ext.action.openPopup().then(() => {
        setTimeout(() => {
            ext.action.setPopup({ popup: "popup.html" });
        }, 100);
    }).catch((error) => {
        console.log("Could not open popup programmatically:", error);
        ext.action.setPopup({ popup: "popup.html" });
    });
});
