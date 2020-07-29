import {ChangeDetectorRef, Component, OnInit, TemplateRef} from '@angular/core';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {ProxyGroup} from '../../core/services/supreme/proxy-group';
import {AppConfig} from '../../../environments/environment';
import puppeteer from 'puppeteer-extra';
import {ProxyUtil} from '../../shared';

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
  private args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-gpu",
    "--disable-infobars",
    "--window-size=375,812",
    "--ignore-certificate-errors",
    "--ignore-certificate-errors-spki-list",
    '--disable-web-security',
  ];
  getChromiumExecPath() {
    return puppeteer.executablePath().replace('app.asar', 'app.asar.unpacked');
  }

  constructor(
    private cd: ChangeDetectorRef,
    private modalService: BsModalService,
    private changeDetect: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    setInterval(() => {
      this.cd.detectChanges();
    }, 1000);
    this.proxyGroups = JSON.parse(localStorage.getItem('proxyGroups')) || [];
    this.curProxyGroup = this.proxyGroups[0];
    this.curProxyGroupName = this.curProxyGroup.name;
    this.proxyName = this.curProxyGroup.name;
    this.proxyText = "";
    for (let i = 0; i < this.curProxyGroup.ipAddress.length; i++) {
      this.proxyText = this.proxyText + this.curProxyGroup.ipAddress[i] + ":" + this.curProxyGroup.port[i]
        + ":" + this.curProxyGroup.userName[i] + ":" + this.curProxyGroup.password[i] + "\n";
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
      this.changeDetect.detectChanges();
    } else {
      this.curProxyGroup = new ProxyGroup();
      this.curProxyGroup.name = this.proxyName;
      let proxyInfo = this.proxyText.split("\n");
      for (let each of proxyInfo) {
        let elements = each.split(":");
        if (elements.length === 2) {
          this.curProxyGroup.ipAddress.push(elements[0]);
          this.curProxyGroup.port.push(Number(elements[1]));
        } else if (elements.length === 4) {
          this.curProxyGroup.ipAddress.push(elements[0]);
          this.curProxyGroup.port.push(Number(elements[1]));
          this.curProxyGroup.userName.push(elements[2]);
          this.curProxyGroup.password.push(elements[3]);
        }
      }
      this.proxyGroups.push({...this.curProxyGroup});
      localStorage.setItem('proxyGroups', JSON.stringify(this.proxyGroups));
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
    for (let i = 0; i < this.curProxyGroup.ipAddress.length; i++) {
      this.proxyText = this.proxyText + this.curProxyGroup.ipAddress[i] + ":" + this.curProxyGroup.port[i]
        + ":" + this.curProxyGroup.userName[i] + ":" + this.curProxyGroup.password[i] + "\n";
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
    localStorage.setItem('proxyGroups', JSON.stringify(this.proxyGroups));
    this.curProxyGroupName = "";
    this.curProxyGroup = new ProxyGroup();
    this.changeDetect.detectChanges();
  }

  async testProxy() {
    const puppeteerOptions = {
      timeout: 0,
      ignoreHTTPSErrors: true,
      headless: AppConfig.headless,
      args: this.args,
      ignoreDefaultArgs: ['--disable-extensions'],
      executablePath: this.getChromiumExecPath()
    };
    const browser = await puppeteer.launch(puppeteerOptions);
    const page = await browser.newPage();
    for (let i = 0; i < this.curProxyGroup.ipAddress.length; i++) {
      await ProxyUtil.useProxy(page, ProxyGroup.getProxyString(this.curProxyGroup, i));
      let res = await page.goto('https://www.supremenewyork.com/mobile/');
      console.log(res["_status"]);
      if (res["_status"] === 200) {
        this.curProxyGroup.status[i] = 'Working'
      } else {
        this.curProxyGroup.status[i] = 'Fail'
      }
    }
    await page.close();
  }

  deleteProxy(index: number) {
    let chosenGroup = this.proxyGroups.filter(group => group.name === this.curProxyGroupName)[0];
    chosenGroup.ipAddress.splice(index, 1);
    chosenGroup.port.splice(index, 1);
    chosenGroup.userName.splice(index, 1);
    chosenGroup.password.splice(index, 1);
    chosenGroup.status.splice(index, 1);
    localStorage.setItem('proxyGroups', JSON.stringify(this.proxyGroups));
  }

  clearCache() {
    this.proxyName = "";
    this.proxyText = "";
  }
}
