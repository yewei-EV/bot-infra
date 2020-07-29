import {Component, Inject, OnInit, ViewEncapsulation} from '@angular/core';
// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
import puppeteer from 'puppeteer-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import {SupremeService} from '../core/services/supreme/supreme-service';
import {SharedInfo} from '../core/services/supreme/shared-info';
import {ProductInfo} from '../core/services/supreme/components/product/product-info';
import {PaymentInfo} from '../core/services/supreme/components/payment/payment-info';
import {BasicInfo} from '../core/services/supreme/basic-info';
import {ProfileInfo} from '../core/services/supreme/profile-info';
import {ProxyGroup} from "../core/services/supreme/proxy-group";
import {SuccessLog} from '../core/services/supreme/success-log';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HomeComponent implements OnInit {

  profiles: ProfileInfo[];
  proxyGroups: ProxyGroup[];
  successLog: SuccessLog[];

  private args = [
    "--no-sandbox",
    "--disable-gpu",
    "--disable-infobars",
    "--window-size=375,812",
    "--ignore-certificate-errors",
    "--ignore-certificate-errors-spki-list",
  ];
  getChromiumExecPath() {
    return puppeteer.executablePath().replace('app.asar', 'app.asar.unpacked');
  }
  private options = {
    timeout: 0,
    ignoreHTTPSErrors: true,
    headless: true,
    devtools: true,
    args: this.args,
    executablePath: this.getChromiumExecPath()
  };

  constructor(private supremeService: SupremeService) {
  }

  ngOnInit(): void {

  }

  run() {
    puppeteer.use(stealth());
    puppeteer.launch(this.options).then(async browser => {
      const sharedInfo = new SharedInfo();
      sharedInfo.basic = new BasicInfo();
      sharedInfo.basic.browser = browser;
      sharedInfo.product = new ProductInfo();
      sharedInfo.payment = new PaymentInfo();
      this.supremeService.setSharedInfo(sharedInfo);
      await this.supremeService.run();
      await browser.close();
    });
  }

  updateInfo() {
    this.profiles = JSON.parse(localStorage.getItem('profiles')) || [];
    this.proxyGroups = JSON.parse(localStorage.getItem('proxyGroups')) || [];
  }

  updateSuccess() {
    this.successLog = JSON.parse(localStorage.getItem('successLog')) || [];
  }
}
