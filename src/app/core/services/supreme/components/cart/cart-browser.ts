import {Component} from '../component';
import {Injectable} from '@angular/core';
import {Util} from '../../../../../shared';
import {getPureCart} from './ticketTestDynamic';

@Injectable()
export class CartBrowser extends Component {

  async run() {
    await super.run();
    const page = this.sharedInfo.basic.page;

    await page.goto("https://www.supremenewyork.com/mobile#products/" + this.sharedInfo.product.productId + "/" +
      this.sharedInfo.product.styleId);
    // in order to add shoppingSessionId into cookie
    await page.evaluate(() => {
      localStorage.clear();
      // @ts-ignore
      setSessionIDs();
    });
    this.taskInfo.status = 'Adding to cart'
    try {
      // product with size
      console.log("One size: " + this.sharedInfo.product.oneSize);
      if (!this.sharedInfo.product.oneSize) {
        await page.waitForSelector("#size-options");
        await page.tap("#size-options");
        await Util.delay(100)
        const availableSize = await page.evaluate(() => Array.from(document.querySelectorAll("#size-options"), element => element.textContent));
        if (availableSize[0].trim().includes(this.taskInfo.size[0]) || this.taskInfo.size[0] === 'Random') {
          await page.select("#size-options", String(this.sharedInfo.product.sizeId));
        } else {
          console.log("Size not found, will retrying, available size: " + availableSize[0])
          await Util.delay(this.taskInfo.monitorDelay);
          await this.run();
        }
      }
    } catch (e) {
      console.log("Error happened when choosing size: " + e)
      await Util.delay(this.taskInfo.monitorDelay);
      await this.run();
    }
    //add to cart
    await page.waitForSelector(".cart-button");
    await page.click(".cart-button");

    await page.waitForSelector("#in-cart", {visible: true})
    // let pureCart = await getPureCart(page);
    // if (pureCart === "") {
    //   console.log("Error happened when adding cart!")
    //   await Util.delay(this.taskInfo.monitorDelay);
    //   await this.run();
    // }

    await Promise.all([
      page.waitForNavigation({waitUntil: "load"}),
      page.click("#checkout-now")
    ]);
    await page.waitForSelector("#checkout-form");
  }
}
