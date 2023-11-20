document.addEventListener('mouseup', function () {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText.length > 0) {
        chrome.runtime.sendMessage({type: 'textSelected', text: selectedText})
            .then(response => console.log(response))
            .catch(error => console.error(error));
    }
});
