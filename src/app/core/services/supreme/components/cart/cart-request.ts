import {Component} from '../component';
import {Injectable} from '@angular/core';
import {Util} from '../../../../../shared';
import {Page} from 'puppeteer';

@Injectable()
export class CartRequest extends Component {

  async run() {
    await super.run();
    this.taskInfo.status = 'Adding to cart'
    const page = this.sharedInfo.basic.page;

    await this.addToCart(page);
    //如果加车成功，会返回一个json
    try {
      // @ts-ignore
      const cookiesAll = (await page._client.send('Network.getAllCookies')).cookies;
      const cartCookie = cookiesAll.filter( x => {
        return x.name == 'pure_cart'
      });
      if (cartCookie.length === 0) {
        console.error("Failed to add cart")
        await Util.delay(this.taskInfo.monitorDelay);
        await this.run();
      }
      console.log("current cookie after carting: ", await page.cookies())
      console.log('Finish carting...')
    } catch (e) {
      console.log("Error happened when adding cart: " + e)
      await Util.delay(this.taskInfo.monitorDelay);
      await this.run();
    }
  }

  //加车
  private async addToCart(page: Page) {
    const product = this.sharedInfo.product;
    const pid = product.productId;
    const sid = product.sizeId;
    const sTid = product.styleId;

    //加车时由于还没有服务器返回的ticket，所以supreme会先用一个生成的错误的_ticket加车
    //加完车后的response，supreme会set一个ticket cookie，wasm查到这个ticket返回后才会重新生成正确的_ticket

    //这个表格平常大部分时间不会改，就是这样的{s: size.get('id'), st: size.get('style').get('id'), qty: qty}
    //但当年supreme在热门发售（bogo周）时曾经多次修改过，最夸张的一次是放入了加减法：
    //data: {s: size.get('id'), st: size.get('id')+size.get('style').get('id'), qty: qty},
    //但大部分情况下只会加入新的key然后放入一些常数
    //data: {s: size.get('id'), n=123, size.get('style').get('id'), qty: qty},
    //这个表格曾经造成大部分bot没办法购买
    //TODO 目前我是hard coded，这里未来要改成动态的
    let atcFormParsed = "";
    if (this.taskInfo.region === "EU" || this.taskInfo.region === "JP") {
      atcFormParsed = `size=${sid}&style=${sTid}&qty=1`;
    } else {
      atcFormParsed = `s=${sid}&st=${sTid}&qty=1`;
    }

    await page.setCookie({
      name: "lastVisitedFragment",
      value: "products/" + pid + "/" + sTid,
      expires: Date.now() / 1000 + 60
    });

    // Use regex to get carting form
    // const atcFormParsed = await this.cartFormMatcher(page, text, sid, sTid);
    // console.log(atcFormParsed);
    // debugger

    await page.evaluate(() => {
      localStorage.clear();
      // @ts-ignore
      setSessionIDs();
    });

    const obj = await page.evaluate(async (atcFormParsed, pid) => {
      const requestHeaders: HeadersInit = new Headers();
      requestHeaders.set("x-requested-with", "XMLHttpRequest");
      requestHeaders.set("accept", "application/json");
      requestHeaders.set("Origin", "https://www.supremenewyork.com/");
      requestHeaders.set("Referer", "https://www.supremenewyork.com/mobile/");
      requestHeaders.set("content-type", "application/x-www-form-urlencoded; charset=utf-8");
      requestHeaders.set("accept-encoding", "gzip, deflate, br");
      requestHeaders.set("accept-language", "en-US,en;q=0.5");
      requestHeaders.set("content-length", atcFormParsed.length);
      const res = await window.fetch('https://www.supremenewyork.com' + `/shop/${pid}/add.json`, {
        method: 'POST',
        headers: requestHeaders,
        body: atcFormParsed,
      })
      return await res.json()
    }, atcFormParsed, pid);
    console.log(obj);
    console.log("current cookie: ", await page.cookies());
    return obj;
  }

  private async cartFormMatcher(page: Page, text: string, sizeID: string, styleID: string) {
    let sizeName = "s";
    let styleName = "st";
    let qtyName = "qty";
    let formParsed = "";
    const regex = new RegExp('src\\=\\".*mobile\\-[0-9a-zA-Z\\_]+\\.js');
    let array = regex.exec(text);
    if (Array.isArray(array)) {
      let jsContent = await page.goto(array[0].replace("src=\"", "http://"));
      const jsText = await jsContent.text();
      //TODO 回到主页面?
      await page.goto('https://www.supremenewyork.com/mobile/');
      const cartRegex = new RegExp('\\{(.*size\\.get.*id.*)\\}');
      let cartForms = cartRegex.exec(jsText);
      if (Array.isArray(cartForms)) {
        let cartForm = cartForms[1].split(",");
        console.log(cartForm)
        for (let segment of cartForm) {
          if (segment.includes("size.get('id')")) {
            sizeName = segment.split(":")[0].replace(/ /g, '');
            if (formParsed !== "") {formParsed += "&"}
            formParsed = formParsed + sizeName + "=" + sizeID;
          } else if (segment.includes("size.get('style')")) {
            styleName = segment.split(":")[0].replace(/ /g, '');
            if (formParsed !== "") {formParsed += "&"}
            formParsed = formParsed + styleName + "=" + styleID;
          } else if (segment.includes("qty")) {
            qtyName = segment.split(":")[0].replace(/ /g, '');
            if (formParsed !== "") {formParsed += "&"}
            formParsed = formParsed + qtyName + "=1";
          } else {
            if (formParsed !== "") {formParsed += "&"}
            formParsed = formParsed + segment.split(":")[0].replace(/ /g, '')
              + "=" + segment.split(":")[1].replace(/ /g, '');
          }
        }
      }
    }
    return formParsed === "" ? `s=${sizeID}&st=${styleID}&qty=1` : formParsed;
  }
}
