export class ProxyInfo {
  ipAddress: string;
  port: number;
  userName: string;
  password: string;
  status: string;

  toString() {
    let proxy;
    if (!this.userName) {
      proxy = 'http://' + this.ipAddress + ':' + this.port;
    } else {
      proxy = 'http://' + this.userName + ':' + this.password + '@' + this.ipAddress + ':' + this.port;
    }
    return proxy;
  }
  toText(): string {
    let proxy;
    if (!this.userName) {
      proxy = this.ipAddress + ':' + this.port;
    } else {
      proxy = this.ipAddress + ':' + this.port + ':' + this.userName + ':' + this.password;
    }
    return proxy;
  }
}
