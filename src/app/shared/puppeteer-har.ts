import * as fs from 'fs';
import { promisify } from 'util';
import { harFromMessages } from 'chrome-har';
// event types to observe
const page_observe = [
  'Page.loadEventFired',
  'Page.domContentEventFired',
  'Page.frameStartedLoading',
  'Page.frameAttached',
  'Page.frameScheduledNavigation',
];

const network_observe = [
  'Network.requestWillBeSent',
  'Network.requestWillBeSentExtraInfo',
  'Network.requestServedFromCache',
  'Network.dataReceived',
  'Network.responseReceived',
  'Network.responseReceivedExtraInfo',
  'Network.resourceChangedPriority',
  'Network.loadingFinished',
  'Network.loadingFailed',
];

export class PuppeteerHar {
  inProgress: boolean;
  private page;
  private mainFrame;
  private network_events;
  private extra_info;
  private page_events;
  private response_body_promises;
  private saveResponse: boolean;
  private captureMimeTypes: string[];
  private path: string;
  private client;
  /**
   * @param {object} page
   */
  constructor(page) {
    this.page = page;
    this.mainFrame = this.page.mainFrame();
    this.inProgress = false;
    this.cleanUp();
  }

  /**
   * @returns {void}
   */
  cleanUp() {
    this.network_events = [];
    this.extra_info = [];
    this.page_events = [];
    this.response_body_promises = [];
  }

  /**
   * @param {{path: string}=} options
   * @return {Promise<void>}
   */
  async start({ path, saveResponse, captureMimeTypes}: {path: string, saveResponse: boolean, captureMimeTypes: string[]} =
                {path: undefined, saveResponse: false, captureMimeTypes: undefined}) {
    this.inProgress = true;
    this.saveResponse = saveResponse || false;
    this.captureMimeTypes = captureMimeTypes || ['text/html', 'application/json'];
    this.path = path;
    this.client = await this.page.target().createCDPSession();
    await this.client.send('Page.enable');
    await this.client.send('Network.enable');
    page_observe.forEach(method => {
      this.client.on(method, params => {
        if (!this.inProgress) {
          return;
        }
        this.page_events.push({ method, params });
      });
    });
    network_observe.forEach(method => {
      this.client.on(method, params => {
        if (!this.inProgress) {
          return;
        }
        if (method === 'Network.responseReceivedExtraInfo'|| method === 'Network.requestWillBeSentExtraInfo') {
          this.extra_info.push({ method, params });
        } else {
          this.network_events.push({ method, params });
        }

        if (this.saveResponse && method == 'Network.responseReceived') {
          const response = params.response;
          const requestId = params.requestId;

          // Response body is unavailable for redirects, no-content, image, audio and video responses
          if (response.status !== 204 &&
            response.headers.location == null &&
            this.captureMimeTypes.includes(response.mimeType)
          ) {
            const promise = this.client.send(
              'Network.getResponseBody', { requestId },
            ).then((responseBody) => {
              // Set the response so `chrome-har` can add it to the HAR
              params.response.body = Buffer.from(
                responseBody.body,
                responseBody.base64Encoded ? 'base64' : undefined,
              ).toString();
            }, () => {
              // Resources (i.e. response bodies) are flushed after page commits
              // navigation and we are no longer able to retrieve them. In this
              // case, fail soft so we still add the rest of the response to the
              // HAR. Possible option would be force wait before navigation...
            });
            this.response_body_promises.push(promise);
          }
        }
      });
    });
  }

  /**
   * @returns {Promise<void|object>}
   */
  async stop() {
    this.inProgress = false;
    await Promise.all(this.response_body_promises);
    await this.client.detach();
    await this.mergeCookieHeader();
    const har = harFromMessages(
      this.page_events.concat(this.network_events),
      {includeTextFromResponseBody: this.saveResponse}
    );
    this.cleanUp();
    const result = JSON.stringify(har);
    if (this.path) {
      await promisify(fs.writeFile)(this.path, result);
    }
    return result;
  }

  async mergeCookieHeader() {
    for (const {method, params} of this.extra_info) {
      if (!params.headers['set-cookie'] && !params.headers['cookie']) {
        continue;
      }
      for (const event of this.network_events) {
        if (event.method === 'Network.responseReceived' && method === 'Network.responseReceivedExtraInfo'
          && event.params.requestId === params.requestId) {
          event.params.response.headers['set-cookie'] = params.headers['set-cookie'];
        } else if (event.method === 'Network.requestWillBeSent' && method === 'Network.requestWillBeSentExtraInfo'
          && event.params.requestId === params.requestId) {
          event.params.request.headers['cookie'] = params.headers['cookie'];
        }
      }
    }
  }
}
