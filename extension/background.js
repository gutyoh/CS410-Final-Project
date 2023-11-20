chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create({
        "id": "intellilookup",
        "title": "Explain using intelli models",
        "contexts": ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    chrome.tabs.sendMessage(tab.id, {type: 'contextMenuClicked'});
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'textSelected') {
        chrome.storage.local.set({"selectedText": message.text}, () => {
            sendResponse({status: 'success'});
        });
        return true;
    }
});
