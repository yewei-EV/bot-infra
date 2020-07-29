import {Injectable} from '@angular/core';
import {SupremeService} from '../supreme-service';
import {SharedInfo} from '../shared-info';
import {Setup} from '../components/setup/setup';
import {TaskInfo} from '../task-info';
import {CartRequest} from '../components/cart/cart-request';
import {PaymentRequest} from '../components/payment/payment-request';

@Injectable({
  providedIn: 'root'
})
export class RequestModeService extends SupremeService {

  constructor(
    private setup: Setup,
    private cart: CartRequest,
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
