import {Component} from '../component';
import {Injectable} from '@angular/core';
import { Request } from 'puppeteer';
import {ProxyUtil, Util} from '../../../../../shared';
import {AppConfig} from '../../../../../../environments/environment';

@Injectable()
export class Setup extends Component {

  async run() {
    await super.run();
    let page = this.sharedInfo.basic.page;
    if (!page) {
      page = await this.sharedInfo.basic.browser.newPage();
      this.sharedInfo.basic.page = page;
    }
    await page.setRequestInterception(true);
    page.on('request', async interceptedRequest => {
      // 测试cardinal触发验证
      // if (interceptedRequest.url().includes('acs.touch.tech')
      //   || interceptedRequest.url().includes('cardinalcommerce.com')) {
      //   await interceptedRequest.abort();
      // } else {

      if (this.canAbort(interceptedRequest)) {
        await interceptedRequest.abort();
      } else {
        this.requestWithRetry(page, interceptedRequest);
      }
    });
    page.on('response', async response => {
      console.debug(response);
    });
    // page.on('console', msg => {
    //   if (!msg.text().includes('Failed to load resource: net::ERR')) {
    //     console.log(msg);
    //   }
    // });
  }

  async requestWithRetry(page, request) {
    const proxy = page['_proxy'] || ' ';
    await ProxyUtil.proxyHandler(page, request, proxy, async (resp) => {
      if (resp.status === 200 && request.url() === 'https://www.supremenewyork.com/checkout.json' ||
        (request.url().includes('/checkout/') && request.url().includes('/status.json'))) {
        const result = JSON.parse(resp.body.toString());
        if (!Util.getIgnoredStatus().includes(result.status)) {
          console.log(resp.headers, result);
          resp.body = Buffer.from('{"status":"failed","cart":[{"size_id":"' +
            this.sharedInfo.product.sizeId + '","in_stock":true}],"errors":{"order":{},' +
            '"credit_card":{"brand":["is required"],"number":["is not a valid credit card number"]}}}');
          delete resp.headers['set-cookie'];
        } else if (resp.status >= 500) {
          page.setDefaultTimeout(AppConfig.longerTimeout);
          let newResp = resp;
          while (newResp?.status >= 500) {
            await ProxyUtil.proxyHandler(page, request, proxy, async (simpleResponse) => {
              newResp = simpleResponse;
              return simpleResponse;
            });
          }
          page.setDefaultTimeout(AppConfig.defaultTimeout);
          return newResp;
        } else {
          console.log(resp.headers, result);
        }
      }
      return resp;
    });
  }

  canAbort(request: Request) {
    const url = request.url();
    return url.includes('assets.supremenewyork.com') ||
      url.includes('mobile_stock.json') ||
      url.includes(`shop/${this.sharedInfo.product.productId}`);
  }
}
