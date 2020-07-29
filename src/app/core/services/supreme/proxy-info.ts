export class ProxyInfo {
  ipAddress: string;
  port: number;
  userName: string;
  password: string;
  status: string;

  toString() {
    let proxy = 'http://' + this.userName + ':' + this.password + '@' + this.ipAddress + ':' + this.port;
    if (!this.userName) {
      proxy = 'http://' + this.ipAddress + ':' + this.port;
    }
    return proxy;
  }
}
