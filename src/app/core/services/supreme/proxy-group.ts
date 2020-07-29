import {ProxyInfo} from './proxy-info';

export class ProxyGroup {
  md5: string;
  name: string;
  ipAddress: Array<string> = [];
  port: Array<number> = [];
  userName: Array<string> = [];
  password: Array<string> = [];
  status: Array<string> = [];
  static getProxyString(proxyGroup: ProxyGroup, index: number) {
    let proxy = 'http://' + proxyGroup.userName[index] + ':' + proxyGroup.password[index] + '@' +
      proxyGroup.ipAddress[index] + ':' + proxyGroup.port[index];
    if (!proxyGroup.userName[index]) {
      proxy = 'http://' + proxyGroup.ipAddress[index] + ':' + proxyGroup.port[index];
    }
    return proxy;
  }
  static createProxyInfo(proxyGroup: ProxyGroup, index: number) {
    if (proxyGroup?.ipAddress?.length > index) {
      const proxyInfo = new ProxyInfo();
      proxyInfo.ipAddress = proxyGroup.ipAddress[index];
      proxyInfo.port = proxyGroup.port[index];
      proxyInfo.password = proxyGroup.password[index];
      proxyInfo.userName = proxyGroup.userName[index];
      return proxyInfo;
    }
  }
}
