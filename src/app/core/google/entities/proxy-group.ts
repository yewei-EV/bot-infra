import {ProxyInfo} from './proxy-info';

export class ProxyGroup {
  private static key = 'proxyGroups';
  name: string;
  proxies: ProxyInfo[];
  get()
  {

  }
  static readAll(): ProxyGroup[] {
    const value = localStorage.getItem(this.key);
    const rawProxyGroups: ProxyGroup[] = JSON.parse(value);
    const proxyGroups: ProxyGroup[] = [];
    for (const rawProxyGroup of rawProxyGroups) {
      const proxies: ProxyInfo[] = [];
      for (const rawProxy of rawProxyGroup.proxies) {
        proxies.push(Object.assign(new ProxyInfo(), rawProxy));
      }
      const proxyGroup = Object.assign(new ProxyGroup(), rawProxyGroups);
      proxyGroup.proxies = proxies;
      proxyGroups.push(proxyGroup);
    }
    return proxyGroups;
  }
  static saveAll(proxyGroups: ProxyGroup[]) {
    localStorage.setItem(this.key, JSON.stringify(proxyGroups));
  }
}
