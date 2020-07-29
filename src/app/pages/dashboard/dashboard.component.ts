import {ChangeDetectorRef, Component, Injector, Input, OnInit, TemplateRef} from '@angular/core';
import {Cluster} from 'puppeteer-cluster';
import {Md5} from 'ts-md5';
import puppeteer from 'puppeteer-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import {IDropdownSettings} from 'ng-multiselect-dropdown';
import {BrowserModeService} from "../../core/services/google/browser-mode/browser-mode.service";
import {ProxyUtil, Util} from "../../shared";
import {CaptchaTokenService} from '../../shared/captcha-token.service';
import {ElectronService} from '../../core/services';
import {AppConfig} from '../../../environments/environment';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {PuppeteerHar} from '../../shared/puppeteer-har';
import UserAgent from 'user-agents';
import {Browser} from 'puppeteer';
import {TaskInfo} from '../../core/services/google/task-info';
import {SharedInfo} from '../../core/services/google/shared-info';
import {LoginBrowser} from '../../core/services/google/components/login/login-browser';
import {Setup} from '../../core/services/google/components/setup/setup';
import {ProfileInfo} from '../../core/services/google/profile-info';
import {ProxyGroup} from '../../core/services/google/proxy-group';
import {ProxyInfo} from '../../core/services/google/proxy-info';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  @Input()
  profiles: ProfileInfo[];
  @Input()
  proxyGroups: ProxyGroup[];

  private args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-gpu",
    "--disable-infobars",
    "--window-size=375,812",
    "--ignore-certificate-errors",
    "--ignore-certificate-errors-spki-list",
    '--disable-web-security',
    '--disable-dev-shm-usage',
  ];
  getChromiumExecPath() {
    return puppeteer.executablePath().replace('app.asar', 'app.asar.unpacked');
  }

  browser: Browser;
  taskInfos: TaskInfo[];
  curTaskInfo: TaskInfo = new TaskInfo();
  curProfileIndex: number;
  curProxyGroupIndex: number;
  curStockProxyGroupIndex: number = -1;
  captchaProxy: string;
  opened: boolean = false;

  curModal: BsModalRef;
  config = {
    animated: true,
    keyboard: true,
    backdrop: true,
    ignoreBackdropClick: true
  };

  private productPurchaseCluster: Cluster<{taskInfo: TaskInfo, sharedInfo: SharedInfo}, void>;

  constructor(private electronService: ElectronService, private cd: ChangeDetectorRef,
              private modalService: BsModalService, private captchaTokenService: CaptchaTokenService) {}

  async initProductPurchaseProcessor() {

    const puppeteerOptions = {
      timeout: 0,
      ignoreHTTPSErrors: true,
      headless: AppConfig.headless,
      args: this.args,
      ignoreDefaultArgs: ['--disable-extensions'],
      executablePath: this.getChromiumExecPath()
    };
    const workerCount = this.taskInfos.length;
    const cluster: Cluster<{taskInfo: TaskInfo, sharedInfo: SharedInfo}, void> = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: workerCount,
      puppeteer,
      workerCreationDelay: 1000,
      puppeteerOptions,
      timeout: 2400000,
    });

    await cluster.task(async ({ page, data}) => {
      const har = new PuppeteerHar(page);
      const taskInfo = data.taskInfo;
      const sharedInfo = data.sharedInfo;
      if (!taskInfo) {
        return;
      }
      try {
        const interval = setInterval(async () => {
          if (!taskInfo.runnable) {
            clearInterval(interval);
            if (har.inProgress) {
              const result = await har.stop();
              await Util.sendLog('-har-' + new Date().getTime(), result);
            }
            await page.close();
          }
        }, 100);
        await ProxyUtil.useProxyGroup(page, data.taskInfo.proxy);
        const userAgent = new UserAgent({deviceCategory: 'mobile'});
        let device = {
          name: userAgent.platform,
          userAgent: userAgent.userAgent,
          viewport: {
            width: userAgent.screenWidth,
            height: userAgent.screenHeight,
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true,
            isLandscape: false,
          },
        };
        await page.emulate(device);
        const htmlPage = await page.goto('https://www.google.com/');
        const text = await htmlPage.text();

        const injector = Injector.create({
          providers: [
            {provide: BrowserModeService},
            {provide: LoginBrowser},
            {provide: Setup},
            {provide: CaptchaTokenService, useValue: this.captchaTokenService},
            {provide: ElectronService},
        ]});
        let emailService;
        sharedInfo.basic.har = har;
        sharedInfo.basic.page = page;
        emailService = injector.get(BrowserModeService);
        emailService.setSharedInfo(sharedInfo);
        emailService.setTaskInfo(taskInfo);
        const dirname = this.electronService.remote.app.getPath('userData');
        const name = taskInfo.keywords + taskInfo.colors + Date.now();
        const path = dirname + '/results'  + name + '.har';
        await har.start({captureMimeTypes: undefined, path, saveResponse: true});
        await emailService.run();
        taskInfo.running = false;
        taskInfo.runnable = false;
        if (har.inProgress) {
          const result = await har.stop();
          await Util.sendLog('-har-' + new Date().getTime(), result);
        }
        page.setDefaultTimeout(2400000);
        await Util.delay(2400000);
      } catch (e) {
        if (har.inProgress && this.productPurchaseCluster) {
          const result = await har.stop();
          await Util.sendLog('-har-' + new Date().getTime(), result);
        }
        taskInfo.running = false;
        if (e === 'retryAgain') {
          taskInfo.runnable = true;
        }
        console.error(e);

      }
    });
    cluster.on('taskerror', async (err, data, willRetry) => {
      if (willRetry) {
        console.warn(`Encountered an error while crawling ${data}. ${err.message}\nThis job will be retried`);
      } else {
        console.error('Failed to crawl ', data, ':', err);
        const har = data?.sharedInfo?.basic?.har;
        if (har?.inProgress) {
          const result = await har.stop();
          await Util.sendLog('-har-' + new Date().getTime(), result);
        }
      }
    });
    this.productPurchaseCluster = cluster;
  }

  ngOnInit(): void {
    setInterval(() => {
      this.cd.detectChanges();
    }, 200);
    this.curStockProxyGroupIndex = Number(localStorage.getItem('stockProxyIndex')) || -1;
    this.taskInfos = JSON.parse(localStorage.getItem('taskInfos')) || [];
    for (const taskInfo of this.taskInfos) {
      taskInfo.runnable = false;
      taskInfo.running = false;
      taskInfo.status = 'Not Start';
    }
    if (!this.profiles) {
      this.profiles = JSON.parse(localStorage.getItem('profiles')) || [];
    }
    if (!this.proxyGroups) {
      this.proxyGroups = JSON.parse(localStorage.getItem('proxyGroups')) || [];
    }
    //To show the placeholder in select
    this.curTaskInfo.region="";
    this.curTaskInfo.mode="";
    this.curTaskInfo.proxy=null;
    this.curTaskInfo.cardinalBP="false";
    this.curTaskInfo.captchaBP="";
    this.curTaskInfo.category="";
  }

  openModalWithClass(template: TemplateRef<any>) {
    this.curModal = this.modalService.show(
      template,
      Object.assign({}, this.config, {class: 'gray modal-lg'})
    );
  }

  getProxyInfos(): ProxyInfo[] {
    const proxyInfos: ProxyInfo[] = [];
    let proxyGroup;
    if (this.curStockProxyGroupIndex > -1) {
      proxyGroup = this.proxyGroups[this.curStockProxyGroupIndex];
    }
    if (proxyGroup) {
      for (const [index] of proxyGroup.ipAddress.entries()) {
        const proxyInfo = ProxyGroup.createProxyInfo(proxyGroup, index);
        if (proxyInfo) {
          proxyInfos.push(proxyInfo);
        }
      }
    }
    return proxyInfos;
  }


  async init(): Promise<void> {
    puppeteer.use(stealth());
    await this.initProductPurchaseProcessor();

  }

  async stopAll() {
    for (const taskInfo of this.taskInfos) {
      taskInfo.runnable = false;
      taskInfo.running = false;
      taskInfo.status = 'Not Start';
    }

    const cluster = this.productPurchaseCluster;
    this.productPurchaseCluster = null;
    if (cluster) {
      // await cluster.idle();
      await cluster.close();
    }
    await this.browser?.close();
  }

  async startTask(index: number) {
    if (!this.productPurchaseCluster) {
      await this.init();
    }
    this.taskInfos[index].status = "Monitoring stock";
    this.taskInfos[index].running = false;
    this.taskInfos[index].runnable = true;
    const sharedInfo = new SharedInfo();
    setTimeout(async () => {
      if (this.productPurchaseCluster) {
        await this.productPurchaseCluster.queue({sharedInfo: sharedInfo, taskInfo: this.taskInfos[index]});
      }
    });
  }

  allTaskStopped(): boolean {
    return this.taskInfos.every((taskInfo) => !taskInfo.runnable);
  }

  async stopTask(index: number) {
    const taskInfo = this.taskInfos[index];
    taskInfo.runnable = false;
    taskInfo.running = false;
    taskInfo.status = 'Not Start';
  }

  async startAll() {
    if (!this.productPurchaseCluster) {
      await this.init();
    }
    for (const taskInfo of this.taskInfos) {
      taskInfo.status = "Monitoring stock";
      taskInfo.runnable = true;
      taskInfo.running = false;
    }
    //TODO start all

    // setTimeout(async () => {
    //   for (const stockRequest of this.stockRequests) {
    //     this.scanStock(stockRequest).then();
    //   }
    //   for (const productRequest of this.productRequests) {
    //     this.scanProduct(productRequest).then();
    //   }
    // });
  }

  addTask() {
    if (this.curProxyGroupIndex > -1) {
      this.curTaskInfo.proxy = this.proxyGroups[this.curProxyGroupIndex];
    } else {
      this.curTaskInfo.proxy = new ProxyGroup();
      this.curTaskInfo.proxy.name = "localhost";
    }
    this.curTaskInfo.profile = this.profiles[this.curProfileIndex];
    if (TaskInfo.isFullInfo(this.curTaskInfo)) {
      // use proxy
      delete this.curTaskInfo.md5;
      const value = JSON.stringify(this.curTaskInfo);
      // if (!this.taskInfos.filter(taskInfo => taskInfo.md5 == md5).length) {
      this.curTaskInfo.md5 = Md5.hashStr(value).toString();
      this.taskInfos.push({ ...this.curTaskInfo});
      localStorage.setItem('taskInfos', JSON.stringify(this.taskInfos));
      // }
      console.log(this.taskInfos)
    }
  }

  editTask(index: number) {
    this.curTaskInfo.region = this.taskInfos[index].region;
    this.curTaskInfo.mode = this.taskInfos[index].mode;
    this.curProxyGroupIndex = this.proxyGroups.findIndex(group => group.name === this.taskInfos[index].proxy.name);
    // this.curTaskInfo.cardinalBP = this.taskInfos[index].cardinalBP;
    this.curTaskInfo.captchaBP = this.taskInfos[index].captchaBP;
    this.curTaskInfo.keywords = this.taskInfos[index].keywords;
    this.curTaskInfo.colors = this.taskInfos[index].colors;
    this.curTaskInfo.category = this.taskInfos[index].category;
    this.curProfileIndex = this.profiles.findIndex(profile => profile.name === this.taskInfos[index].profile.name);
    this.curTaskInfo.monitorDelay = this.taskInfos[index].monitorDelay;
    this.curTaskInfo.checkoutDelay = this.taskInfos[index].checkoutDelay;
  }

  deleteTask(index: number) {
    this.taskInfos.splice(index, 1);
    localStorage.setItem('taskInfos', JSON.stringify(this.taskInfos));
  }

  clearForm() {
    this.curTaskInfo.region = "";
    this.curTaskInfo.mode = "";
    this.curTaskInfo.proxy = null;
    this.curProxyGroupIndex = null;
    // this.curTaskInfo.cardinalBP = "";
    this.curTaskInfo.captchaBP = "";
    this.curTaskInfo.keywords = "";
    this.curTaskInfo.colors = "";
    this.curTaskInfo.category = "";
    this.curProfileIndex = null;
    this.curTaskInfo.monitorDelay = null;
    this.curTaskInfo.checkoutDelay = null;
  }

  async test() {
    /*
    this.captchaTokenService.getToken().then((token) => console.log(token));
    this.captchaTokenService.getToken().then((token) => console.log(token));
    this.captchaTokenService.getToken().then((token) => console.log(token));
     */
  }

  openCaptcha() {
    console.log("Captcha Proxy: " + this.captchaProxy);
    if (!this.captchaProxy || this.captchaProxy === "") {
      this.captchaTokenService.addYoutubeWindow("", "", "", "");
    } else {
      let strings = this.captchaProxy.split(":");
      if (strings.length === 4) {
        this.captchaTokenService.addYoutubeWindow(strings[0], strings[1], strings[2], strings[3]);
      } else if (strings.length === 2) {
        this.captchaTokenService.addYoutubeWindow(strings[0], strings[1], "", "");
      } else {
        this.captchaTokenService.addYoutubeWindow("", "", "", "");
      }
    }
  }

  async deleteAll() {
    try {
      await this.stopAll();
    } catch (e) {
      // ignore
    }
    this.taskInfos = [];
    localStorage.setItem('taskInfos', null);
  }

  getYoutubeLoginNumber() {
    return this.captchaTokenService.getNumber();
  }

  clearYoutube() {
    this.captchaTokenService.clearYoutubeWindows();
  }

  stockProxyChanged(groupIndex) {
    this.curStockProxyGroupIndex = groupIndex;
    localStorage.setItem('stockProxyIndex', groupIndex);
  }
}
