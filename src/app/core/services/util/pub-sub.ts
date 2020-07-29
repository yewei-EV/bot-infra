import * as redis from 'redis';
import {ProductInfo} from '../supreme/components/product/product-info';
import {ProductOriginInfo} from '../supreme/product-origin-info';
export class PubSub {
  private STOCK = 'stock';
  private publisher: redis.RedisClient = redis.createClient();
  private subscriber: redis.RedisClient = redis.createClient();
  private messages: Map<string, ProductInfo> | Map<string, ProductOriginInfo> = new Map();

  constructor() {
    this.subscriber.on('message', (channel, message) => {
      if (channel.includes('stock')) {
        const map = this.messages[channel];
        const productOriginInfos: ProductOriginInfo[] = JSON.parse(message);
        for (const productOriginInfo of productOriginInfos) {
          map[productOriginInfo.id + productOriginInfo.category_name] = productOriginInfo;
        }
      } else {
        const map: Map<string, ProductInfo> = this.messages[channel];
        const productInfos: ProductInfo[] = JSON.parse(message);
        for (const productInfo of productInfos) {
          map[productInfo.styleId + productInfo.sizeId ] = productInfo;
        }
      }
    })
  }

  publishStock(infos: ProductOriginInfo[]) {
    this.publisher.publish(this.STOCK, JSON.stringify(infos));
  }

  subscribeStock(map: Map<string,ProductOriginInfo>) {
    this.subscriber.subscribe(this.STOCK);
    this.messages[this.STOCK] = map;
  }

  unsubscribeStock() {
    this.subscriber.unsubscribe(this.STOCK);
  }

  getStock() {
    return this.messages[this.STOCK];
  }

  publishProduct(productId: string, infos: ProductInfo[]) {
    this.publisher.publish(productId, JSON.stringify(infos));
  }

  subscribeProduct(productId: string, map: Map<string, ProductInfo>) {
    this.subscriber.subscribe(productId);
    this.messages[productId] = map;
  }

  unsubscribeProduct(productId: string) {
    this.subscriber.unsubscribe(productId);
  }
}
