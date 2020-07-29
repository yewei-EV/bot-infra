import {Injectable} from '@angular/core';
import {Util} from '../../../../../shared';
import {generateTicket, waitingTicket} from '../cart/ticketTestDynamic';
import * as queryString from 'querystring';
import {CaptchaTokenService} from '../../../../../shared/captcha-token.service';
import {Payment} from './payment';
import { uuid } from 'uuidv4';
import {Page} from 'puppeteer';

@Injectable()
export class PaymentRequest extends Payment {

  constructor(protected captchaTokenService: CaptchaTokenService) {
    super(captchaTokenService);
  }

  async run() {
    await super.run();
    let profile = {
      name: this.taskInfo.profile.fullName,
      email: this.taskInfo.profile.email,
      tel: this.taskInfo.profile.phoneNo,
      address: this.taskInfo.profile.address1,
      address2: this.taskInfo.profile.address2,
      zip: this.taskInfo.profile.zipCode,
      city: this.taskInfo.profile.city,
      state: this.taskInfo.profile.state,
      country: this.taskInfo.profile.country,
      credit_card_num: this.taskInfo.profile.cardNo,
      cvv: this.taskInfo.profile.cvvNo,
      month: this.taskInfo.profile.expireMonth,
      year: this.taskInfo.profile.expireYear,
      cardType: this.taskInfo.profile.cardType
    }
    const product = this.sharedInfo.product;
    const page = this.sharedInfo.basic.page;
    const sid = product.sizeId;
    let pure_cart = encodeURIComponent(`{"${sid}":1}`);

    await page.setCookie({ name: "lastVisitedFragment", value: "checkout", expires: Date.now()/1000 + 60});
    // 进入checkout后第一次请求total mobile
    // await this.firstTotalMobile(page, pure_cart);
    console.log("current cookie after entering checkout: ", await page.cookies())

    // 加车后拿到一个ticket
    // await this.getValidTicket()
    //supreme在结账时需要一个名为叫current_time的参数，current_time的出处并不是Date.now()
    //而是supreme mobile网页上有一个  <input type="hidden" name="current_time" id="current_time" value="1588400253">这个element
    // 这个时间每段时间会更新
    //不确定是否可以用Date.now()代替，因为有时候Date.now()和网页结果一致，有时候可能略有区别（因为延迟等原因）
    // let current_time = await this.getCurrentTime();
    //拿到current_time后就可以结账
    this.taskInfo.status = 'Checking out'
    await this.retryCheckout({profile, currentTime: this.taskInfo.currentTime, pure_cart});
  }

  //在加车返回ticket后，需要通过返回的ticket计算正确的_ticket
  private async getValidTicket() {
    const page = this.sharedInfo.basic.page;
    // @ts-ignore
    const cookiesAll = (await page._client.send('Network.getAllCookies')).cookies
    console.log("current cookie: ", await page.cookies())
    //找到ticket的值
    const ticketCookie = cookiesAll.filter(x=>{
      return x.name == 'ticket'
    })
    console.log('Getting valid ticket from api....')

    const ticketValid = await generateTicket(page, ticketCookie[0].value)
    console.log("ticket valid: " + ticketValid);
    return ticketValid;
  }

  protected async checkout(captchaToken, checkInfo: any) {
    const page = this.sharedInfo.basic.page;
    const profile = checkInfo.profile;
    //结账表格
    //order[billing-name] 是一个假的 field(order[bn] 是真的);
    //credit_card[meknk] 以前叫 credit_Card[cvv]
    //结账表格和加车表格一样，在热门周时曾多次修改
    //关于下面的cookie-sub，cookie-sub 其实就是 encodeURIComponent(`{"${sizeID}":1}`)，可以直接用这个计算
    //同时supreme有个cookie名叫pure-cart, pure-cart的值就是encodeURIComponent(`{"${sizeID}":1}`)
    //所以也可以不计算，直接从cookie里面取
    console.log("current cookie: ", await page.cookies());
    console.log("current time: ", checkInfo.currentTime);
    console.log("pure-cart value: " + checkInfo.pure_cart);
    console.log("Card number:" + profile.credit_card_num);
    console.log("Card type:" + profile.cardType);

    //结账表格（注意空的值，是一些骗机器人填的bait），store_credit_id是如果一个人退款后会拿到credit，这里机器人不需要提供这个功能
    let checkoutForm = {};
    //TODO 动态获取表单
    //TODO 日本
    if (this.taskInfo.region === "US") {
      checkoutForm = {
        "from_mobile": 1,
        "same_as_billing_address": 1,
        "cookie-sub": checkInfo.pure_cart,
        "scerkhaj": "CKCRSUJHXH",
        "order[billing_name]": "",
        "order[bn]": profile.name,
        "order[email]": profile.email,
        "order[tel]": profile.tel,
        "order[billing_address]": profile.address,
        "order[billing_address_2]": profile.address2,
        "order[billing_zip]": profile.zip,
        "order[billing_city]": profile.city,
        "order[billing_state]": profile.state,
        "order[billing_country]": profile.country,
        "store_credit_id": "",
        "riearmxa": profile.credit_card_num,
        "credit_card[meknk]": profile.cvv,
        "credit_card[month]": profile.month,
        "credit_card[year]": profile.year,
        "order[terms]": ["0", "1"],
        "current_time": checkInfo.currentTime,
        "rand": ''
      }
    } else if (this.taskInfo.region === "EU") {
      let cardinal_id = await uuid();
      checkoutForm = {
        "from_mobile":1,
        "same_as_billing_address":1,
        "cookie-sub": checkInfo.pure_cart,
        "atok": "sckrsarur",
        "order[billing_name]": profile.name,
        "order[email]": profile.email,
        "order[tel]": profile.tel,
        "order[billing_address]": profile.address,
        "order[billing_address_2]": profile.address2,
        "order[billing_address_3]": "",
        "order[billing_zip]": profile.zip,
        "order[billing_city]": profile.city,
        "order[billing_country]": profile.country,
        "store_credit_id": "",
        "credit_card[type]": profile.cardType,
        "credit_card[cnb]": profile.credit_card_num,
        "credit_card[ovv]": profile.cvv,
        "credit_card[month]": profile.month,
        "credit_card[year]": profile.year,
        "order[terms]":["0","1"],
        "cardinal_id": "0_" + cardinal_id,
      }
    } else if (this.taskInfo.region === "JP") {
      checkoutForm = {
        "from_mobile": 1,
        "same_as_billing_address": 1,
        "cookie-sub": checkInfo.pure_cart,
        "order[billing_name]": profile.name,
        "order[email]": profile.email,
        "order[tel]": profile.tel,
        "order[billing_address]": profile.address,
        "order[billing_address_2]": profile.address2,
        "order[billing_zip]": profile.zip,
        "order[billing_city]": profile.city,
        "order[billing_state]": profile.state,
        "store_credit_id": "",
        "credit_card[type]": profile.cardType,
        "credit_card[cnb]": profile.credit_card_num,
        "credit_card[vval]": profile.cvv,
        "credit_card[month]": profile.month,
        "credit_card[year]": profile.year,
        "order[terms]": ["0", "1"],
        "current_time": checkInfo.currentTime,
        "rand": ''
      }
    }

    //这周在这里captcha后supreme多增加了一个request
    //supreme会访问一个叫totalMobile的api，这个api会重设cookieJar，改变ticket和supreme session
    // await this.totalMobile(page, profile, pure_cart);

    checkoutForm["g-recaptcha-response"] = captchaToken;

    //这里把结账表格转换成QueryString,我不确定node-fetch是不是可以像request-promise这个包直接传入form
    let checkoutFormParsed = await queryString.stringify(checkoutForm);
    this.sharedInfo.basic.checkoutForm = checkoutFormParsed;

    console.log("current cookie before checkout: ", await page.cookies());
    console.log(checkoutForm);

    const res = await page.evaluate(async (checkoutFormParsed) => {
      const requestHeaders: HeadersInit = new Headers();
      requestHeaders.set("x-requested-with", "XMLHttpRequest");
      requestHeaders.set("accept", "application/json");
      requestHeaders.set("Origin", "https://www.supremenewyork.com/");
      requestHeaders.set("Referer", "https://www.supremenewyork.com/mobile/");
      requestHeaders.set("content-type", "application/x-www-form-urlencoded; charset=utf-8");
      requestHeaders.set("accept-encoding", "gzip, deflate, br");
      requestHeaders.set("accept-language", "en-US,en;q=0.5");
      requestHeaders.set("content-length", checkoutFormParsed.length);
      const res = await window.fetch('https://www.supremenewyork.com/checkout.json', {
        method: 'POST',
        headers: requestHeaders,
        body: checkoutFormParsed,
      })
      const resObj = await res.json()
      console.log(resObj);
      return resObj;
    }, checkoutFormParsed)
    console.log("current cookie: ", await page.cookies())
    console.log("Response: ", res)
    console.log('Finish checkout...')
    return res;
  }

  //结账request会返回一个slug，用这个slug可以查询订单状态，加车->结账->查询都用同一条proxy （agent那个位置）
  protected async getOrderStatus(slug) {
    const page = this.sharedInfo.basic.page;
    console.log("Slug: " + slug);
    const obj = await page.evaluate(async (slug) => {
      const resp = await window.fetch('https://www.supremenewyork.com' + `/checkout/${slug}/status.json`);
      if (resp.status === 200) {
        return await resp.json();
      } else {
        return {};
      }
    }, slug);
    // await waitingTicket(page);
    return obj;
  }

  protected async cardinalBypass(page: Page, slug) {
    console.log("Cardinal Bypassing...")
    console.log(this.sharedInfo.basic.checkoutForm);
    console.log(slug);
    // 会得到一个{"status":"cardinal_queued","slug":"1592474773232dab95235ed0db5f587c"}
    const res = await page.evaluate(async (checkoutFormParsed, slugNo) => {
      const requestHeaders: HeadersInit = new Headers();
      requestHeaders.set("x-requested-with", "XMLHttpRequest");
      requestHeaders.set("accept", "application/json");
      requestHeaders.set("Origin", "https://www.supremenewyork.com/");
      requestHeaders.set("Referer", "https://www.supremenewyork.com/mobile#checkout/");
      requestHeaders.set("content-type", "application/x-www-form-urlencoded; charset=utf-8");
      requestHeaders.set("accept-encoding", "gzip, deflate, br");
      requestHeaders.set("accept-language", "en-US,en;q=0.5");
      requestHeaders.set("content-length", checkoutFormParsed.length);
      const res = await window.fetch('https://www.supremenewyork.com/checkout/'+ slugNo +'/cardinal.json', {
        method: 'POST',
        headers: requestHeaders,
        body: checkoutFormParsed,
      })
      const resObj = await res.json()
      console.log(resObj);
      return resObj;
    }, this.sharedInfo.basic.checkoutForm, slug);
    if (res.status === "cardinal_queued") {
      console.log("cardinal status: " + "cardinal_queued")
      return;
    } else {
      console.log("cardinal status: " + res.status)
      console.log(res)
      throw res.status;
    }
  }

  protected async delay() {
    await Util.delay(10000);
  }

  private async firstTotalMobile(page, pure_cart) {
    await page.evaluate(async () => {
      let totalMobileForm =
        `?order%5Bbilling_country%5D=USA&cookie-sub=${pure_cart}&order%5Bbilling_state%5D=&order%5Bbilling_zip%5D=&mobile=true`;
      await window.fetch('https://www.supremenewyork.com/checkout/totals_mobile.js' + totalMobileForm);
    });
  }

  //上周supreme在结账页面时加入了一个新的request
  private async totalMobile(page, profile, pure_cart) {
    let totalMobileForm =
      `?order%5Bbilling_country%5D=${profile.country}&cookie-sub=${pure_cart}&order%5Bbilling_state%5D=${profile.state}&order%5Bbilling_zip%5D=${profile.zip}&mobile=true`
    return await page.goto('https://www.supremenewyork.com/checkout/totals_mobile.js' + totalMobileForm);
  }

}
