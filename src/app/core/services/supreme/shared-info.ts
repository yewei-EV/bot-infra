import {ProductInfo} from './components/product/product-info';
import {PaymentInfo} from './components/payment/payment-info';
import {BasicInfo} from './basic-info';

export class SharedInfo {
  basic: BasicInfo = new BasicInfo();
  product: ProductInfo = new ProductInfo();
  payment: PaymentInfo = new PaymentInfo();
}
