import {Page} from 'puppeteer';

export class Util {

  static async delay(ms: number) {
    await new Promise(resolve => setTimeout(()=>resolve(), ms));
  }

  static async fetch(page: Page, input: RequestInfo, init?: RequestInit, timeout?: number) {
    const objPromise = page.evaluate(async (arg1: string, arg2?: string) => {
      const input = JSON.parse(arg1);
      const init = JSON.parse(arg2);
      const response = await window.fetch(input, init);
      if (response.status == 200) {
        return response.json();
      } else {
        return null;
      }
    }, JSON.stringify(input), JSON.stringify(init));
    return await Promise.race([
      objPromise,
      new Promise<Response>((resolve, reject) => setTimeout(() => {
        reject('time out');
      }, timeout))
    ]);
  }

  static format(s) {
    return s.toString().replace(/\d{4}(?=.)/g, '$& ');
  }

  static async sendLog(s: string, logMessage: string) {

  }
}
