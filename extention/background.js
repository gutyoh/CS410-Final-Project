chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
        "id": "intellilookup",
        "title": "explain using intelli models",
        "contexts": ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (tab) {
        callOpenAi(info.selectionText); 
    }
});

function callOpenAi(selectedText) {
    
    console.log('selecte text');
    console.log(selectedText);

    if (selectedText.length > 0) {

        // TODO : Call the OpenAI API function here

        // TODO: replace below with the openai result 
        sendToPopup(selectedText)
    }
}

function sendToPopup(popupValue) {

    let createData = {
        url: chrome.runtime.getURL("popup.html"),
        type: 'popup',
        width: 500,
        height: 600,
    };
    
    chrome.windows.create(createData, function() {
        // Use chrome.storage.local.set to save the api call result.
        chrome.storage.local.set({ "intelliText": popupValue });
    });

}