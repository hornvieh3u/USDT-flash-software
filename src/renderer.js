// #### Event Listeners #####
document.querySelector("#toggle-mode").addEventListener("change", async (e) => {
    await window.darkMode.toggle(e.target.value)
})

document.querySelector("#save").addEventListener("click", async () => {
    let bidData = {
        client_username:    document.querySelector("#client-username").value,
        chat_server:        document.querySelector("#chat-server").value,
        chat_platform_id:   document.querySelector("#platforms").value,
    };
    let result = await window.bidData.save(bidData);
    // showAlert(result ? "Success!" : "Fail");
    clearFormValues();
})

document.querySelector("#update").addEventListener("click", async () => {
    let updateBidData = {
        id:                 document.querySelector("#bid-id").value,
        client_country:     document.querySelector("#client-country").value,
        client_timezone:    document.querySelector("#client-timezone").value,
        client_call_time:   document.querySelector("#client-call-time").value,
        client_job:         document.querySelector("#client-job").value,
        comment:            document.querySelector("#comment").value,
    }

    await window.bidData.update(updateBidData);
    cancelModal();
})

document.querySelector("#client-username").addEventListener("change", (e) => {
    filterby("search", e.target.value);
})

document.querySelector("#cancel").addEventListener("click", cancelModal)

document.querySelector("#chat-server").addEventListener("focus", () => {
    showChatServers();
})

document.querySelector("#chat-server").addEventListener("keyup", (e) => {
    showChatServers(e.target.value);
})

document.querySelector("#chat-server").addEventListener("focusout", () => {
    setTimeout(() => {
        document.querySelector(".chat-server-list").style.display = "none";
    }, 100);
})

// ##### Act Functions #####
let alertTimer;

function showModal(id, client_username, client_country, client_timezone, client_call_time, client_job, comment) {
    document.querySelector("#bid-id").value             = id;
    document.querySelector("#client-username-display").value    = client_username;
    document.querySelector("#client-country").value     = client_country;
    document.querySelector("#client-timezone").value    = client_timezone;
    document.querySelector("#client-call-time").value   = client_call_time;
    document.querySelector("#client-job").value         = client_job;
    document.querySelector("#comment").value            = comment;

    document.querySelector(".content").classList.add("blur");
    document.querySelector(".bid-update").classList.remove("hide");
}

function cancelModal() {
    clearFormValues()
    document.querySelector(".content").classList.remove("blur");
    document.querySelector(".bid-update").classList.add("hide");
}

function clearFormValues() {
    document.querySelector("#client-username").value = ""
    document.querySelector("#client-country").value = ""
    document.querySelector("#client-timezone").value = ""
    document.querySelector("#client-call-time").value = ""
    document.querySelector("#client-job").value = ""
    // document.querySelector("#chat-server").value = ""
    document.querySelector("#comment").value = ""

    window.bidData.refresh();
}

function showAlert(message) {
    document.querySelector(".alert").innerHTML = message;
    document.querySelector(".alert").style.visibility = "visible";
    if (alertTimer) clearTimeout(alertTimer);
    alertTimer = setTimeout(() => { document.querySelector(".alert").style.visibility = "hidden"; }, 3000);
}

function filterby(type, value) {
    for(let child of document.querySelector("tbody").children) {
        if (type === "search") {
            child.style.display = child.getHTML().toLowerCase().indexOf(value.toLowerCase()) === -1 ? "none" : "table-row";
        } else if (type === "responsed") {
            child.style.display = child.getAttribute("data-is-responsed") != 1 ? "none" : "table-row";
        } else if (type === "timestamp") {
            child.style.display = parseInt(child.getAttribute("data-created-at")) < getTodayTimestamp() ? "none" : "table-row";
        } else {
            child.style.display = "table-row";
        }
    }
}

function getTodayTimestamp() {
    let today = new Date();
    return new Date(`${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`).getTime() + today.getTimezoneOffset() * 60 * 1000;
}

function showChatServers(search) {
    let chatServerDoms = document.getElementsByClassName("chat-server-name");
    let chatServerArr = [];
    let chatServerHTML = "";
    for (let i = 0; i < chatServerDoms.length; i++) {
        let chatServer = chatServerDoms[i].getHTML();
        if (chatServerArr.includes(chatServer) || (search && chatServer.indexOf(search) === -1)) continue;

        chatServerHTML += `<a href="javascript:selectChatServer('${chatServer}');">${chatServer}</a>`;
        chatServerArr.push(chatServer);
    }

    if (!chatServerHTML) {
        document.querySelector(".chat-server-list").style.display = "none";
        return;
    }

    document.querySelector(".chat-server-list").style.display = "flex";
    document.querySelector(".chat-server-list").innerHTML = chatServerHTML;
}

function selectChatServer(chatServerName) {
    document.querySelector("#chat-server").value = chatServerName;
    document.querySelector(".chat-server-list").style.display = "none";
}