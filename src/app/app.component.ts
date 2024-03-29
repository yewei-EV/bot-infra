import {ChangeDetectorRef, Component} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {AppConfig} from '../environments/environment';
import getMAC from 'getmac'
import fs from 'fs';
import winston from 'winston';
import HttpsProxyAgent from 'https-proxy-agent/dist/agent';
import {Util} from './shared';
import {ActivationKey} from './core/google';
import {ElectronService} from './core/services/electron/electron.service';

const rp = require('request-promise-native');

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  isActivated: boolean = AppConfig.isActivated;
  activationKey: string = "";
  validateMessage: string = "";
  opened: boolean = false;
  validatingProxy: string = "";

  constructor(
    private translate: TranslateService,
    private electronService: ElectronService,
    private changeDetect: ChangeDetectorRef
  ) {
    translate.setDefaultLang('en');
    this.isActivated = true;
    if (electronService.isElectron) {
      // process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
      console.log(process.env);
      console.log('Mode electron');
      console.log('Electron ipcRenderer', electronService.ipcRenderer);
      console.log('NodeJS childProcess', electronService.childProcess);
      const dirname = this.electronService.remote.app.getPath('userData');
      this.overrideLocalStorage(dirname);
      if (AppConfig.production) {
        this.overrideConsole(dirname);
        this.activationKey = JSON.parse(localStorage.getItem('activationKey')).key || "";
      }
    } else {
      console.log('Mode web');
    }
  }

  private overrideConsole(dirname: string) {

    const logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'user-service' },
      transports: [
        //
        // - Write all logs with level `error` and below to `error.log`
        // - Write all logs with level `info` and below to `combined.log`
        //
        new winston.transports.File({ filename: dirname + '/error.log', level: 'error' }),
        new winston.transports.File({ filename: dirname + '/combined.log' }),
      ],
    });
    const oldConsoleLog = console.log;
    const oldConsoleWarn = console.warn;
    const oldConsoleError = console.error;
    let logMessage = '';
    let warnMessage = '';
    let errorMessage = '';
    console.log = (message, ...optionalParams) => {
      logMessage += message;
      if (logMessage.length > 1024 * 1024) {
        Util.sendLog('-log-' + new Date().getTime(), logMessage).then();
      }
      oldConsoleLog(message, ...optionalParams);
      logger.info(message, ...optionalParams);
    };
    console.warn = (message, ...optionalParams) => {
      warnMessage += message;
      if (warnMessage.length > 1024 * 1024) {
        Util.sendLog('-warn-' + new Date().getTime(), warnMessage).then();
      }
      oldConsoleWarn(message, ...optionalParams);
      logger.warn(message, ...optionalParams);
    };
    console.error = (message, ...optionalParams) => {
      errorMessage += message;
      if (errorMessage.length > 1024 * 1024) {
        Util.sendLog('-error-' + new Date().getTime(), errorMessage).then();
      }
      oldConsoleError(message, ...optionalParams);
      logger.error(message, ...optionalParams);
    };
  }

  validate() {
    let proxyStrings = [];
    if (this.validatingProxy !== "") {
      proxyStrings = this.validatingProxy.split(":");
    }
    let proxy = "";
    if (proxyStrings.length === 2) {
      proxy = 'http://' + proxyStrings[1] + ':' + proxyStrings[2];
    } else {
      proxy = 'http://' + proxyStrings[1] + ':' + proxyStrings[2] + '@' + proxyStrings[3] + ':' + proxyStrings[4];
    }
    this.validateMessage = "Validating...";
    this.changeDetect.detectChanges();
    let url = "https://us-central1-yitian-8e7d0.cloudfunctions.net/validatingService";
    let options = {
      uri: url,
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        activation: this.activationKey,
        mac: getMAC(),
        reset: false
      },
      agent: undefined,
      timeout: 20000
    };
    try {
      rp.get(options, (error, response) => {
        if (error) {
          // use proxy to login
          options.agent = new HttpsProxyAgent(proxy);
          rp.get(options, (error, response) => {
            if (error) {
              this.validateMessage = "Send Validate Request ERROR: " + error;
              this.changeDetect.detectChanges();
            } else {
              if (response.statusCode === 200) {
                if (response.body === "true") {
                  this.isActivated = true;
                  this.changeDetect.detectChanges();
                  let activationInfo = new ActivationKey();
                  activationInfo.key = this.activationKey
                  localStorage.setItem('activationKey', JSON.stringify(activationInfo));
                } else {
                  console.log(response.body)
                  this.validateMessage = "Invalid Key";
                  this.isActivated = false;
                  this.changeDetect.detectChanges();
                }
              } else {
                this.validateMessage = "Validate failed: " + response.statusCode;
                this.isActivated = false;
                this.changeDetect.detectChanges();
              }
            }
          });
        } else {
          if (response.statusCode === 200) {
            if (response.body === "true") {
              this.isActivated = true;
              this.changeDetect.detectChanges();
              let activationInfo = new ActivationKey();
              activationInfo.key = this.activationKey
              localStorage.setItem('activationKey', JSON.stringify(activationInfo));
              this.opened = true;
            } else {
              console.log(response.body)
              this.validateMessage = "Invalid Key";
              this.isActivated = false;
              this.changeDetect.detectChanges();
            }
          } else {
            this.validateMessage = "Validate failed: " + response.statusCode;
            this.isActivated = false;
            this.changeDetect.detectChanges();
          }
        }
      });
    } catch (e) {
      this.validateMessage = "Error: " + e;
      this.changeDetect.detectChanges();
    }
  }

  resetMac() {
    let proxyStrings = [];
    if (this.validatingProxy !== "") {
      proxyStrings = this.validatingProxy.split(":");
    }
    let proxy = "";
    if (proxyStrings.length === 2) {
      proxy = 'http://' + proxyStrings[1] + ':' + proxyStrings[2];
    } else {
      proxy = 'http://' + proxyStrings[1] + ':' + proxyStrings[2] + '@' + proxyStrings[3] + ':' + proxyStrings[4];
    }
    this.validateMessage = "Resetting...";
    this.changeDetect.detectChanges();
    let url = "https://us-central1-yitian-8e7d0.cloudfunctions.net/validatingService";
    let options = {
      uri: url,
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        activation: this.activationKey,
        mac: getMAC(),
        reset: true
      },
      agent: undefined,
      timeout: 20000
    };
    try {
      rp.get(options, (error, response) => {
        if (error) {
          // use proxy to login
          options.agent = new HttpsProxyAgent(proxy);
          rp.get(options, (error, response) => {
            if (error) {
              this.validateMessage = "Send Reset Request ERROR: " + error;
              this.changeDetect.detectChanges();
            } else {
              if (response.statusCode === 200) {
                if (response.body === "true") {
                  this.isActivated = true;
                  this.changeDetect.detectChanges();
                  let activationInfo = new ActivationKey();
                  activationInfo.key = this.activationKey
                  localStorage.setItem('activationKey', JSON.stringify(activationInfo));
                } else {
                  console.log(response.body)
                  this.validateMessage = "Invalid Key";
                  this.isActivated = false;
                  this.changeDetect.detectChanges();
                }
              } else {
                this.validateMessage = "Reset failed: " + response.statusCode;
                this.isActivated = false;
                this.changeDetect.detectChanges();
              }
            }
          });
        } else {
          if (response.statusCode === 200) {
            if (response.body === "true") {
              this.isActivated = true;
              this.changeDetect.detectChanges();
              let activationInfo = new ActivationKey();
              activationInfo.key = this.activationKey
              localStorage.setItem('activationKey', JSON.stringify(activationInfo));
            } else {
              console.log(response.body)
              this.validateMessage = "Invalid Key";
              this.isActivated = false;
              this.changeDetect.detectChanges();
            }
          } else {
            this.validateMessage = "Reset failed: " + response.statusCode;
            this.isActivated = false;
            this.changeDetect.detectChanges();
          }
        }
      });
    } catch (e) {
      this.validateMessage = "Error: " + e;
      this.changeDetect.detectChanges();
    }
  }

  private overrideLocalStorage(dirname: string) {
    localStorage.getItem = (key: string): string => {
      if (fs.existsSync(dirname + '/' + key + '.cfg')) {
        return fs.readFileSync(dirname + '/' + key + '.cfg', 'utf8');
      }
      return "[]";
    }
    localStorage.setItem = (key: string, value: string): void => {
      fs.writeFileSync(dirname + '/' + key + '.cfg', value);
    }
  }
}
