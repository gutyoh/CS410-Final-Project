// Listens for mouseup event to capture and send selected text to the background script
document.addEventListener('mouseup', function () {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText.length > 0) {
        // Sends the selected text to the background script and logs the response
        chrome.runtime.sendMessage({type: 'textSelected', text: selectedText})
            .then(response => console.log(response))
            .catch(error => console.error(error));
    }
});
