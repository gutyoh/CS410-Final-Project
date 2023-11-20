const getStoredValue = (key) => {
    return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
            resolve(result[key]);
        });
    });
};

const displayTemporaryMessage = (elementId, displayDuration = 3000) => {
    const element = document.getElementById(elementId);
    element.classList.remove('hidden');
    setTimeout(() => element.classList.add('hidden'), displayDuration);
};

const saveApiKey = () => {
    const apiKey = document.getElementById('api-key').value;
    chrome.storage.local.set({"apiKey": apiKey}, () => {
        console.log('API Key saved');
        displayTemporaryMessage('save-confirm');
    });
};

const bindActionButtons = () => {
    const actionButtons = document.querySelectorAll('.action-button');
    actionButtons.forEach(button => {
        button.addEventListener('click', () => processText(button.id));
    });
};

const initiateProgress = () => {
    const progressBarContainer = document.getElementById('progress-bar-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    progressBarContainer.classList.remove('hidden');
    progressBar.style.backgroundColor = '#5b9bd5';
    progressBar.style.width = '0%';
    progressText.classList.remove('hidden');
    progressText.innerText = 'Starting...';

    return {progressBar, progressText};
};

const completeProgress = ({progressBar, progressText}) => {
    progressBar.style.width = '100%';
    progressBar.style.backgroundColor = '#28a745';
    progressText.innerText = 'Complete!';
    setTimeout(() => resetProgress(progressBar, progressText), 2500);
};

const resetProgress = (progressBar, progressText) => {
    progressBar.style.width = '0%';
    progressBar.style.backgroundColor = '#5b9bd5';
    progressBar.parentElement.classList.add('hidden');
    progressText.classList.add('hidden');
};

const callAIModel = async (apiKey, selectedText, action, model) => {
    const endpoint = "https://intelli-server.vercel.app/chatbot/chat";
    const modelDetails = getModelDetails(model, apiKey, selectedText, action);

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': 'root'
        },
        body: JSON.stringify(modelDetails)
    });

    if (!response.ok) {
        throw new Error("HTTP-Error: " + response.status);
    }
    return response.json();
};

const getModelDetails = (model, apiKey, selectedText, action) => {
    const providers = {
        'openai': {
            "api_key": apiKey,
            "model": "gpt-4-1106-preview",
            "provider": "openai"
        },
        'replicate': {
            "api_key": apiKey,
            "model": "13b-chat",
            "provider": "replicate"
        },
        'cohere': {
            "api_key": apiKey,
            "model": "command",
            "provider": "cohere",
        }
        // TODO: Add HuggingFace and any other models here in the future
    };

    return {
        ...providers[model],
        "action": action,
        "input": {
            "system": `Perform action: ${action} on the selected content text from a web page`,
            "messages": [{"role": "user", "content": selectedText}]
        }
    };
};

const processText = async (action) => {
    const model = document.getElementById('model-select').value;
    const apiKey = document.getElementById('api-key').value;
    const selectedText = document.getElementById('text-input').value;

    if (!apiKey || !model) {
        document.getElementById('output').innerText = "Please enter your API key and select a model.";
        return;
    }

    const progressBar = initiateProgress();
    try {
        const response = await callAIModel(apiKey, selectedText, action, model);
        completeProgress(progressBar);
        document.getElementById('output').innerText = response.data[0];
    } catch (error) {
        console.error("Error:", error);
        document.getElementById('output').innerText = error.message || "An error occurred.";
    }
};


const getEmbedding = async (apiKey, texts, provider) => {
    const endpoint = "https://intelli-server.vercel.app/embed/text";
    const payload = {
        "api_key": apiKey,
        "provider": provider,
        "input": {
            "texts": texts
        }
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
    }

    const jsonResponse = await response.json();

    // Check if the status is "OK"
    if (jsonResponse.status !== "OK") {
        throw new Error(`API Error: ${jsonResponse.status}`);
    }
    
    return jsonResponse.data.map(entry => entry.embedding);
};

const calculateResultSimilarity = async (apiKey, selectedText, outputText, model) => {
    try {
        // Fetch embeddings for the two texts
        const [selectedTextEmbedding, outputTextEmbedding] = await getEmbedding(apiKey, [selectedText, outputText], model);

        // Use Matcher to calculate cosine similarity
        const similarity = Matcher.cosineSimilarity(selectedTextEmbedding, outputTextEmbedding);

        return similarity;
    } catch (error) {
        console.error("Error while fetching embeddings or calculating similarity:", error);
        throw error;
    }
};


document.addEventListener('DOMContentLoaded', async () => {
    const selectedText = await getStoredValue("selectedText");
    const apiKey = await getStoredValue("apiKey");

    document.getElementById('api-key').value = apiKey || '';
    document.getElementById('text-input').value = selectedText || '';
    document.getElementById('text-input').readOnly = false;
    document.getElementById('save-api-key').addEventListener('click', saveApiKey);
    bindActionButtons();
});