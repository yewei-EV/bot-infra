import {Component} from '../component';
import {Injectable} from '@angular/core';
import {Util} from '../../../../../shared';
import {getPureCart, waitingTicket} from './ticketTestDynamic';

@Injectable()
export class CartHybrid extends Component {

  async run() {
    await super.run();
    const page = this.sharedInfo.basic.page;

    await page.goto("https://www.supremenewyork.com/mobile#products/" + this.sharedInfo.product.productId + "/" +
      this.sharedInfo.product.styleId);
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
        const availableSizes = await page.evaluate(() => Array.from(document.querySelectorAll("#size-options"), element => element.textContent));
        for (const availableSize of availableSizes) {
          if (availableSize.trim().includes(this.taskInfo.size[0]) || this.taskInfo.size[0] === 'Random') {
            await page.select("#size-options", String(this.sharedInfo.product.sizeId));
            break;
          }
          console.log("Size not found, will retrying")
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

    // waiting until ticket and _ticket match
    await waitingTicket(page);
    console.log("current cookie after carting: ", await page.cookies())

    let pureCart = await getPureCart(page);
    if (pureCart === "") {
      //TODO 处理加车失败
      console.log("Error happened when adding cart!")
      await Util.delay(this.taskInfo.monitorDelay);
      await this.run();
    }
    // await page.waitForSelector("#in-cart", {visible: true})
  }
}
