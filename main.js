const { app, BrowserWindow, Tray, Notification, Menu, ipcMain, nativeTheme, nativeImage, screen } = require('electron/main')
const path = require('node:path')
const sqlite3 = require("sqlite3").verbose();

let db = new sqlite3.Database('E:/James/bids.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Connected to the bids database.');
});

let win;
let willClose = false;
let width = 550;
let height = 600;

function createWindow() {
    let display = screen.getPrimaryDisplay();

    win = new BrowserWindow({
        width,
        height,
        x: display.workArea.width - width - 400,
        y: display.workArea.height - height,
        webPreferences: {
            preload: path.join(__dirname, 'src/preload.js')
        },
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'img/bid.png'),
        alwaysOnTop: true
    })

    win.loadFile('src/index.html')
    win.on('ready-to-show', initData)
    win.on('close', closeApp)
}

function createTray() {
    const icon = nativeImage.createFromPath(path.join(__dirname, 'img/bid.png'))
    const tray = new Tray(icon)

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Quit', type: 'normal', click: () => { willClose = true; app.quit() } },
    ])

    tray.setToolTip('Bid Application')
    tray.setContextMenu(contextMenu)
    tray.on("double-click", () => { win.show(); })
}

function closeApp(e) {
    if (willClose) {
        db.close();
        return;
    }

    e.preventDefault();
    win.hide();
}

function initData() {
    // platforms
    db.all("SELECT * FROM chat_platforms", [], (_, rows) => {
        win.webContents.send('init', rows);
    })
    // bids data
    db.all(`SELECT
                "clients".*,
                "chat_platforms".platform_name,
                "chat_platforms".user_name,
                "chat_platforms".display_name
            FROM
                "clients",
                "chat_platforms" 
            WHERE
                clients.chat_platform_id = chat_platforms.id
            ORDER BY
                "clients".created_at DESC`, [], (_, rows) => {
        win.webContents.send('bids', rows);
    })
    // total bid count
    db.all("SELECT count(*) total_count FROM clients", [], (_, rows) => {
        win.webContents.send('total_count', rows[0].total_count)
    });
    // today bid count
    db.all(`SELECT count(*) today_count FROM clients WHERE created_at > ${getTodayTimestamp()}`, [], (_, rows) => {
        win.webContents.send('today_count', rows[0].today_count)
    });
    // responsed bid count
    db.all("SELECT count(*) responsed_count FROM clients where is_responsed = 1", [], (_, rows) => {
        win.webContents.send('responsed_count', rows[0].responsed_count)
    });
}

function getTodayTimestamp() {
    let today = new Date();
    return new Date(`${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`).getTime() + today.getTimezoneOffset() * 60 * 1000;
}

function showNotification(body) {
    new Notification({ title: "Bid App", body }).show()
}

app.whenReady().then(() => {
    createWindow()
    createTray()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on("window-all-closed", () => {
    // Your Code
});

ipcMain.handle('dark-mode:toggle', (_, theme) => {
    nativeTheme.themeSource = theme
})

ipcMain.handle("bid-data:update", (_, data) => {
    try {
        db.run(
            `UPDATE "main"."clients"
            SET
                "client_country" = ?,
                "client_timezone" = ?,
                "client_call_time" = ?,
                "client_job" = ?,
                "comment" = ?,
                "is_responsed" = 1
            WHERE
                id = ?`,
            [
                data.client_country,
                data.client_timezone,
                data.client_call_time,
                data.client_job,
                data.comment,
                data.id
            ]
        );
        return true;
    } catch (error) {
        return false;
    }
})

ipcMain.handle("bid-data:save", (_, data) => {
    try {
        db.run(
            `INSERT INTO "main"."clients"
            (
                "client_username",
                "client_country",
                "client_timezone",
                "client_call_time",
                "client_job",
                "chat_platform_id",
                "chat_server",
                "is_responsed",
                "comment",
                "created_at"
            )
            VALUES (?, "", "", "", "", ?, ?, 0, "", ?)`,
            [
                data.client_username,
                data.chat_platform_id,
                data.chat_server,
                Date.now()
            ]
        );
        return true;
    } catch (error) {
        return false;
    }
})

ipcMain.handle("bid-data:refresh", () => {
    initData();
})