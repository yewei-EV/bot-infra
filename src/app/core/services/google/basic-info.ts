import { Page, Browser } from "puppeteer";
import {PuppeteerHar} from '../../../shared/puppeteer-har';

export class BasicInfo {
  page: Page;
  har: PuppeteerHar;
  browser: Browser;
  checkoutForm: string;
}
