const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('darkMode', {
    toggle: (theme) => ipcRenderer.invoke('dark-mode:toggle', theme),
})

contextBridge.exposeInMainWorld('bidData', {
    getOne: (id) => ipcRenderer.invoke('bid-data:getone', id),
    save: (data) => ipcRenderer.invoke('bid-data:save', data),
    update: (data) => ipcRenderer.invoke('bid-data:update', data),
    refresh: () => ipcRenderer.invoke('bid-data:refresh')
})

ipcRenderer.on("init", (_, platforms) => {
    if (document.getElementById("platforms").innerHTML != "") return;

    platforms.forEach(platform => {
        document.getElementById("platforms").innerHTML += `<option value="${platform.id}">${platform.display_name} - ${platform.platform_name}</option>`
    });
})

ipcRenderer.on("bids", (_, bids) => {
    let tbody = "";
    bids.forEach(bid => {
        let bidCreateAt = new Date(bid.created_at);
        tbody += `<tr data-is-responsed="${bid.is_responsed}" data-created-at="${bid.created_at}" style="${bid.is_responsed ? "color: lightgreen" : ""}">
            <td>${bid.client_username}<br /><span style="font-size: 12px;">(${bidCreateAt.toLocaleDateString()} ${bidCreateAt.toLocaleTimeString()})</span></td>
            <td class="chat-server-name">${bid.chat_server}</td>
            <td>${bid.display_name} - ${bid.platform_name}</td>
            <td>
                <button
                    onclick="showModal(
                        ${bid.id},
                        '${bid.client_username}',
                        '${bid.client_country}',
                        '${bid.client_timezone}',
                        '${bid.client_call_time}',
                        '${bid.client_job}',
                        '${bid.comment}'
                    );"
                >Edit</button>
            </td>
        </tr>`;
    });

    if (tbody) document.querySelector("tbody").innerHTML = tbody;
})

ipcRenderer.on("total_count", (_, totalCnt) => {
    document.getElementById("total-bids-count").innerText = totalCnt;
})

ipcRenderer.on("today_count", (_, todayCnt) => {
    document.getElementById("today-bids-count").innerText = todayCnt;
})

ipcRenderer.on("responsed_count", (_, responsedCnt) => {
    document.getElementById("responsed-bids-count").innerText = responsedCnt;
})