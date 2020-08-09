import {Injectable, Injector} from '@angular/core';
import {Setup} from './setup/setup';
import {LoginBrowser} from './login/login-browser';
import {PuppeteerHar} from '../../../shared/puppeteer-har';
import puppeteer from 'puppeteer-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import {ProxyUtil, Util} from '../../../shared';
import { Browser, Page } from 'puppeteer';
import {ElectronService} from '../../services/electron/electron.service';
import { TaskInfo } from '../entities/task-info';
import {SharedInfo} from '../entities/shared-info';
import {Service} from './service';

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

  private checkTaskInfo(taskInfo: TaskInfo, sharedInfo: SharedInfo, page: Page) {
    const interval = setInterval(async () =>  {
      if (!taskInfo.runnable && taskInfo.running) {
        clearInterval(interval);
        taskInfo.running = false;
        await sharedInfo.har.stop();
        await page.setRequestInterception(true);
        page.on('request', async request => {
          request.abort();
        });
        sharedInfo.har.inProgress = false;
      }
    });
  }

  private async execute(page: Page, taskInfo: TaskInfo) {
    const har = new PuppeteerHar(page);
    const sharedInfo: SharedInfo = new SharedInfo();
    sharedInfo.har = har;
    sharedInfo.page = page;
    this.checkTaskInfo(taskInfo, sharedInfo, page);
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
    const browserWindow = new this.electronService.remote.BrowserWindow({webPreferences: {partition: partition}});
    const sharedObj = this.electronService.remote.getGlobal('sharedObj');
    const port = sharedObj.port;
    await browserWindow.loadFile('public/html/title.html', {query: {title: partition}});
    await browserWindow.setTitle(partition);

    const response = await fetch('http://localhost:' + port + '/json/version');
    const data = await response.json();
    puppeteer.use(stealth());
    const browser: Browser = await puppeteer.connect({
      browserWSEndpoint: data.webSocketDebuggerUrl,
      defaultViewport: null
    });
    const pages = await browser.pages();
    let page;

    const title = encodeURIComponent(partition);
    for (const tmpPage of pages) {
      console.log(await tmpPage.title(), title);
      if (await tmpPage.title() == title) {
        page = tmpPage;
      }
    }
    return page;
  }

  async run(taskInfo: TaskInfo, sessionId: string): Promise<any> {
    taskInfo.runnable = true;
    if (taskInfo.running) {
      return ;
    }
    taskInfo.running = true;
    const page = await this.getPage(sessionId);
    await ProxyUtil.useProxyGroup(page, taskInfo.proxyGroup);
    await this.execute(page, taskInfo);
  }
  async stop(taskInfo: TaskInfo) {
    if (taskInfo.stopping) {
      return;
    }
    taskInfo.runnable = false;
    taskInfo.stopping = true;
    taskInfo.stopping = false;
  }
}
