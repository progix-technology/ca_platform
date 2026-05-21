const { contextBridge, ipcRenderer } = require('electron');

// Aap yahan functions define kar sakte hain jo frontend use kar sake
contextBridge.exposeInMainWorld('electronAPI', {
    // Example: window close karne ke liye
    closeApp: () => ipcRenderer.send('close-app')
});
