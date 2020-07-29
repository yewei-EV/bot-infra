import {Util} from '../../../../../shared';
import {Injectable} from '@angular/core';
import {TaskInfo} from "../../task-info";
import {ProductInfo} from "./product-info";
import {Page} from 'puppeteer';
import {PubSub} from '../../../util/pub-sub';

@Injectable()
export class ProductRequest {
  private page: Page;
  private isFirstTime = true;
  private pubSub: PubSub = new PubSub();
  setPage(page: Page): ProductRequest {
    this.page = page;
    return this;
  }

  private async checkSizeColorID(productId: string, sizeRespondData, taskInfo: TaskInfo): Promise<ProductInfo> {
    let result: ProductInfo;
    const list: ProductInfo[] = [];
    // match multiple color
    let colorList = await taskInfo.colors.split(",");

    for (const styleObj of sizeRespondData.styles) {
      if (styleObj && styleObj.name && Util.colorMatcher(styleObj.name.toLowerCase(), colorList)) {
        for (const size of styleObj?.sizes) {
          const productInfo = new ProductInfo();
          productInfo.productId = productId;
          productInfo.styleId = styleObj.id;
          if (this.isFirstTime) {
            setTimeout(() => Util.fetch(this.page, "https://www.supremenewyork.com/mobile#products/" +
              productInfo.productId + "/" + productInfo.styleId));
          }
          productInfo.sizeId = size.id;
          productInfo.stock = size.stock_level;
          list.push(productInfo);
          for (const targetSize of taskInfo.size) {
            let sizeMatcherRes = Util.sizeMatcher(targetSize.toLowerCase(), size);
            if (sizeMatcherRes) {
              if (size.name === "N/A") {
                productInfo.oneSize = true;
              }
              taskInfo.imageUrl = styleObj.image_url;

              taskInfo.status = 'Found size';
              console.log('Found', productInfo);
              result = productInfo;
            }
          }
        }
      }
    }
    this.isFirstTime = false;
    taskInfo.status = 'Sold out';
    console.log('Size not found, start restocking');
    this.pubSub.publishProduct(productId, list);
    return result;
  }

  private async productInfoRequest(productInfo: ProductInfo) {
    let url = "https://www.supremenewyork.com/shop/" + productInfo.productId + ".json";
    let options = {
      method: "get",
    };
    try {
      return await Util.fetch(this.page, url, options, 5000);
    } catch (e) {
      console.log("fetch size info failed, productID: " + productInfo.productId);
      return null;
    }
  }

  async getStyleAndColorInfo(productInfo: ProductInfo, taskInfo): Promise<ProductInfo> {
    while (taskInfo.running === true) {
      let resp = await this.productInfoRequest(productInfo);
      if (resp !== null && resp && resp.styles && resp.styles.length > 0) {
        return await this.checkSizeColorID(productInfo.productId, resp, taskInfo);
      }
      await Util.delay(500);
    }
  }
}
