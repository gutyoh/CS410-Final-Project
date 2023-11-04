document.addEventListener('DOMContentLoaded', function () {
    chrome.storage.local.get(["intelliText"], function(result) {
        if (result.intelliText) {
            document.getElementById("output").innerText = result.intelliText;
        }
    });
});