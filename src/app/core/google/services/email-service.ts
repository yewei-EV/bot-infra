import {Injectable, Injector} from '@angular/core';
import {Setup} from './setup/setup';
import {LoginBrowser} from './login/login-browser';
import {PuppeteerHar} from '../../../shared/puppeteer-har';
import {ProxyUtil, Util} from '../../../shared';
import { Browser, Page } from 'puppeteer';
import {ElectronService} from '../../services/electron/electron.service';
import {Service} from './service';
import path from 'path';
import {SharedInfo, TaskInfo} from '../entities';

@Injectable()
export class EmailService {
  constructor(private electronService: ElectronService) {
  }

  private async executeService(injector: Injector, type: typeof Service, taskInfo: TaskInfo, sharedInfo: SharedInfo) {
    const service = injector.get(type);
    service.setSharedInfo(sharedInfo);
    service.setTaskInfo(taskInfo);
    await service.run();
  }

  private checkTaskInfo(taskInfo: TaskInfo, sharedInfo: SharedInfo, page: Page, oldInterval: NodeJS.Timeout) {
    const interval = setInterval(async () => {
      if (!taskInfo.runnable && taskInfo.running) {
        console.log('stopped');
        clearInterval(interval);
        taskInfo.running = false;
        const har = sharedInfo.har;
        if (har) {
          await har.stop();
          har.inProgress = false;
        }
        if (page) {
          await page.setRequestInterception(true);
          page.on('request', async request => {
            request.abort();
          });
        }
      } else if (!taskInfo.running) {
        clearInterval(interval);
      }
    }, 100);
    if (oldInterval) {
      clearInterval(oldInterval);
    }
    return interval;
  }

  private async execute(page: Page, taskInfo: TaskInfo, sharedInfo: SharedInfo) {
    const har = new PuppeteerHar(page);

    sharedInfo.har = har;
    sharedInfo.page = page;
    const dirname = this.electronService.remote.app.getPath('userData');
    const name = taskInfo.keywords + taskInfo.colors + Date.now();
    const path = dirname + '/results' + name + '.har';
    await har.start({captureMimeTypes: undefined, path, saveResponse: true});
    const serviceList = [Setup, LoginBrowser];
    const providers = [];
    for (const service of serviceList) {
      providers.push({provide: service});
    }
    const injector = Injector.create({
      providers: providers
    });
    try {
      for (const service of serviceList) {
        await this.executeService(injector, service, taskInfo, sharedInfo);
      }
      if (har.inProgress) {
        await har.stop();
      }
      page.setDefaultTimeout(2400000);
      await Util.delay(2400000);
    } catch (e) {
      if (har.inProgress) {
        await har.stop();
      }
      taskInfo.running = false;
      if (e === 'retryAgain') {
        taskInfo.runnable = true;
      }
      console.warn(e);
    }
    taskInfo.running = false;
  }

  async getPage(sessionId: string): Promise<Page> {
    const prefix = 'persist:session';
    const partition = prefix + sessionId;
    console.log(partition);
    const browserWindow = new this.electronService.remote.BrowserWindow({
      webPreferences: {
        partition: partition,
        plugins: true,
        sandbox: true,
        preload: path.resolve('public/js/preload.js'),
        contextIsolation: true,
        enableRemoteModule: false,
        scrollBounce: true,
        disableBlinkFeatures: 'AutomationControlled',
        spellcheck: true,
        javascript: true
        // this is removed from chrome
        // enableWebSQL: true,
      }
    });
    const url = 'about:blank?id=' + partition;
    await browserWindow.loadURL(url);
    browserWindow.webContents.openDevTools();
    const browser: Browser = this.electronService.remote.getGlobal('sharedObj').browser;
    let page;
    const pages = await browser.pages();
    for (const tmpPage of pages) {
      if (await tmpPage.url() == url) {
        page = tmpPage;
      }
    }
    return page;
  }

  async run(taskInfo: TaskInfo, sessionId: string): Promise<any> {
    taskInfo.runnable = true;
    if (taskInfo.running) {
      console.warn('it is running, do not try to run it again.');
      return ;
    }
    try {
      taskInfo.running = true;
      const sharedInfo: SharedInfo = new SharedInfo();
      const interval = this.checkTaskInfo(taskInfo, sharedInfo, null, null);
      const page = await this.getPage(sessionId);
      this.checkTaskInfo(taskInfo, sharedInfo, page, interval);
      await ProxyUtil.useProxyGroup(page, taskInfo.proxyGroup);
      await this.execute(page, taskInfo, sharedInfo);
      taskInfo.running = false;
    } catch (e) {
      console.log(e);
      taskInfo.running = false;
    } finally {

    }
  }
  async stop(taskInfo: TaskInfo) {
    taskInfo.runnable = false;
    console.log('stopping');
  }
}
