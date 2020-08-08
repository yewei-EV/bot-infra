// import { app, BrowserWindow, screen } from 'electron';
const {BrowserWindow, app, remote}= require('electron');
const path = require('path');
const url = require('url');
const net = require('net');
async function getPort(): Promise<number> {
  const getAvailablePort = options => new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(options, () => {
      const {port} = server.address();
      server.close(() => {
        resolve(port);
      });
    });
  });
  return await getAvailablePort(0);
}
getPort().then(port => {
  app.commandLine.appendSwitch('remote-debugging-port', port.toString());
  global['sharedObj'] = {dirname: path.join(__dirname), port: port};
});
let win = null;
const args = process.argv.slice(1),
    serve = args.some(val => val === '--serve');

function createWindow() {

  // Create the browser window
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: 1220,
    height: 870,
    icon: path.join(__dirname, 'public/icons/windows/hypeeyes-logo.png'),
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: serve,
      webSecurity: false,
      // disable dev tools
      devTools: true
    },
  });
  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, 'public/icons/mac/hypeeyes-logo.png'));
  }

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL('http://localhost:4200').then();
  } else {
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    })).then();
  }
  win.setMenu(null);

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

try {

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });
  app.on('login', (event, webContents, request, authInfo, callback) => {
    event.preventDefault();
  })

} catch (e) {
  // Catch Error
  // throw e;
}
