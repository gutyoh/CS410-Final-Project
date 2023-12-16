// Listens for the installation of the extension and creates a context menu item
chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create({
        "id": "intellilookup",
        "title": "Explain using intelli models",
        "contexts": ["selection"]
    });
});

// Handles the click event on the context menu item
chrome.contextMenus.onClicked.addListener((info, tab) => {
    // Sends a message to the content script when the context menu item is clicked
    chrome.tabs.sendMessage(tab.id, {type: 'contextMenuClicked'}).then(response => {
        console.log(response);
    }).catch(error => {
        console.error(error);
    });
});

// Listens for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'textSelected') {
        // Stores the selected text in Chrome's local storage
        chrome.storage.local.set({"selectedText": message.text}, () => {
            sendResponse({status: 'success'});
        });
        return true; // Keeps the message channel open for the sendResponse callback
    }
});