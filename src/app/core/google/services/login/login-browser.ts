import {Service} from '../service';
import {Injectable} from '@angular/core';
import {Util} from '../../../../shared';

@Injectable()
export class LoginBrowser extends Service {

  async run() {
    await super.run();
    const page = this.sharedInfo.page;
    this.taskInfo.status = 'Start'
    await page.goto("https://accounts.google.com/signin/v2/identifier?service=youtube&uilel=3&passive=true&continue=https%3A%2F%2Fwww.youtube.com%2Fsignin%3Faction_handle_signin%3Dtrue%26app%3Dm%26hl%3Den%26next%3Dhttps%253A%252F%252Fm.youtube.com%252F&hl=en&flowName=GlifWebSignIn&flowEntry=ServiceLogin");

    this.taskInfo.status = 'Log In';
    //await Util.delay(100000);
    await page.focus('#Email');
    await page.keyboard.type('gengpei1985@gmail.com');
    await page.keyboard.press('Enter');

    const myLocalValue = 'Woshishui1234';
    await page.waitForSelector('input[type="password"]', { visible: true })
    await page.type('input[type="password"]', myLocalValue)

    await page.waitForSelector('#submit', { visible: true })
    await page.click('#submit')

    // cluster performance testing
    // let i:number = 1
    // let lastTime = Date.now();
    // while(i <= 100) {
    //   let number = Date.now() - lastTime;
    //   lastTime = Date.now()
    //   console.log (this.taskInfo.keywords + " interval: " + number);
    //   await Util.delay(1000);
    //   i++
    // }
    await Util.delay(200000);
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
