import {CoreOptions, UriOptions, UrlOptions} from 'request';
import {Page, Request, SetCookie} from 'puppeteer';
import {IncomingHttpHeaders, IncomingMessage} from 'http';
import {HttpProxyAgent} from 'http-proxy-agent';
import {HttpsProxyAgent} from 'https-proxy-agent';
import {SocksProxyAgent} from 'socks-proxy-agent';
import {PassThrough} from 'stream';
import * as zlib from 'zlib';
import * as request from 'request';
import {ProxyGroup} from '../core/services/supreme/proxy-group';
export type SimpleResponse = {
  status: number,
  headers: IncomingHttpHeaders,
  body: Buffer
}

export class ProxyUtil {
  /**
   * 从多行字符串中解析 headers
   * 例如下面两行
   * Pragma: no-cache
   * User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36
   * 解析结果
   * {
   *     "Pragma": "no-cache",
   *     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36"
   * }
   * @param lines
   */
  private static linesToHeaders(lines: string): {[headerName: string]: string} {
    const headers = {};
    lines.split(/\r?\n/g).forEach(line => {
      line = line.trim();
      if (line) {
        const divideI = line.indexOf(": ");
        if (divideI > -1) {
          headers[line.substring(0, divideI)] = line.substring(divideI + 2);
        }
      }
    });
    return headers;
  }

  /**
   * 将代理和返回body的解压缩过程进行封装，返回只包含 status, headers, body 的简单结果
   * 提供 headers 多行字符串的解析过程，方便从浏览器中copy Request Headers，然后直接使用
   * @param options
   * @param handler
   */
  private static simple(options: (UriOptions | UrlOptions) & CoreOptions & {headerLines?: string}, handler?: ((error: Error, res: SimpleResponse) => void)) {
    // body 采用 Buffer 格式返回
    options.encoding = null;

    // 解析 headers
    const headers = {};
    for (let key in options) {
      if (key == "headers") {
        Object.assign(headers, options.headers);
      }
      else if (key == "headerLines") {
        const parsedHeaders = this.linesToHeaders(options.headerLines);
        Object.assign(headers, parsedHeaders);
      }
    }
    options.headers = headers;

    if (options.proxy) {
      let proxy;
      const typeofProxy = typeof options.proxy;
      if (typeofProxy == "string") {
        proxy = options.proxy;
      }
      else if (typeofProxy == "object" && options.proxy.href) {
        proxy = options.proxy.href;
      }

      if (proxy) {
        options.headers["accept-encoding"] = "identity, gzip, deflate";
        if (!options.headers["accept"]) {
          options.headers["accept"] = '*/*';
        }

        const reqUrl = options["url"] || options["uri"];
        if (proxy === ' ') {
          // nothing to do, for change response
        } else if (proxy.startsWith("socks")) {
          options.agent = new SocksProxyAgent(options.proxy);
        }
        else if (reqUrl.startsWith("https")) {
          options.agent = new HttpsProxyAgent(options.proxy);
        }
        else {
          options.agent = new HttpProxyAgent(options.proxy);
        }
        delete options.proxy;
      }
    }

    return new Promise<SimpleResponse>((resolve, reject) => {
      request(options, (error, res: IncomingMessage) => {
        if (error) {
          reject(error);
          return;
        }

        const simpleRes = {
          status: res.statusCode,
          headers: res.headers,
          body: res["body"] as Buffer || Buffer.from([])
        };

        if (simpleRes.body.length) {
          let bodyPipe = new PassThrough();
          const contentEncodings = (res.headers["content-encoding"] || "").split(/, ?/).filter(item => item != "").reverse();
          for (let contentEncoding of contentEncodings) {
            switch (contentEncoding) {
              case "gzip":
                bodyPipe = bodyPipe.pipe(zlib.createGunzip());
                break;
              case "deflate":
                bodyPipe = bodyPipe.pipe(zlib.createInflate());
                break;
            }
          }

          let chunks: Buffer[] = [];
          bodyPipe.on("data", chunk => chunks.push(chunk));
          bodyPipe.on("error", err => reject(err));
          bodyPipe.on("close", () => {
            simpleRes.body = Buffer.concat(chunks);
            resolve(simpleRes);
          });

          bodyPipe.write(res["body"] as Buffer, err => bodyPipe.destroy(err));
        }
        else {
          resolve(simpleRes);
        }
      });
    }).then(async res => {
      typeof handler == "function" && await handler(null, res);
      return res;
    }).catch(async err => {
      typeof handler == "function" && await handler(err, null);
      throw err;
    });
  }

  static async useProxyGroup(page: Page, proxyGroup: ProxyGroup) {
    if (proxyGroup.ipAddress.length > 0) {
      const count = proxyGroup.ipAddress.length;
      const index = Math.floor(Math.random() * count);
      const proxy = ProxyGroup.getProxyString(proxyGroup, index);
      await this.useProxy(page, proxy);
    }
  }

  /**
   * 页面使用单独的proxy
   * @param page
   * @param proxy 代理服务器地址，例如：http://127.0.0.1:2007
   * @param enableCache 代理请求的过程中是否启用缓存
   */
  static async useProxy(page: Page, proxy: string, enableCache: boolean = false) {
    page["_proxy"] = proxy;
    page["_enableCacheInProxy"] = enableCache;
    await page.setRequestInterception(true);
    if (!page["_proxyHandler"]) {
      page['_proxyHandler'] = true;
      page.on("request", (request) => this.proxyHandler(page, request));
    }
  }

  static async proxyHandler(page: Page, req: Request, proxy = null, changeRes: (resp: SimpleResponse) => Promise<SimpleResponse> = null) {
    proxy = proxy || page["_proxy"];
    let enableCache = page["_enableCacheInProxy"];
    const url = req.url();
    if (url.includes('cloudfront')) {
      enableCache = true;
    }

    if (req["_interceptionHandled"] || !req["_allowInterception"]) {
      return;
    }
    else if (proxy && req.url().startsWith("http")) {
      if (!req.isNavigationRequest()) {
        // nav请求始终不缓存
        const responseCache = enableCache ? await page.evaluate(url => {
          const cache = localStorage.getItem(url);
          if (cache) {
            if (parseInt(cache.substring(0, cache.indexOf("\n"))) <= new Date().getTime()) {
              // 已过期
              localStorage.removeItem(url);
            }
            else {
              return cache;
            }
          }
        }, req.url()).catch(() => {}) : null;
        if (responseCache) {
          let [, statusCodeStr, bodyBase64] = responseCache.split("\n");
          const statusCode = +statusCodeStr;
          const body = Buffer.from(bodyBase64, "base64");
          await req.respond({
            status: statusCode,
            headers: {
              cache: "from-local-storage"
            },
            body: body
          });
          return;
        }
      }

      const options = {
        url: req.url(),
        method: req.method(),
        headers: req.headers(),
        body: req.postData(),
        proxy: proxy
      };

      try {
        if (options.headers && (options.headers.cookie == null || options.headers.Cookie == null)) {
          // 设置cookie
          const cookies = await page.cookies(options.url);
          if (cookies.length) {
            // console.log(options.url + "\n"
            //     + cookies.map(item => item.name + "=" + item.value + "; domain=" + item.domain).join("\n") + "\n");
            options.headers.cookie = cookies.map(item =>
              item.name + "=" + item.value).join("; ");
          }
        }
        let proxyRes = await this.simple(options);
        if (changeRes) {
          proxyRes = await changeRes(proxyRes);
        }
        const headers = proxyRes.headers;
        // 处理返回结果的 header；主要是处理 set-cookie
        for (const name of Object.keys(headers)) {
          const value = headers[name];

          if (name == "set-cookie") {
            if (value.length == 0) {
              headers[name] = ("" + value[0]) as any;
            }
            else {
              const setCookies: SetCookie[] = [];
              for (let item of value) {
                const setCookie: SetCookie = {
                  name: null,
                  value: null
                };
                item.split(";").forEach((keyVal, keyValI) => {
                  keyVal = keyVal.trim();
                  const eqI = keyVal.indexOf("=");
                  let key;
                  let value;
                  setCookie.url = options.url;
                  if (eqI > -1) {
                    key = keyVal.substring(0, eqI);
                    value = keyVal.substring(eqI + 1);
                  }
                  else {
                    key = keyVal;
                    value = "";
                  }
                  const lowerKey = key.toLowerCase();

                  if (keyValI == 0) {
                    setCookie.name = key;
                    setCookie.value = value;
                  }
                  else if (lowerKey == "expires") {
                    const expires = new Date(value).getTime();
                    if (!isNaN(expires)) {
                      setCookie.expires = +(expires / 1000).toFixed(0);
                    }
                  }
                  else if (lowerKey == "max-age") {
                    if (!setCookie.expires) {
                      const expires = +value;
                      if (!isNaN(expires)) {
                        setCookie.expires = expires;
                      }
                    }
                  }
                  else if (lowerKey == "path" || key == "domain") {
                    setCookie[lowerKey] = value;
                  }
                  else if (lowerKey == "samesite") {
                    setCookie.httpOnly = true;
                  }
                  else if (lowerKey == "httponly") {
                    setCookie.httpOnly = true;
                  }
                  else if (lowerKey == "secure") {
                    setCookie.secure = true;
                  }
                });
                headers["set-cookie-" + setCookies.length] = item;
                setCookies.push(setCookie);
              }
              await page.setCookie(...setCookies).catch((err) => {console.log(err)});
              delete headers[name];
            }
          }
          else if (typeof value != "string") {
            if (value instanceof Array) {
              headers[name] = JSON.stringify(value);
            }
            else {
              headers[name] = "" + value;
            }
          }
        }

        if (!req.isNavigationRequest()) {
          // nav请求始终不缓存
          //  如果有 Expires ，则保存缓存
          const expires = new Date(headers.expires || headers.Expires as string).getTime();
          if (enableCache && expires > new Date().getTime()) {
            const bodyBase64 = proxyRes.body.toString('base64');
            const responseCache = `${expires}\n${proxyRes.status}\n${bodyBase64}`;
            await page.evaluate((url, responseCache) => {
              localStorage.setItem(url, responseCache);
            }, req.url(), responseCache).catch(() => {});
          }
        }
        await req.respond(proxyRes as any).catch(() => {});
      }
      catch(err) {
        console.log(err);
        await req.abort("failed").catch(() => {});
      }
    }
  };
}
