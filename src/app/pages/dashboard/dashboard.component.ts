import {Component, OnInit, TemplateRef} from '@angular/core';
import {Md5} from 'ts-md5';
import {EmailService, ProfileInfo, ProxyGroup, TaskInfo} from '../../core/google';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [{provide: EmailService}]
})
export class DashboardComponent implements OnInit {

  profiles: ProfileInfo[];
  proxyGroups: ProxyGroup[];
  taskInfos: TaskInfo[];
  curTaskInfo: TaskInfo = new TaskInfo();
  curProfileIndex: number;
  curProxyGroupIndex: number;
  opened: boolean = false;
  curModal: BsModalRef;
  config = {
    animated: true,
    keyboard: true,
    backdrop: true,
    ignoreBackdropClick: true
  };

  constructor(
    private emailService: EmailService,
    private modalService: BsModalService
  ) {}

  ngOnInit() {
    this.taskInfos = TaskInfo.readAll();
    this.profiles = ProfileInfo.readAll();
    this.proxyGroups = ProxyGroup.readAll();
  }

  openModalWithClass(template: TemplateRef<any>) {
    this.curModal.hide();
    this.curModal = this.modalService.show(
      template,
      Object.assign({}, this.config, {class: 'gray modal-lg'})
    );
  }

  async startTask(index: number) {
    const taskInfo = this.taskInfos[index];
    await this.emailService.run(taskInfo, index.toString());
  }

  async stopTask(index: number) {
    const taskInfo = this.taskInfos[index];
    await this.emailService.stop(taskInfo);
  }

  async startAll() {
    for (const [index, taskInfo] of this.taskInfos.entries()) {
      this.emailService.run(taskInfo, index.toString()).then();
    }
  }

  async stopAll() {
    for (const taskInfo of this.taskInfos) {
      this.emailService.stop(taskInfo).then();
    }
  }

  addTask() {
    if (this.curProxyGroupIndex > -1) {
      this.curTaskInfo.proxyGroup = this.proxyGroups[this.curProxyGroupIndex];
    } else {
      this.curTaskInfo.proxyGroup = new ProxyGroup();
      this.curTaskInfo.proxyGroup.proxies = [];
      this.curTaskInfo.proxyGroup.name = 'localhost';
    }
    this.curTaskInfo.profile = this.profiles[this.curProfileIndex];
    delete this.curTaskInfo.md5;
    const value = JSON.stringify(this.curTaskInfo);
    this.curTaskInfo.md5 = Md5.hashStr(value).toString();
    this.taskInfos.push(Object.assign(new TaskInfo(), { ...this.curTaskInfo}));
    TaskInfo.saveAll(this.taskInfos);
    console.log(this.taskInfos);
  }

  editTask(index: number) {
    this.curTaskInfo = Object.assign(new TaskInfo(),{...this.taskInfos[index]});
    this.curTaskInfo.runnable = false;
    this.curTaskInfo.running = false;
    this.curProxyGroupIndex = this.proxyGroups.findIndex(group => group.name === this.taskInfos[index].proxyGroup.name);
    this.curProfileIndex = this.profiles.findIndex(profile => profile.name === this.taskInfos[index].profile.name);
  }

  deleteTask(index: number) {
    this.taskInfos.splice(index, 1);
    TaskInfo.saveAll(this.taskInfos);
  }

  clearForm() {
    this.curTaskInfo = new TaskInfo();
  }

  async deleteAll() {
    await this.stopAll();
    this.taskInfos = [];
    TaskInfo.saveAll(this.taskInfos);
  }

}
