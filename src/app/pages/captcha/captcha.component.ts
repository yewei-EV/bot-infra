import {ChangeDetectorRef, Component, OnInit, TemplateRef} from '@angular/core';
import {CaptchaTokenService} from '../../shared/captcha-token.service';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {HarvesterInfo} from '../../core/services/supreme/harvesterInfo';
import {TaskInfo} from '../../core/services/supreme/task-info';

@Component({
  selector: 'app-captcha',
  templateUrl: './captcha.component.html',
  styleUrls: ['./captcha.component.css']
})
export class CaptchaComponent implements OnInit {

  captchaProxy: string;
  curModal: BsModalRef;
  config = {
    animated: true,
    keyboard: true,
    backdrop: true,
    ignoreBackdropClick: true
  };
  harvesters: {[key: string]: HarvesterInfo} = {};
  Object = Object;

  constructor(private modalService: BsModalService, private captchaTokenService: CaptchaTokenService, private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    setInterval(() => {
      this.cd.detectChanges();
    }, 1000);
    this.harvesters = this.captchaTokenService.getHarvesterInfos();
  }

  openModalWithClass(template: TemplateRef<any>) {
    this.curModal = this.modalService.show(
      template,
      Object.assign({}, this.config, {class: 'gray modal-lg'})
    );
  }

  openCaptcha() {
    console.log("Captcha Proxy: " + this.captchaProxy);
    if (!this.captchaProxy || this.captchaProxy === "") {
      this.captchaTokenService.addYoutubeWindow("", "", "", "");
    } else {
      let strings = this.captchaProxy.split(":");
      if (strings.length === 4) {
        this.captchaTokenService.addYoutubeWindow(strings[0], strings[1], strings[2], strings[3]);
      } else if (strings.length === 2) {
        this.captchaTokenService.addYoutubeWindow(strings[0], strings[1], "", "");
      } else {
        this.captchaTokenService.addYoutubeWindow("", "", "", "");
      }
    }
  }

  getYoutubeLoginNumber() {
    return this.captchaTokenService.getNumber();
  }

  clearYoutube() {
    this.captchaTokenService.clearYoutubeWindows();
    this.harvesters = this.captchaTokenService.getHarvesterInfos();
    this.cd.detectChanges();
  }

  test() {
    this.captchaTokenService.test();
    // this.harvesters = this.captchaTokenService.getHarvesterInfos();
  }

  async getToken() {
    const taskInfo = new TaskInfo();
    taskInfo.runnable = true;
    const token = await this.captchaTokenService.getToken(taskInfo);
    console.log(token);
  }

  openCaptchaWindow(index: number) {
    this.captchaTokenService.openCaptchaWindow(index).then();
  }
}
