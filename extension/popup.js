document.addEventListener('DOMContentLoaded', async function () {
    const selectedText = await getSelectedText();
    const apiKey = await getApiKey();
    document.getElementById('api-key').value = apiKey || '';
    document.getElementById('text-input').value = selectedText || '';

    document.getElementById('save-api-key').addEventListener('click', saveApiKey);

    const actionButtons = document.querySelectorAll('.action-button');
    actionButtons.forEach(button => {
        button.addEventListener('click', function () {
            processText(button.id);
        });
    });
});

async function getSelectedText() {
    return new Promise((resolve) => {
        chrome.storage.local.get(["selectedText"], function (result) {
            resolve(result.selectedText);
        });
    });
}

async function getApiKey() {
    return new Promise((resolve) => {
        chrome.storage.local.get(["apiKey"], function (result) {
            resolve(result.apiKey);
        });
    });
}

function saveApiKey() {
    const apiKey = document.getElementById('api-key').value;
    chrome.storage.local.set({"apiKey": apiKey}, function () {
        console.log('API Key saved');
        const saveConfirm = document.getElementById('save-confirm');
        saveConfirm.classList.remove('hidden');
        setTimeout(() => saveConfirm.classList.add('hidden'), 3000);
    });
}

async function processText(action) {
    const apiKey = document.getElementById('api-key').value;
    const selectedText = document.getElementById('text-input').value;
    if (!apiKey) {
        document.getElementById('output').innerText = "Please enter your API key.";
        return;
    }
    try {
        const response = await callOpenAi(apiKey, selectedText, action);
        document.getElementById('output').innerText = response.data[0];
    } catch (error) {
        console.error("Error:", error);
        document.getElementById('output').innerText = error.message || "An error occurred.";
    }
}


async function callOpenAi(apiKey, selectedText, action) {
    const url = "https://intelli-server.vercel.app/chatbot/chat";
    const data = {
        "api_key": apiKey,
        "model": "gpt4",
        "provider": "openai",
        "action": action,
        "input": {
            "system": `Perform action: ${action} on the selected content text from a web page`,
            "messages": [
                {
                    "role": "user",
                    "content": selectedText
                }
            ]
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': 'root'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error("HTTP-Error: " + response.status);
    }
    return response.json();
}
