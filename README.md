# CS410 Fall 2023 - Final Project

## Documentation Content

1. [Overview](#overview)
2. [Installation](#installation)
3. [Usage](#usage)
4. [Demonstration](#demonstration)
5. [Testing](#testing)
6. [Project Documents](#project-documents)
7. [Future Imrpovement](#future-imrpovement)


## overview
Textual Spotlight is a chrome extension designed to empower users with a contextual understanding of web text content. It provides explanations, summaries, and paraphrases of selected text via a seamless browser integration from multiple LLM models with the ability to compare the semantics of the generated result and how closely it is related to the user query. 

## Installation

### Extension
**Prerequisites**: A chromium-based web browser with support for chrome extensions and activation of Developer Mode.

**Step 1**: Obtain the extension by downloading the package from the GitHub.

**Step 2**: Open the extension page in your browser, enable developer mode and import the `extension` folder. 

<img src="screenshots/extension_load.png" width="500em">

**Step 3**: Enter the API key for your provider selection. You can generate the keys from the following providers:
- [platform.openai](https://platform.openai.com/).
- [dashboard.cohere.com](https://dashboard.cohere.com/).
- [replicate.com](https://replicate.com/).

### Backend
Textual Spotlight extension uses the [intelliserver](https://github.com/intelligentnode/IntelliServer) open source node js middleware to communicate with the models and return the response to the extension. The middleware installed in the vercel server to be used for this demo and **no need to install it again to use the extension**.

The steps to setup the backend: 
- Pull the image:
```
docker pull intellinode/intelliserver:latest
```
- Run intelliserver
```
API_KEY=<YOUR_API_KEY>
ADMIN_KEY=<YOUR_ADMIN_KEY>
docker run -p 80:80 -e API_KEY=$API_KEY -e ADMIN_KEY=$ADMIN_KEY intellinode/intelliserver:latest
```

## Usage
Upon successful import of the extension you should see below popup:

<img src="screenshots/popup_default.png" width="350em">

The steps to use the extension after importing to the browser:
1. Navigate to web page of your choice.
2. Select a paragraph from the webpage using the mouse.
3. Manually enter the API KEY for the LLM that you plan to use.
4. Click the extension and select action button:
   - **Explain:** Obtain a detailed explanation of the selected text.
   - **Summarize:** Get a concise summary.
   - **Paraphrase:** Receive the paragraph in different words.

Example of the extension output:

<img src="screenshots/popup_openai.png" width="350em">

## Demonstration
TODO: add the demo video link.

## Testing
- [Click here to view the Project Testing PDF](./docs/CS410_Final_Project_Testing.pdf)

## Project Documents

### Project Proposal

- [Click here to view the Project Proposal PDF](./docs/CS410_Final_Project_Proposal.pdf)
- [Click here to view the Project Proposal in Markdown](./docs/CS410_Final_Project_Proposal.md)

### Project Reports

- [Click here to view the Project Progress Report PDF](./docs/%20CS410_Final_Project_Progress_Report.pdf)


## Future Imrpovement

- **Integrate additional LLMs**: Expand the range of supported models by incorporating open-source LLMs from Hugging Face and similar platforms.

- **Enhance vector similarity accuracy**: Dedicate a third-party model specifically for vector generation to improve relevance scoring and reduce biases inherent in using the same model for both response generation and vector calculation.
