// Background service worker for Cross-Search extension
// Handles extension lifecycle events

chrome.runtime.onInstalled.addListener(() => {
  console.log('Cross-Search extension installed');
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Cross-Search extension started');
});
