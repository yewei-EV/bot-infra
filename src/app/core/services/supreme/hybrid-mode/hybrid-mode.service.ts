import {Injectable} from '@angular/core';
import {SupremeService} from '../supreme-service';
import {SharedInfo} from '../shared-info';
import {Setup} from '../components/setup/setup';
import {TaskInfo} from '../task-info';
import {CartBrowser} from '../components/cart/cart-browser';
import {PaymentRequest} from '../components/payment/payment-request';
import {CartHybrid} from '../components/cart/cart-hybrid';

@Injectable({
  providedIn: 'root'
})
export class HybridModeService extends SupremeService {

  constructor(
    private setup: Setup,
    private cart: CartHybrid,
    private payment: PaymentRequest,
  ) {
    super();
  }

  setSharedInfo(sharedInfo: SharedInfo) {
    super.setSharedInfo(sharedInfo);
    this.setup.setSharedInfo(sharedInfo);
    this.cart.setSharedInfo(sharedInfo);
    this.payment.setSharedInfo(sharedInfo);
  }

  setTaskInfo(taskInfo: TaskInfo) {
    super.setTaskInfo(taskInfo);
    this.setup.setTaskInfo(taskInfo);
    this.cart.setTaskInfo(taskInfo);
    this.payment.setTaskInfo(taskInfo);
  }

  async run() {
    await super.run();
    await this.setup.run();
    await this.cart.run();
    await this.payment.run();
    console.log('Finished');
  }
}
