console.log('Background skill run!');

browser.runtime.onMessage.addListener((message) => {
    console.log('message received in background script');
});