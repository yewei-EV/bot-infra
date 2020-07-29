import {Injectable} from '@angular/core';
import {CaptchaTokenService} from '../../../../../shared/captcha-token.service';
import {Payment} from './payment';

@Injectable()
export class PaymentBrowser extends Payment {
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

  private fillMobilePaymentElements = async (cardNo, cvvNo, month, year, cardName, cvvName, monthName, yearName) => {
    let event = document.createEvent('Event');
    event.initEvent('change', true, true);
    console.log(cardNo, cvvNo, month, year, cardName, cvvName, monthName, yearName);
    document.querySelector<HTMLInputElement>('#order_terms').checked = true;
    document.querySelector<HTMLInputElement>(`[name="${cardName}"]`).value = cardNo;
    document.querySelector<HTMLInputElement>(`[name="${cvvName}"]`).value = cvvNo;
    document.querySelector<HTMLInputElement>(`[name="${monthName}"]`).value = month;
    document.querySelector<HTMLInputElement>(`[name="${monthName}"]`).dispatchEvent(event);
    document.querySelector<HTMLInputElement>(`[name="${yearName}"]`).value = year;
    document.querySelector<HTMLInputElement>(`[name="${yearName}"]`).dispatchEvent(event);
  };

  protected async checkout(captchaToken: string, checkInfo: any) {
    const page = this.sharedInfo.basic.page;
    await page.evaluate((captchaToken, captchaBypass) => {
      document.querySelector<HTMLInputElement>('#mobile_checkout_form').setAttribute('credit_verified', String(1));
      // if (captchaBypass === 'true') {
      //    document.querySelector<HTMLInputElement>(`[name="g-recaptcha-response"]`).remove();
      // } else {
      document.querySelector<HTMLInputElement>(`[name="g-recaptcha-response"]`).value = captchaToken;
      // }
      // @ts-ignore mobile checkout callback
      window.recaptchaCallback();
    }, captchaToken, this.taskInfo.captchaBP);

    const response = await page.waitForResponse(response => response.ok() && response.url() === 'https://www.supremenewyork.com/checkout.json');
    console.log("current cookie after checkout: ", await page.cookies());
    return await response.json();
  };

  async run() {
    await super.run();
    const page = this.sharedInfo.basic.page;
    const profile = this.taskInfo.profile;
    this.taskInfo.status = "Checking out";
    let formElements = await page.evaluate(this.getFormElements);
    await page.waitForSelector(`[name="${formElements[0]}"]`);

    if (this.taskInfo.region === "EU" || this.taskInfo.region === "JP") {
      await page.select(`[name="credit_card[type]"]`, profile.cardType);
    }
    await page.evaluate(
      this.fillMobilePaymentElements,
      profile.cardNo,
      // Util.format(profile.cardNo),
      profile.cvvNo,
      profile.expireMonth,
      profile.expireYear,
      formElements[0],
      formElements[1],
      formElements[2],
      formElements[3]
    );

    // handle Canada address
    if (this.taskInfo.region === "US" && profile.country !== 'USA') {
      await page.select(`[name="order[billing_state]"]`, profile.state);
    }

    await this.retryCheckout();
  }
}
