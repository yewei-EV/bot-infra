import {Injectable} from '@angular/core';
import {SupremeService} from '../supreme-service';
import {SharedInfo} from '../shared-info';
import {Setup} from '../components/setup/setup';
import {CookieBrowser} from '../components/cookie/cookie-browser';
import {CartBrowser} from '../components/cart/cart-browser';
import {TaskInfo} from '../task-info';
import {PaymentBase} from '../components/payment/payment-base';

@Injectable({
  providedIn: 'root'
})
export class BaseModeService extends SupremeService {

  constructor(
    private setup: Setup,
    private cookie: CookieBrowser,
    private cart: CartBrowser,
    private payment: PaymentBase,
    ) {
    super();
  }

  setSharedInfo(sharedInfo: SharedInfo) {
    super.setSharedInfo(sharedInfo);
    this.cookie.setSharedInfo(sharedInfo);
    this.setup.setSharedInfo(sharedInfo);
    this.cart.setSharedInfo(sharedInfo);
    this.payment.setSharedInfo(sharedInfo);
  }

  setTaskInfo(taskInfo: TaskInfo) {
    super.setTaskInfo(taskInfo);
    this.cookie.setTaskInfo(taskInfo);
    this.setup.setTaskInfo(taskInfo);
    this.cart.setTaskInfo(taskInfo);
    this.payment.setTaskInfo(taskInfo);
  }

  async run() {
    await super.run();
    await this.setup.run();
    await this.cookie.run();
    await this.cart.run();
    await this.payment.run();
    console.log('Finished');
  }
}
