import {Injectable} from '@angular/core';
import {Util} from '../../../../../shared';
import {CaptchaTokenService} from '../../../../../shared/captcha-token.service';
import {Payment} from './payment';

@Injectable()
export class PaymentBase extends Payment {
  constructor(protected captchaTokenService: CaptchaTokenService) {
    super(captchaTokenService);
  }

  private getFormElements = async () => {
    let inputDivs = document.querySelectorAll('input');
    let selectDivs = document.querySelectorAll('select');
    let cardName = '';
    let cvvName = '';
    let month = '';
    let year = '';
    let cardType = '';
    for (let input of inputDivs) {
      let placeholderName = input.placeholder;
      if (placeholderName) {
        if (placeholderName === 'credit card number') {
          cardName = input.name;
        } else if (placeholderName === 'cvv') {
          cvvName = input.name;
        }
      }
    }
    if (!cardName || !cvvName) {
      for (let input of inputDivs) {
        let len = input.maxLength;
        if (len != null) {
          if (len > 15 && !cardName) {
            cardName = input.name;
          } else if (len < 5 && !cvvName) {
            cvvName = input.name;
          }
        }
      }
    }
    for (let select of selectDivs) {
      const name = select.name;
      const value = select.options[0].value;
      switch (value) {
        case '01':
          month = name;
          break;
        case '2020':
          year = name;
          break;
        case 'visa':
          cardType = name;
          break;
      }
    }
    return [cardName, cvvName, month, year];
  };

  protected async checkout(captchaToken: string, checkInfo: any): Promise<any> {
    const page = this.sharedInfo.basic.page;
    await page.evaluate((captchaToken, captchaBypass) => {
      document.querySelector<HTMLInputElement>('#mobile_checkout_form').setAttribute('credit_verified', String(1));
      // if (captchaBypass === 'true') {
      //   document.querySelector<HTMLInputElement>(`[name="g-recaptcha-response"]`).remove();
      // } else {
      document.querySelector<HTMLInputElement>(`[name="g-recaptcha-response"]`).value = captchaToken;
      // }
    }, captchaToken, this.taskInfo.captchaBP);
    await page.waitForSelector('#submit_button', {visible: true});
    // Todo change this code, cause it is a temporary solution.
    await Util.delay(100);
    await page.click('#submit_button');
    const response = await page.waitForResponse(response => response.url() === 'https://www.supremenewyork.com/checkout.json');
    console.log("current cookie after checkout: ", await page.cookies());
    return await response.json();
  };

  async run() {
    await super.run();
    const page = this.sharedInfo.basic.page;
    const profile = this.taskInfo.profile;
    this.taskInfo.status = "Checking out";
    await page.waitForSelector("#submit_button");
    let formElements = await page.evaluate(this.getFormElements);
    await page.waitForSelector(`[name="${formElements[0]}"]`);

    if (this.taskInfo.region === "EU" || this.taskInfo.region === "JP") {
      await page.select(`[name="credit_card[type]"]`, profile.cardType);
    }

    await page.focus(`[name="${formElements[0]}"]`);
    for (let char of profile.cardNo) {
      await page.type(`[name="${formElements[0]}"]`, char);
      await Util.delay(10);
    }
    await page.type(`[name="${formElements[0]}"]`, profile.cardNo);
    await Util.delay(40);
    await page.focus(`[name="${formElements[1]}"]`);
    await page.type(`[name="${formElements[1]}"]`, profile.cvvNo);
    await Util.delay(40);
    await page.focus(`[name="${formElements[2]}"]`);
    await page.select(`[name="${formElements[2]}"]`, profile.expireMonth);
    await Util.delay(40);
    await page.focus(`[name="${formElements[3]}"]`);
    await page.select(`[name="${formElements[3]}"]`, profile.expireYear);

    // handle Canada address
    if (this.taskInfo.region === "US" && profile.country !== 'USA') {
      await page.select(`[name="order[billing_state]"]`, profile.state);
    }

    await page.click("#order_terms");
    await this.retryCheckout();
  }
}
