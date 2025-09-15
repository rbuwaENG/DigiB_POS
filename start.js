require("@electron/remote/main").initialize();
require("electron-store").initRenderer();
const setupEvents = require("./installers/setupEvents");
if (setupEvents.handleSquirrelEvent()) {
    return;
}
const server = require('./server');
const { app, BrowserWindow, ipcMain, screen} = require("electron");
const path = require("path");
const contextMenu = require("electron-context-menu");
let { Menu, template } = require("./assets/js/native_menu/menu");
const menuController = require('./assets/js/native_menu/menuController.js');
const Datastore = require("@seald-io/nedb");
const validator = require("validator");
const isPackaged = app.isPackaged;
const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
let mainWindow;

// Settings database setup
const appName = process.env.APPNAME;
const appData = process.env.APPDATA;
const settingsDbPath = path.join(
    appData,
    appName,
    "server",
    "databases",
    "settings.db",
);

let settingsDB = new Datastore({
    filename: settingsDbPath,
    autoload: true,
});

function createWindow() {

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    mainWindow = new BrowserWindow({
        width: width,
        height: height,
        frame: true,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: false,
            contextIsolation: false,
        },
    });
    menuController.initializeMainWindow(mainWindow); 
    mainWindow.maximize();
    mainWindow.show();

    mainWindow.loadURL(`file://${path.join(__dirname, "index.html")}`);

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
    
}

app.on("browser-window-created", (_, window) => {
    require("@electron/remote/main").enable(window.webContents);
});

app.whenReady().then(() => {
    createWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});

ipcMain.on("app-quit", (evt, arg) => {
    app.quit();
});

ipcMain.on("app-reload", (event, arg) => {
    mainWindow.reload();
});

ipcMain.on("restart-app", () => {
    autoUpdater.quitAndInstall();
});



// Test IPC communication
ipcMain.on('test-ipc', (event) => {
    console.log('IPC test received');
    event.reply('test-ipc-response', 'IPC communication working');
});

ipcMain.handle('get-printers', async () => {
    console.log('get-printers IPC received');
    
    // Instead of using getPrintersAsync() which triggers dialog,
    // let's provide a manual list of common printers
    const commonPrinters = [
        { name: "Microsoft Print to PDF", displayName: "Microsoft Print to PDF" },
        { name: "Default Printer", displayName: "Default Printer" },
        { name: "Canon LBP6030/6040/6018L", displayName: "Canon LBP6030/6040/6018L" },
        { name: "HP LaserJet", displayName: "HP LaserJet" },
        { name: "Epson Printer", displayName: "Epson Printer" }
    ];
    
    console.log('Returning common printers:', commonPrinters);
    return commonPrinters;
});

ipcMain.on('print-bill', (event, billHTML) => {
    // Get printer name from settings
    settingsDB.findOne({ _id: 1 }, (err, settingsDoc) => {
        let printerName = 'Canon LBP6030/6040/6018L'; // Default fallback
        
        if (!err && settingsDoc && settingsDoc.settings && settingsDoc.settings.printer_device) {
            printerName = validator.unescape(settingsDoc.settings.printer_device);
        }
        
        // Create hidden window for printing
        const printWindow = new BrowserWindow({ show: false });

        printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(billHTML));

        printWindow.webContents.on('did-finish-load', () => {
            printWindow.webContents.print({
                silent: true,
                printBackground: true,
                deviceName: printerName
            }, (success, errorType) => {
                if (!success) console.log('Print failed:', errorType);
                printWindow.close();
            });
        });
    });
});


//Context menu
contextMenu({
    prepend: (params, browserWindow) => [
        {
            label: "Refresh",
            click() {
                mainWindow.reload();
            },
        },
    ],
});

//Live reload during development
if (!isPackaged) {
    try {
        require("electron-reloader")(module);
    } catch (_) {}
}
