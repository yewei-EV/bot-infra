import {ChangeDetectorRef, Component, OnInit, TemplateRef} from '@angular/core';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import puppeteer from 'puppeteer-extra';
import {ProxyUtil} from '../../shared';
import {ProxyGroup, ProxyInfo} from '../../core/google';
@Component({
  selector: 'app-proxy',
  templateUrl: './proxy.component.html',
  styleUrls: ['./proxy.component.css']
})
export class ProxyComponent implements OnInit {
  // local storage
  proxyGroups: ProxyGroup[];
  // modal temp variable
  proxyText: string = "";
  proxyName: string = "";
  // chosen group name
  curProxyGroupName: string = "";
  // chosen group
  curProxyGroup: ProxyGroup = new ProxyGroup();

  curModal: BsModalRef;
  config = {
    animated: true,
    keyboard: true,
    backdrop: true,
    ignoreBackdropClick: true
  };

  constructor(private modalService: BsModalService) {}

  ngOnInit() {
    this.proxyGroups = ProxyGroup.readAll();
    this.curProxyGroup = this.proxyGroups[0];
    this.curProxyGroupName = this.curProxyGroup.name;
    this.proxyName = this.curProxyGroup.name;
    this.proxyText = "";
    for (const proxy of this.curProxyGroup.proxies) {
      Object.values(proxy).join();
      this.proxyText += proxy.ipAddress + ":" + proxy.port + ":" + proxy.userName + ":" + proxy.password + "\n";
    }
  }

  openModalWithClass(template: TemplateRef<any>) {
    this.curModal = this.modalService.show(
      template,
      Object.assign({}, this.config, {class: 'gray modal-lg'})
    );
  }

  addProxyGroup() {
    if (this.proxyGroups.filter(group => group.name === this.proxyName).length > 0) {
      alert("Name cannot be same!");
    } else {
      this.curProxyGroup = new ProxyGroup();
      this.curProxyGroup.name = this.proxyName;
      let rows = this.proxyText.split("\n");
      for (let row of rows) {
        let cols = row.split(":");
        const proxyInfo = new ProxyInfo();
        if (cols.length != 2 && cols.length != 4) {
          continue;
        }
        proxyInfo.ipAddress = cols[0];
        proxyInfo.port = +cols[1];
        if(cols.length == 4) {
          proxyInfo.userName = cols[2];
          proxyInfo.password = cols[3];
        }
      }
      this.proxyGroups.push(Object.assign(new ProxyGroup(), {...this.curProxyGroup}));
      ProxyGroup.saveAll(this.proxyGroups);
      this.curProxyGroupName = this.proxyName;
    }
  }

  editProxyGroup() {
    this.deleteProxyGroup();
    this.addProxyGroup();
  }

  chooseGroup() {
    this.curProxyGroup = this.proxyGroups.filter(group => group.name === this.curProxyGroupName)[0];
    this.proxyName = this.curProxyGroup.name;
    this.proxyText = "";
    for (const proxy of this.curProxyGroup.proxies) {
      this.proxyText = proxy.toText();
    }
  }

  deleteProxyGroup() {
    let index = 0;
    for (let group of this.proxyGroups) {
      if (group.name !== this.curProxyGroupName) {
        index++;
      } else {
        break;
      }
    }
    this.proxyGroups.splice(index, 1);
    ProxyGroup.saveAll(this.proxyGroups);
    this.curProxyGroupName = "";
    this.curProxyGroup = new ProxyGroup();
  }

  async testProxy() {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    for (const proxy of this.curProxyGroup.proxies) {
      await ProxyUtil.useProxy(page, proxy.toString());
      let res = await page.goto('https://www.supremenewyork.com/mobile/');
      console.log(res["_status"]);
      if (res["_status"] === 200) {
        proxy.status = 'Working';
      } else {
        proxy.status = 'Fail';
      }
    }
    await page.close();
  }

  deleteProxy(index: number) {
    let chosenGroup = this.proxyGroups.filter(group => group.name === this.curProxyGroupName)[0];
    chosenGroup.proxies.splice(index, 1);
    ProxyGroup.saveAll(this.proxyGroups);
  }

  clearCache() {
    this.proxyName = "";
    this.proxyText = "";
  }
}
