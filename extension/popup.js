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

const processModelResponse = (model, responseText) => {
    const lines = responseText.split('\n');

    if (model === 'replicate' || model === 'cohere') {
        if (lines.length > 0 && lines[0].trim().startsWith('Sure')) {
            lines.shift();
        }

        for (let i = 0; i < lines.length; i++) {
            const wouldIndex = lines[i].indexOf('Would');
            if (wouldIndex !== -1) {
                lines[i] = lines[i].substring(0, wouldIndex);
                lines.length = i + 1;
                break;
            }
        }
    }

    let response = lines.join('\n').trim();
    response = response.trim().replace(/^"/, '').replace(/"$/, '');

    return response;
};


const callAIModel = async (apiKey, prompt, action, model) => {
    const endpoint = "https://intelli-server.vercel.app/chatbot/chat";
    const modelDetails = getModelDetails(model, apiKey, prompt, action);

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

    const responseData = await response.json();

    const processedText = processModelResponse(model, responseData.data[0]);

    responseData.data[0] = processedText;

    return responseData;
};


const generatePrompt = (selectedText, action) => {
    let userInstruction;

    switch (action) {
        case 'explain':
            userInstruction = `YOU MUST DIRECTLY provide a comprehensive but CONCISE explanation of the following text, ensuring it's clear and easy to understand. Keep the response concise enough to fit comfortably in a small UI space. Your output MUST ONLY DIRECTLY include the explanation text and NO MORE ADDITIONAL TEXT!`;
            break;
        case 'summarize':
            userInstruction = `YOU MUST DIRECTLY summarize the following text in a brief, clear manner. Focus on key points and ensure the summary is CONCISE for easy reading in a limited UI space. Your output MUST ONLY DIRECTLY include the summarized text and NO MORE ADDITIONAL TEXT!`;
            break;
        case 'paraphrase':
            userInstruction = `YOU MUST DIRECTLY paraphrase the following text to convey the same meaning in different words. Keep the paraphrased text clear and CONCISE for display in a compact UI. Your output MUST ONLY DIRECTLY include the paraphrased text and NO MORE ADDITIONAL TEXT!`;
            break;
        default:
            userInstruction = `Action not recognized. Please select a valid action.`;
    }

    return `${userInstruction}\n\n"${selectedText}"`
};

const getModelDetails = (model, apiKey, prompt, action) => {
    const systemInstruction = `You are a text processing expert. Your task is to ${action} the text given by the user. For every response, YOU MUST NEVER provide ANY INTRODUCTORY OR CONCLUDING PHRASES. YOU MUST strictly adhere to the user's instructions for each action.`;


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
    };

    return {
        ...providers[model],
        "input": {
            "system": systemInstruction,
            "messages": [{"role": "user", "content": prompt}]
        }
    };
};

const requestManager = new RequestManager(5000);

const processText = async (action) => {
    const processingMessageElement = document.getElementById('processing-message');
    const outputElement = document.getElementById('output');
    const actionButtons = document.querySelectorAll('.action-button');

    if (requestManager.isProcessing) {
        processingMessageElement.innerText = 'Processing the previous request. Please wait...';
        return;
    }

    if (!requestManager.canProcessRequest()) {
        const waitTime = requestManager.getTimeUntilNextRequest();
        processingMessageElement.innerText = `Please wait ${waitTime} seconds before making another request.`;
        actionButtons.forEach(button => button.disabled = true);
        setTimeout(() => {
            actionButtons.forEach(button => button.disabled = false);
            processingMessageElement.innerText = '';
        }, waitTime * 1000);
        return;
    }

    requestManager.startProcessing();
    actionButtons.forEach(button => button.disabled = true);

    const model = document.getElementById('model-select').value;
    const apiKey = document.getElementById('api-key').value;
    const selectedText = document.getElementById('text-input').value;

    const prompt = generatePrompt(selectedText, action);

    if (!apiKey || !model) {
        outputElement.innerText = "Please enter your API key and select a model.";
        requestManager.stopProcessing();
        actionButtons.forEach(button => button.disabled = false);
        return;
    }

    const progressBar = initiateProgress();
    try {
        const response = await callAIModel(apiKey, prompt, action, model);
        completeProgress(progressBar);

        const outputText = response.data[0];
        outputElement.innerText = outputText;

        calculateResultSimilarity(apiKey, selectedText, outputText, model)
            .then(similarityScore => {
                updateSimilarityUI(similarityScore)
            })
            .catch(error => {
                console.error("Error while calculating similarity:", error);
            });
    } catch (error) {
        console.error("Error:", error);
        outputElement.innerText = error.message || "An error occurred.";
    } finally {
        requestManager.stopProcessing();
        actionButtons.forEach(button => button.disabled = false);
        processingMessageElement.innerText = '';
    }
};


const calculateResultSimilarity = async (apiKey, selectedText, outputText, model) => {
    try {
        const [selectedTextEmbedding, outputTextEmbedding] = await getEmbedding(apiKey, [selectedText, outputText], model);

        return Matcher.cosineSimilarity(selectedTextEmbedding, outputTextEmbedding);
    } catch (error) {
        console.error("Error while fetching embeddings or calculating similarity:", error);
        return 'Similarity could not be calculated. Please try again!';
    }
};


const updateSimilarityUI = (similarityScore) => {
    const scoreContainer = document.getElementById('similarity-score-container');
    const scoreValue = document.getElementById('similarity-score-value');
    const indicator = document.getElementById('similarity-indicator');

    scoreValue.innerText = (similarityScore * 100).toFixed(2) + '%';
    indicator.innerText = getEmoji(similarityScore);
    indicator.title = getHoverMessage(similarityScore);
    scoreContainer.classList.remove('hidden');
};

const getEmoji = (similarityScore) => {
    if (similarityScore > 0.7) return '🤩';
    if (similarityScore > 0.4) return '🙂';
    return '😕';
};

const getHoverMessage = (similarityScore) => {
    if (similarityScore > 0.7) return 'High similarity between the selected text and AI response.';
    if (similarityScore > 0.4) return 'Medium similarity between the selected text and AI response.';
    return 'Low similarity between the selected text and AI response.';
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
            'X-API-KEY': 'root',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
    }

    const jsonResponse = await response.json();

    if (jsonResponse.status !== "OK" || !jsonResponse.data) {
        throw new Error(`API Error: ${jsonResponse.status}`);
    }

    const embeddings = jsonResponse.data.map(entry => entry.embedding);

    return embeddings;
};

const saveSelectedModel = () => {
    const selectedModel = document.getElementById('model-select').value;
    chrome.storage.local.set({"selectedModel": selectedModel}, () => {
        console.log('Model saved');
    });
};


document.addEventListener('DOMContentLoaded', async () => {
    const storedApiKey = await getStoredValue("apiKey");
    const storedModel = await getStoredValue("selectedModel");
    const selectedText = await getStoredValue("selectedText");

    if (storedApiKey) {
        document.getElementById('api-key').value = storedApiKey;
    }
    if (storedModel) {
        document.getElementById('model-select').value = storedModel;
    }
    if (selectedText) {
        document.getElementById('text-input').value = selectedText;
    }

    document.getElementById('text-input').readOnly = false;
    document.getElementById('save-api-key').addEventListener('click', saveApiKey);
    document.getElementById('model-select').addEventListener('change', saveSelectedModel);
    bindActionButtons();
});