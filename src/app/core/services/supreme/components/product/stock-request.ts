import {ProductOriginInfo} from "../../product-origin-info";
import {Util} from "../../../../../shared";
import {Page} from 'puppeteer';
import {PubSub} from '../../../util/pub-sub';

class ProductOriginData {
  release_date: string;
  products_and_categories: ProductOriginInfo[];
}

export class StockRequest {
  //TODO might need to be configured
  private mobileTimeout = 2000;
  private pcTimeout = 2000;
  private appTimeout = 2000;
  private isFirstTime = true;
  private pubSub: PubSub = new PubSub();

  private page: Page;
  setPage(page: Page): StockRequest {
    this.page = page;
    return this;
  }

  private async getByMobile(): Promise<ProductOriginData> {
    const mobile_url = "https://www.supremenewyork.com/mobile_stock.json";
    // console.log("get stock from mobile")
    const mobile_options = {
      method: "get",
      headers: {
        Accept: "application/json",
        "Accept-Language": "en-US,en,en-GB;q=0.9",
        "accept-encoding": "gzip, deflate, br",
        "X-Requested-With": "XMLHttpRequest",
        refer: "https://www.supremenewyork.com/mobile/",
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/83.0.4103.88 Mobile/15E148 Safari/604.1"
      },
      agent: undefined
    };
    return await Util.fetch(this.page, mobile_url, mobile_options, this.mobileTimeout);
  }

  private async getByPc(): Promise<ProductOriginData> {
    const pc_url = "https://www.supremenewyork.com/shop.json";
    // console.log("get stock from pc")
    const pcOptions = {
      method: "get",
    };
    return Util.fetch(this.page, pc_url, pcOptions, this.pcTimeout);
  }

  private async getByApp(): Promise<ProductOriginData> {
    const app_url = "https://www.supremenewyork.com/mobile/products.json";
    // console.log("get stock from app")
    const app_options = {
      method: "get",
      headers: {
        Accept: "application/json",
        "Accept-Language": "en-US,en,en-GB;q=0.9",
        "accept-encoding": "gzip, deflate, br",
        "X-Requested-With": "XMLHttpRequest",
        refer: "https://www.supremenewyork.com/mobile/",
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/83.0.4103.88 Mobile/15E148 Safari/604.1"
      },
      agent: undefined
    };
    return await Util.fetch(this.page, app_url, app_options, this.appTimeout);
  }

  private async getProductListInfo(): Promise<ProductOriginData> {
    let randomNumber = Math.floor((Math.random() * 3));
    if (randomNumber === 0) {
      try {
        return await this.getByPc();
      } catch (e) {
        this.pcTimeout = this.pcTimeout + 500;
        return null;
      }
    } else if (randomNumber === 1) {
      try {
        return await this.getByApp();
      } catch (e) {
        this.appTimeout = this.appTimeout + 500;
        return null;
      }
    } else {
      try {
        return await this.getByMobile();
      } catch (e) {
        this.mobileTimeout = this.mobileTimeout + 500;
        return null;
      }
    }
  }

  private getLastReleaseDate = () => {
    const now = new Date();
    let diff = (now.getDay() - 4) % 7;
    if (diff < 0) {
      diff += 7;
    }
    now.setDate(now.getDate() - diff);
    // console.log(" Release Date = " + now);
    return now;
  }

  async getProductOriginInfoList(productInfoMap: Map<string, ProductOriginInfo>): Promise<Map<string, ProductOriginInfo>> {
    if (this.isFirstTime) {
      setTimeout(() => Util.fetch(this.page,'https://www.supremenewyork.com/mobile'));
      this.isFirstTime = false;
    }
    productInfoMap = productInfoMap || new Map();
    const data = await this.getProductListInfo();
    const list: ProductOriginInfo[] = [];
    // console.log("Last release day: " + this.getLastReleaseDate());
    if (data) {
      // console.log("Got: " + data.release_date);
      const objs = data.products_and_categories;
      if (objs) {
        for (const category of Object.keys(objs)) {
          for (const product of objs[category]) {
            const productOriginInfo: ProductOriginInfo = new ProductOriginInfo();
            productOriginInfo.category_name = category;
            productOriginInfo.id = product.id;
            productOriginInfo.name = product.name;
            productInfoMap[productOriginInfo.id + productOriginInfo.category_name] = productOriginInfo;
            list.push(productOriginInfo);
          }
        }
      }
    }
    this.pubSub.publishStock(list);
    return productInfoMap;
  }
}
