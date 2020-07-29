import {Injectable} from '@angular/core';
import path from "path";
import {ElectronService} from '../core/services';
import {AppConfig} from '../../environments/environment';
import {ProxyInfo} from '../core/services/supreme/proxy-info';
import {Util} from './util';
import Mutex from 'async-mutex/lib/Mutex';
import {TaskInfo} from '../core/services/supreme/task-info';
import {HarvesterInfo} from '../core/services/supreme/harvesterInfo';

function promisify(func) {
  return function (arg) {
    return new Promise<string>((resolve) => {
      function callback(event, result: string) { // our custom callback for f
        resolve(result);
      }
      func(arg, callback);
    });
  };
}

@Injectable({
  providedIn: 'root'
})
export class CaptchaTokenService {

  private partitionCaptcha = 'captcha';
  private captchaOpened: boolean[] = [];
  private rrIndex = 0;
  private youtubeWindows = [];
  private captchaWindows = [];
  private proxyInfos: ProxyInfo[] = [];
  private mutex = new Mutex();
  private harvesterInfoMap: {[key:string]:HarvesterInfo} = {};

  constructor(private electronService: ElectronService) { }

  private getPartition(index: number) {
    return 'persist:' + this.partitionCaptcha + index;
  }

  private async showCaptchaWindow() {
    let harvesterPath;
    if (AppConfig.production) {
      harvesterPath = path.join(__dirname + '/assets/js/harvester.js');
    } else {
      harvesterPath = this.electronService.remote.getGlobal('sharedObj')['dirname'] + '/src/assets/js/harvester.js';
    }
    const captchaWindow = new this.electronService.remote.BrowserWindow({
      webPreferences: {preload: harvesterPath, partition: this.getPartition(this.rrIndex)},
      width: 488,
      height: 850,
    });
    const index = this.rrIndex;
    captchaWindow.on('closed', () => {
      this.captchaOpened[index] = false;
    });
    captchaWindow.show();
    await captchaWindow.loadURL('https://www.supremenewyork.com/mobile');
    captchaWindow.setTitle("Captcha Harvester");
    if (index >= this.captchaOpened.length) {
      this.captchaWindows.push(captchaWindow);
      this.captchaOpened.push(true);
    } else {
      this.captchaOpened[index] = true;
      this.captchaWindows[index] = captchaWindow;
    }
  }

  async getToken(taskInfo: TaskInfo): Promise<string> {
    const release = await this.mutex.acquire();
    const rrIndex = this.rrIndex;
    if (!this.captchaOpened[rrIndex]) {
      await this.showCaptchaWindow();
    }
    const tokenCreate = promisify(this.electronService.remote.ipcMain.on);

    const window = this.captchaWindows[rrIndex];
    window.webContents.send('requestCaptcha');
    if (this.youtubeWindows.length > 0) {
      this.rrIndex++;
      this.rrIndex = this.rrIndex % this.youtubeWindows.length;
    }
    const promise = new Promise<string>((resolve) => {
      setInterval(() => taskInfo.runnable||resolve(null), 100);
    });
    const token = await Promise.race([
      tokenCreate('sendCaptcha'),
      promise
    ]);
    if (!taskInfo.runnable) {
      window.close();
      this.captchaOpened[rrIndex] = false;
    }
    release();
    return token;
  }

  setProxyInfos(proxyInfos: ProxyInfo[]) {
    this.proxyInfos = proxyInfos;
  }

  private getProxyInfo(index: number) {
    index = index % this.proxyInfos.length;
    return this.proxyInfos[index];
  }

  addYoutubeWindow(ip: string, port: string, userName: string, password: string) {
    const index = this.youtubeWindows.length;
    const youtubeWindow = new this.electronService.remote.BrowserWindow({
      webPreferences: {
        partition: this.getPartition(index),
        devTools: false
      }
    });
    if (ip !== "") {
      const proxyRules = ip + ':' + port;
      youtubeWindow.webContents.session.setProxy({proxyRules: proxyRules}).then();
      youtubeWindow.webContents.on('login',
        function (event, request, authInfo, callback) {
          event.preventDefault();
          if (authInfo.isProxy) {
            callback(userName, password);
          }
      });
    }
    youtubeWindow.loadURL(
      "https://accounts.google.com/signin/v2/identifier?hl=en&service=youtube&continue=https%3A%2F%2Fwww.youtube.com%2Fsignin%3Ffeature%3Dsign_in_button%26hl%3Den%26app%3Ddesktop%26next%3D%252F%26action_handle_signin%3Dtrue&passive=true&uilel=3&flowName=GlifWebSignIn&flowEntry=ServiceLogin",
      {userAgent: 'Chrome'}).then()
    youtubeWindow.once("ready-to-show", function() {
      youtubeWindow.show();
    });
    youtubeWindow.on( "page-title-updated",  async () => {
      console.log("URL Changed: " + youtubeWindow.webContents.getURL());
      // remove youtube windows if logout is click
      if (youtubeWindow.webContents.getURL().includes("https://accounts.google.com/Logout?")) {
        Util.delay(1000).then();
        this.youtubeWindows.splice(-1,1);
        youtubeWindow.loadURL(
          "https://accounts.google.com/signin/v2/identifier?hl=en&service=youtube&continue=https%3A%2F%2Fwww.youtube.com%2Fsignin%3Ffeature%3Dsign_in_button%26hl%3Den%26app%3Ddesktop%26next%3D%252F%26action_handle_signin%3Dtrue&passive=true&uilel=3&flowName=GlifWebSignIn&flowEntry=ServiceLogin",
          {userAgent: 'Chrome'}).then()
      }
      // add to youtube windows only if login is successful
      if (youtubeWindow.webContents.getURL() === "https://www.youtube.com/") {
        if (this.youtubeWindows.indexOf(youtubeWindow) < 0) {
          this.youtubeWindows.push(youtubeWindow);
          // youtubeWindow.close();
          this.rrIndex = this.captchaOpened.length;
          await this.showCaptchaWindow();
        }
        let harvesterInfo = new HarvesterInfo();
        if (ip !== "") {
          harvesterInfo.proxy = ip + ":" + port;
        } else {
          harvesterInfo.proxy = "localhost";
        }
        harvesterInfo.index = index;
        this.harvesterInfoMap[this.getPartition(index)] = harvesterInfo;
      }
    });
  }

  async openCaptchaWindow(index: number) {
    let harvesterPath;
    if (AppConfig.production) {
      harvesterPath = path.join(__dirname + '/assets/js/harvester.js');
    } else {
      harvesterPath = this.electronService.remote.getGlobal('sharedObj')['dirname'] + '/src/assets/js/harvester.js';
    }
    if (!this.captchaOpened[index]) {
      const captchaWindow = new this.electronService.remote.BrowserWindow({
        webPreferences: {preload: harvesterPath, partition: this.getPartition(index)},
        width: 488,
        height: 850,
      });
      captchaWindow.on('closed', () => {
        this.captchaOpened[index] = false;
      });
      captchaWindow.show();
      await captchaWindow.loadURL('https://www.supremenewyork.com/mobile');
      captchaWindow.setTitle("Captcha Harvester");
      this.captchaOpened[index] = true;
      this.captchaWindows[index] = captchaWindow;
    }
  }

  getNumber() {
    return this.youtubeWindows.length;
  }

  clearYoutubeWindows() {
    for (let window of this.youtubeWindows) {
      if (!window.isDestroyed()) {
        window.close();
      }
    }
    for (let window of this.captchaWindows) {
      if (!window.isDestroyed()) {
        window.close();
      }
    }
    for (let i = 0; i < this.youtubeWindows.length; i++) {
      const session = this.electronService.remote.session.fromPartition(this.getPartition(i));
      session.clearStorageData().then();
    }
    this.youtubeWindows = [];
    this.captchaWindows = [];
    this.captchaOpened = [];
    this.harvesterInfoMap = {};
  }

  test() {
    console.log("rrIndex: " + this.rrIndex);
    console.log("captchaOpened: ");
    console.log(this.captchaOpened);
    console.log("captchaWindows: ");
    console.log(this.captchaWindows);
    console.log("youtubeWindows: ");
    console.log(this.youtubeWindows);
  }

  getHarvesterInfos() {
    return this.harvesterInfoMap;
  }
}
