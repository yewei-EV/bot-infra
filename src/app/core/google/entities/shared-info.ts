import { Page } from "puppeteer";
import {PuppeteerHar} from '../../../shared/puppeteer-har';

export class SharedInfo {
  page: Page;
  har: PuppeteerHar;
}
