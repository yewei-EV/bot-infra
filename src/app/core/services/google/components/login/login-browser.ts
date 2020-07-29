import {Component} from '../component';
import {Injectable} from '@angular/core';
import {Util} from '../../../../../shared';

@Injectable()
export class LoginBrowser extends Component {

  async run() {
    await super.run();
    const page = this.sharedInfo.basic.page;
    this.taskInfo.status = 'Start'
    console.log(page)
    await page.goto("https://www.youtube.com/");
    this.taskInfo.status = 'Log In'
    try {
      console.log("testing...");
    } catch (e) {
      console.log("Error happened" + e)
      await Util.delay(2000);
      await this.run();
    }

    // await page.click(".cart-button");
    // await page.waitForSelector("#in-cart", {visible: true})
    // await Promise.all([
    //   page.waitForNavigation({waitUntil: "load"}),
    //   page.click("#checkout-now")
    // ]);
  }
}
