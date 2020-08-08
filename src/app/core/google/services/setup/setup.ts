import {Service} from '../service';
import {Injectable} from '@angular/core';
import { Request } from 'puppeteer';
import {ProxyUtil, Util} from '../../../../shared';
import {AppConfig} from '../../../../../environments/environment';

@Injectable()
export class Setup extends Service {

  async run() {
    await super.run();
    let page = this.sharedInfo.page;

    await page.setRequestInterception(true);
    page.on('request', async request => {
      if (this.canAbort(request)) {
        await request.abort();
      } else {
        await this.requestWithRetry(page, request);
      }
    });

    page.on('response', async response => {
      console.debug(response);
    });

    page.on('console', msg => {
      if (!msg.text().includes('Failed to load resource: net::ERR')) {
        console.log(msg);
      }
    });
  }

  async requestWithRetry(page, request) {
    const proxy = page['_proxy'] || ' ';
    await ProxyUtil.proxyHandler(page, request, proxy, async (resp) => {
      return resp;
    });
  }

  canAbort(request: Request) {
    const url = request.url();
    return url.includes('any url u wanna block');
  }

}
