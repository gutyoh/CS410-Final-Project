const OPENAI_KEY = ""

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

async function callOpenAi(selectedText) {
    if (selectedText.length > 0) {
        
        let url = "https://intelli-server.vercel.app/chatbot/chat";
        
        let data = {
            "api_key": OPENAI_KEY,
            "model": "gpt4",
            "provider": "openai",
            "input": {
                "system": "Explain the selected content text from a web page",
                "messages": [
                    {
                    "role": "user",
                    "content": selectedText
                    }
                ]
            }
        };

        let response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': 'root'
            },
            body: JSON.stringify(data)
        });

        if(response.ok) {
            let json = await response.json();
            sendToPopup(json.data[0]);
        } else {
            console.log("HTTP-Error: " + response.status);
        }
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
        chrome.storage.local.set({ "intelliText": popupValue });
    });

}