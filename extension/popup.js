// Retrieves a value from Chrome's local storage
const getStoredValue = (key) => {
    return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
            resolve(result[key]);
        });
    });
};

// Displays a temporary message in the UI for a specified duration.
const displayTemporaryMessage = (elementId, displayDuration = 3000) => {
    const element = document.getElementById(elementId);
    element.classList.remove('hidden');
    setTimeout(() => element.classList.add('hidden'), displayDuration);
};

// Saves the API key to Chrome's local storage and displays a confirmation
const saveApiKey = () => {
    const apiKey = document.getElementById('api-key').value;
    chrome.storage.local.set({"apiKey": apiKey}, () => {
        console.log('API Key saved');
        displayTemporaryMessage('save-confirm');
    });
};

// Binds click event listeners to action buttons for processing text
const bindActionButtons = () => {
    const actionButtons = document.querySelectorAll('.action-button');
    actionButtons.forEach(button => {
        button.addEventListener('click', () => processText(button.id));
    });
};

// Initiates the progress bar UI when processing a request
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

// Completes the progress bar UI animation when a request is finished
const completeProgress = ({progressBar, progressText}) => {
    progressBar.style.width = '100%';
    progressBar.style.backgroundColor = '#28a745';
    progressText.innerText = 'Complete!';
    setTimeout(() => resetProgress(progressBar, progressText), 2500);
};

// Resets the progress bar UI for the next request
const resetProgress = (progressBar, progressText) => {
    progressBar.style.width = '0%';
    progressBar.style.backgroundColor = '#5b9bd5';
    progressBar.parentElement.classList.add('hidden');
    progressText.classList.add('hidden');
};

// Processes the response from the AI model, removing unnecessary "wrapper or words or phrases" irrelevant to the action
// This is a "hack" solution, but we need to use it because Llama and Cohere models are "too chatty"
// And they add a lot of unnecessary "leading or finishing wrapper text" to the response!
const processModelResponse = (model, responseText) => {
    const lines = responseText.split('\n');
    const starterWords = ['Sure', 'Certainly'];
    const endingWords = ['Would you', 'Do you', 'Can I', 'Should I', 'Is there', 'Does this', 'I have', 'I hope'];

    if (model === 'replicate' || model === 'cohere') {
        if (lines.length > 0 && starterWords.some(word => lines[0].trim().startsWith(word))) {
            lines.shift();
        }

        for (let i = 0; i < lines.length; i++) {
            const lineTrimmed = lines[i].trim();
            const foundWord = endingWords.find(word => lineTrimmed.includes(word));
            if (foundWord) {
                lines[i] = lineTrimmed.substring(0, lineTrimmed.indexOf(foundWord));
                lines.length = i + 1;
                break;
            }
        }
    }

    let response = lines.join('\n').trim();
    return response.replace(/^"/, '').replace(/"$/, '');
};

// Sends a request to the IntelliServer to process the selected text using an AI model
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

    responseData.data[0] = processModelResponse(model, responseData.data[0]);

    return responseData;
};

// Generates the prompt for the AI model based on the selected action and text
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

// Prepares the details for the model request based on the selected model and user input
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

// Manages the request frequency to avoid overloading the server or API
const requestManager = new RequestManager(5000);

// Processes the user's highlighted/selected text based on the selected action and handles the UI updates
const processText = async (action) => {
    const processingMessageElement = document.getElementById('processing-message');
    const outputElement = document.getElementById('output');
    const actionButtons = document.querySelectorAll('.action-button');

    // Handling request frequency and processing status
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

    // Initiating the request processing
    requestManager.startProcessing();
    actionButtons.forEach(button => button.disabled = true);

    // Preparing the request
    const model = document.getElementById('model-select').value;
    const apiKey = document.getElementById('api-key').value;
    const selectedText = document.getElementById('text-input').value;

    const prompt = generatePrompt(selectedText, action);

    // Validating API key and model selection
    if (!apiKey || !model) {
        outputElement.innerText = "Please enter your API key and select a model.";
        requestManager.stopProcessing();
        actionButtons.forEach(button => button.disabled = false);
        return;
    }

    // Updating UI during the request
    const progressBar = initiateProgress();
    try {
        const response = await callAIModel(apiKey, prompt, action, model);
        completeProgress(progressBar);

        // Displaying the response and calculating similarity
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
        // Handling errors during the request
        console.error("Error:", error);
        outputElement.innerText = error.message || "An error occurred.";
    } finally {
        // Resetting the UI and request manager after completion
        requestManager.stopProcessing();
        actionButtons.forEach(button => button.disabled = false);
        processingMessageElement.innerText = '';
    }
};

// Calculates the similarity between the original text and the AI-generated response
const calculateResultSimilarity = async (apiKey, selectedText, outputText, model) => {
    try {
        const [selectedTextEmbedding, outputTextEmbedding] = await getEmbedding(apiKey, [selectedText, outputText], model);

        return Matcher.cosineSimilarity(selectedTextEmbedding, outputTextEmbedding);
    } catch (error) {
        console.error("Error while fetching embeddings or calculating similarity:", error);
        return 'Similarity could not be calculated. Please try again!';
    }
};

// Updates the UI to display the similarity score and related emoji
const updateSimilarityUI = (similarityScore) => {
    const scoreContainer = document.getElementById('similarity-score-container');
    const scoreValue = document.getElementById('similarity-score-value');
    const indicator = document.getElementById('similarity-indicator');

    scoreValue.innerText = (similarityScore * 100).toFixed(2) + '%';
    indicator.innerText = getEmoji(similarityScore);
    indicator.title = getHoverMessage(similarityScore);
    scoreContainer.classList.remove('hidden');
};

// Determines the emoji to display based on the similarity score
const getEmoji = (similarityScore) => {
    if (similarityScore > 0.7) return '🤩';
    if (similarityScore > 0.4) return '🙂';
    return '😕';
};

// Provides a hover message based on the similarity score
const getHoverMessage = (similarityScore) => {
    if (similarityScore > 0.7) return 'High similarity between the selected text and AI response.';
    if (similarityScore > 0.4) return 'Medium similarity between the selected text and AI response.';
    return 'Low similarity between the selected text and AI response.';
};

// Requests text embeddings from IntelliServer for highlighted/selected texts and the selected AI model
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
            'X-API-KEY': 'root', // Using a root API key for requests
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    // Error handling for failed HTTP requests
    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
    }

    const jsonResponse = await response.json();

    // Error handling for non-OK responses from IntelliServer
    if (jsonResponse.status !== "OK" || !jsonResponse.data) {
        throw new Error(`API Error: ${jsonResponse.status}`);
    }

    // Returning the array of embeddings from the response
    return jsonResponse.data.map(entry => entry.embedding);
};

// Saves the selected AI model in Chrome's local storage for later use or re-use
const saveSelectedModel = () => {
    const selectedModel = document.getElementById('model-select').value;
    chrome.storage.local.set({"selectedModel": selectedModel}, () => {
        console.log('Model saved');
    });
};

// Initializes the extension's popup window when loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Retrieving stored API key, selected model, and text from Chrome's local storage
    const storedApiKey = await getStoredValue("apiKey");
    const storedModel = await getStoredValue("selectedModel");
    const selectedText = await getStoredValue("selectedText");

    // Setting the retrieved values in the popup's UI elements
    if (storedApiKey) {
        document.getElementById('api-key').value = storedApiKey;
    }
    if (storedModel) {
        document.getElementById('model-select').value = storedModel;
    }
    if (selectedText) {
        document.getElementById('text-input').value = selectedText;
    }

    // Adding event listeners to UI elements for handling user interactions
    document.getElementById('text-input').readOnly = false;
    document.getElementById('save-api-key').addEventListener('click', saveApiKey);
    document.getElementById('model-select').addEventListener('change', saveSelectedModel);
    bindActionButtons();
});