import {ProxyGroup} from '../core/services/supreme/proxy-group';
import {AppConfig} from '../../environments/environment';
import {Page} from 'puppeteer';
import {SuccessLog} from '../core/services/supreme/success-log';
import HttpsProxyAgent from 'https-proxy-agent/dist/agent';
const axios = require('axios').default;
const rp = require('request-promise-native');

export class Util {

  static async delay(ms: number) {
    await new Promise(resolve => setTimeout(()=>resolve(), ms));
  }

  static keywordMatcher(productName, keywords) {
    let name = productName.toLowerCase().trim();
    let keywordList = keywords.toLowerCase().trim().replace(" ", "").split(",");
    for (let keyword of keywordList) {
      if (!keyword.startsWith("+") && !keyword.startsWith("-")) {
        return false;
      }
      keyword = keyword.trim();
      if ((keyword.startsWith("+") && !name.includes(keyword.substr(1)))
        || (keyword.startsWith("-") && name.includes(keyword.substr(1)))) {
        return false;
      }
    }
    return true;
  }

  static sameDay(first: Date, second: Date) {
    return first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();
  }

  static colorMatcher(colorName, colorList) {
    for (let color of colorList) {
      // Fuzzy Search for color
      if (colorName.includes(color.toLowerCase())) {
        return true;
      }
      if (color.toLowerCase() === 'random' || color.toLowerCase() === 'any') {
        return true;
      }
    }
    return false;
  }

  static sizeMatcher(targetSize, sizeObj) {
    if ((targetSize === "random" || sizeObj.name === "N/A" || sizeObj.name.toLowerCase() === targetSize)
      && sizeObj.stock_level === 1) {
      return sizeObj.id;
    }
    return null;
  }

  static async fetch(page: Page, input: RequestInfo, init?: RequestInit, timeout?: number) {
    const objPromise = page.evaluate(async (arg1: string, arg2?: string) => {
      const input = JSON.parse(arg1);
      const init = JSON.parse(arg2);
      const response = await window.fetch(input, init);
      if (response.status == 200) {
        return response.json();
      } else {
        return null;
      }
    }, JSON.stringify(input), JSON.stringify(init));
    return await Promise.race([
      objPromise,
      new Promise<Response>((resolve, reject) => setTimeout(() => {
        reject('time out');
      }, timeout))
    ]);
  }

  // fail webhook: https://discordapp.com/api/webhooks/717841617683480667/7u5jW73aYKoHj_g7rNOyzrHucKl0_ItBGSP42_RIK8afYK9f8XTHTCmHb_Am6mRBga0p
  // success webhook: https://discordapp.com/api/webhooks/708773713159651330/8U13EtGKpAxIgtLZaZfMXPADYE5_1oG2xNjy5HE9wCGZnnUr2NasoGZ828PDIA4zxCw0
  static async sendYitianWebhook(log: SuccessLog, isSuccessful: boolean) {
    let hookContent = {
      "username": "Yitian",
      "avatar_url": "https://pbs.twimg.com/profile_images/1229270497600229382/osos_sN0_400x400.jpg",
      "embeds": [
        {
          "title": log.status === 'paid' ? "SUCCESSFULLY COPPED!" : "PAYMENT DECLINED",
          "description": log.product,
          "color": 16359720,
          thumbnail: {
            url: "http:" + log.imageUrl
          },
          "fields": [
            {
              "name": "Region",
              "value": log.region,
              "inline": true
            },
            {
              "name": "Mode",
              "value": log.mode,
              "inline": true
            },
            {
              "name": "Status",
              "value": log.status.toUpperCase(),
              "inline": true
            },
            {
              "name": "Monitor Delay",
              "value": log.monitorDelay + "ms",
              "inline": true
            },
            {
              "name": "Checkout Delay",
              "value": log.checkoutDelay + "ms",
              "inline": true
            },
            {
              "name": "Proxy",
              "value": log.proxy,
              "inline": true
            }
          ],
          "footer": {
            "text": "Yitian | UTC: " + log.date,
            "icon_url": "https://pbs.twimg.com/profile_images/1229270497600229382/osos_sN0_400x400.jpg"
          }
        }
      ]
    };
    let url = isSuccessful ? "https://discordapp.com/api/webhooks/708773713159651330/8U13EtGKpAxIgtLZaZfMXPADYE5_1oG2xNjy5HE9wCGZnnUr2NasoGZ828PDIA4zxCw0"
      :"https://discordapp.com/api/webhooks/717841617683480667/7u5jW73aYKoHj_g7rNOyzrHucKl0_ItBGSP42_RIK8afYK9f8XTHTCmHb_Am6mRBga0p";
    let options = {
      method: "POST",
      url: url,
      data: hookContent,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios(options);
  }

  static async sendLog(postKey: string, res: string) {
    return;
    // let url = "https://us-central1-yitian-8e7d0.cloudfunctions.net/yitianLog";
    // const key = (JSON.parse(localStorage.getItem('activationKey')).key || "") + postKey;
    // console.log(key);
    // let options = {
    //   method: 'POST',
    //   url: url,
    //   body: {
    //     "key": key,
    //     "log": res
    //   },
    //   headers: {
    //     "Accept": "application/json",
    //     "Accept-Encoding": "gzip, deflate",
    //     "Accept-Language": "en-US,en;q=0.9",
    //     "Connection": "keep-alive",
    //     "Content-Type": "application/json",
    //     "X-Requested-With": "XMLHttpRequest"
    //   },
    //   json: true,
    //   agent: undefined
    // };
    // try {
    //   rp.post(options, (error, response) => {
    //     if (error) {
    //       // use proxy to login
    //       options.agent = new HttpsProxyAgent('http://' + 'skczsdyp' + ':' + '2ezk44dc' + '@' + '46.8.203.2' + ':' + '37162');
    //       rp.get(options, (error, response) => {
    //         if (error) {
    //           console.log("Send Validate Request ERROR: " + error);
    //         }
    //       });
    //     }
    //   });
    // } catch (e) {
    //   console.log("Send Validate Request ERROR: " + e);
    // }
  }

  static getProxy() {
    let res = [];
    let proxyGroups: ProxyGroup[] = JSON.parse(localStorage.getItem('proxyGroups')) || [];
    if (proxyGroups.length !== 0) {
      let ipAddress = proxyGroups[0].ipAddress[0];
      let port = proxyGroups[0].port[0];
      res.push(ipAddress);
      res.push(port);
      let useName = "";
      let password = "";
      if (proxyGroups[0].userName.length !== 0) {
        useName = proxyGroups[0].userName[0];
        password = proxyGroups[0].password[0];
        res.push(useName);
        res.push(password);
      }
      return res;
    } else {
      return;
    }
  }

  static async testProxy(): Promise<any> {
    const mobile_url = AppConfig.baseUrl + "testProxy";
    axios.get(mobile_url, {
      proxy: {
        host: '208.192.21.14',
        port: 26500,
        auth: {
          username: 'mvjbaeap',
          password: '3g7xkg8WG8'
        }
      }
    })
    .then((response) => {
      console.log(response)
      return response;
    })
    .catch((error) => {
      console.log(error);
    });
  }
  //   const mobile_url = AppConfig.baseUrl + "/testProxy";
  //   const mobile_options = {
  //     method: "get",
  //     headers: {
  //       Accept: "application/json",
  //       "Accept-Language": "en-US,en,en-GB;q=0.9",
  //       "accept-encoding": "gzip, deflate, br",
  //       "X-Requested-With": "XMLHttpRequest",
  //       "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1"
  //     },
  //     // agent: undefined
  //   };
  //   // let proxyInfo = Util.getProxy();
  //   // if (proxyInfo) {
  //   //   if (proxyInfo.length == 2) {
  //   //     let proxy = new HttpsProxyAgent('http://' + proxyInfo[0] + ':' + proxyInfo[1]);
  //   //     mobile_options.agent = new HttpsProxyAgent(proxy);
  //   //   }
  //   //   if (proxyInfo.length == 4) {
  //   //     console.log('http://' + proxyInfo[2] + ':' + proxyInfo[3] + '@' + proxyInfo[0] + ':' + proxyInfo[1]);
  //   //     let proxy = new HttpsProxyAgent('http://' + proxyInfo[2] + ':' + proxyInfo[3] + '@' + proxyInfo[0] + ':' + proxyInfo[1]);
  //   //     mobile_options.agent = new HttpsProxyAgent(proxy);
  //   //   }
  //   // }
  //   console.log(mobile_options)
  //   const response = await Util.fetch(mobile_url, mobile_options, 12000);
  //   let res = await response.headers;
  //   console.log(res);
  // }

  static format(s) {
    return s.toString().replace(/\d{4}(?=.)/g, '$& ');
  }

  static getIgnoredStatus(): string[] {
    return ['queued', 'paid', 'paypal', 'dup', 'canada', 'blocked_country', 'blacklisted'];
  }
}
