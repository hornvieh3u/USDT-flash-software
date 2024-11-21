const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('action', {
    trade: (id) => ipcRenderer.invoke('trade', id),
    swap: (data) => ipcRenderer.invoke('swap', data),
    transfer: (data) => ipcRenderer.invoke('transfer', data),
})

ipcRenderer.on("init", (_, data) => {
    
})