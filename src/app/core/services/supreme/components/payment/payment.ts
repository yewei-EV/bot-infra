import {Component} from '../component';
import {Util} from '../../../../../shared';
import {Page} from 'puppeteer';
import {CaptchaTokenService} from '../../../../../shared/captcha-token.service';
import {SuccessLog} from '../../success-log';

export class Payment extends Component {
  constructor(protected captchaTokenService: CaptchaTokenService) {
    super();
  }

  protected async cardinalBypass(page: Page, slug) {
    return ;
  }

  protected async getOrderStatus(slug) {
    const page = this.sharedInfo.basic.page;
    const response = await page.waitForResponse(res => res.url().includes('/checkout/') && res.url().includes('/status.json'));
    const obj: any = await response.json();
    return obj;
  }

  protected async checkOrderStatus(page: Page, slug): Promise<any> {
    const obj = await this.getOrderStatus(slug);
    if (obj.status === 'cca' && this.taskInfo.region === "EU") {
        console.log(obj.status)
        await this.cardinalBypass(page, slug);
        obj.status = 'queued';
    }
    if (obj.status == 'queued') {
      //supreme结账后进入queue，就代表通过bot检测了，在处理
      //这个处理过程得有10s-20s不等
      //如果没有进入queue直接fail，那就说明要么是request本身有问题，要么是被bot检测到了
      console.log('checking order status, please wait ... ')
      this.taskInfo.status = "Checking status";
    } else {
      let status = obj.status;
      this.taskInfo.status = "Checkout: " + status;
      console.log("checkout res: " + status);
      let success = new SuccessLog();
      if (status) {
        success.region = this.taskInfo.region;
        success.mode = this.taskInfo.mode;
        success.imageUrl = this.taskInfo.imageUrl;
        success.profile = this.taskInfo.profile.name;
        success.product = this.taskInfo.productName;
        let now = new Date();
        let utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
        success.date = utc.toString();
        success.status = status;
        success.monitorDelay = this.taskInfo.monitorDelay;
        success.checkoutDelay = this.taskInfo.checkoutDelay;
        success.proxy = this.taskInfo.proxy.name;
      }
      if (status === "paid") {
        Util.sendYitianWebhook(success, true).then();
        let curSuccessLog = JSON.parse(localStorage.getItem('successLog')) || [];
        curSuccessLog.push(success);
        localStorage.setItem('successLog', JSON.stringify(curSuccessLog));
        // Util.sendLog(obj).then();
      } else if (status === "dup" || status === "canada" || status === "blocked_country" || status === "blacklisted") {
        Util.sendYitianWebhook(success, false).then();
        this.taskInfo.status = "Fail: " + status;
        // Util.sendLog(obj).then();
      } else {
        Util.sendYitianWebhook(success, false).then();
        this.taskInfo.status = "Checkout Failed";
        console.log('Checkout Failed')
        console.log(obj)
        // Util.sendLog(obj).then();
      }
    }
    return obj;
  }

  protected async checkout(captchaToken: string, checkInfo: any): Promise<any> {
    return ;
  }
  protected async delay() {
  }

  async retryCheckout(checkInfo: any = null) {
    const page = this.sharedInfo.basic.page;
    let retryTimes = 0;
    let slug = '';
    let startTime = new Date().getTime();
    const token = await this.captchaTokenService.getToken(this.taskInfo);
    console.log("Captcha Got: " + token);
    console.log("Product: " + this.taskInfo.productName + ", size: " + this.taskInfo.size);
    let endTime = new Date().getTime();
    let diffTime = endTime - startTime;
    console.log("Used Time: " + diffTime);
    let status;
    while (retryTimes < 60) {
      retryTimes ++;
      diffTime = new Date().getTime() - startTime;
      if (diffTime < this.taskInfo.checkoutDelay) {
        // checkout delay
        console.log("Waiting...")
        await Util.delay(this.taskInfo.checkoutDelay - diffTime);
      }
      startTime = new Date().getTime();
      this.taskInfo.status = "Submitting";
      console.log('Submitting Order...');
      const result = await this.checkout(token, checkInfo);
      status = result.status;
      if (Util.getIgnoredStatus().includes(status)) {
        this.taskInfo.status = "Checkout: " + status;
        slug = result.slug;
        break;
      }
    }
    if (slug !== '') {
      await this.delay();
      let orderInfo: any = await this.checkOrderStatus(page, slug);
      status = orderInfo.status;
      while (orderInfo.status === 'queued') {
        await this.delay();
        orderInfo = await this.checkOrderStatus(page, slug);
      }
      status = orderInfo.status;
    }
    if (!Util.getIgnoredStatus().includes(status)) {
      throw 'retryAgain';
    }
  }
}
