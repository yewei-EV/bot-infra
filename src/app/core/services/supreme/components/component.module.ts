import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {CookieBrowser} from './cookie/cookie-browser';
import {ProductRequest} from './product/product-request';
import {Setup} from './setup/setup';
import {CartBrowser} from './cart/cart-browser';
import {PaymentBrowser} from './payment/payment-browser';
import {CartRequest} from './cart/cart-request';
import {StockRequest} from "./product/stock-request";
import {PaymentRequest} from './payment/payment-request';
import {CartHybrid} from './cart/cart-hybrid';
import {PaymentBase} from './payment/payment-base';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
  ],
  providers: [
    Setup,
    CookieBrowser,
    ProductRequest,
    CartBrowser,
    CartRequest,
    CartHybrid,
    PaymentBrowser,
    PaymentRequest,
    PaymentBase,
    StockRequest,
  ]
})
export class ComponentModule { }
