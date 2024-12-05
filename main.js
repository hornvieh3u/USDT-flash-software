require('dotenv').config();

const { app, BrowserWindow, Tray, Notification, Menu, ipcMain, nativeTheme, nativeImage, screen } = require('electron/main')
const path = require('node:path')
const sqlite3 = require("sqlite3").verbose();
const { ethers } = require('ethers');

let wallet, usdtContract;

const INFURA_URL = `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`;
const provider = new ethers.JsonRpcProvider(INFURA_URL);

const USDT_ABI = [
    "function transfer(address to, uint amount) returns (bool)",
    "function balanceOf(address owner) view returns (uint)"
];

async function sendUSDT(toAddress, amount) {
    const amountInUnits = ethers.parseUnits(amount.toString(), 6);

    const tx = await usdtContract.transfer(toAddress, amountInUnits);
    const result = await tx.wait();
    console.log(`Sent ${amount} USDT to ${toAddress}, ${result}`);
    return result;
}

async function getBalance() {
    const balance = await usdtContract.balanceOf(wallet.address);
    return ethers.formatUnits(balance, 6);
}

let db = new sqlite3.Database('E:/James/bids.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Connected to database.');
});

let win;
let willClose = false;
let width = 750;
let height = 630;

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
        icon: path.join(__dirname, 'img/tether.png'),
        alwaysOnTop: true
    })

    win.loadFile('src/index.html')
    win.on('ready-to-show', initData)
    win.on('close', closeApp)
}

function createTray() {
    const icon = nativeImage.createFromPath(path.join(__dirname, 'img/tether.png'))
    const tray = new Tray(icon)

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Quit', type: 'normal', click: () => { willClose = true; app.quit() } },
    ])

    tray.setToolTip('USDT Flash Software')
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
    
}

function getTodayTimestamp() {
    let today = new Date();
    return new Date(`${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`).getTime() + today.getTimezoneOffset() * 60 * 1000;
}

function showNotification(body) {
    new Notification({ title: "USDT Flash Software", body }).show()
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

ipcMain.handle("trade", (_, data) => {
    
})

ipcMain.handle("swap", (_, data) => {
    
})

ipcMain.handle("transfer", async (_, data) => {
    wallet = ethers.Wallet.fromPhrase(data.seedPhrase, provider);
    usdtContract = new ethers.Contract(process.env.USDT_ADDRESS, USDT_ABI, wallet);

    let balance = await getBalance();
    if (balance < data.amount) {
        return { status: false, msg: "Not enough balance!" };
    }

    let result = await sendUSDT(data.receiverAddress, data.amount);

    return { status: true };
})