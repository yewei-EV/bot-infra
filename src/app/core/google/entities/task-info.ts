import {ProfileInfo} from './profile-info';
import {ProxyGroup} from './proxy-group';

export class TaskInfo {
  private static key = 'taskInfos';
  md5: string;
  region: string;
  mode: string;
  proxyGroup: ProxyGroup;
  cardinalBP: string;
  captchaBP: string = "false";
  keywords: string = "";
  colors: string = "";
  category: string;
  size: Array<string>;
  profile: ProfileInfo;
  monitorDelay: number;
  checkoutDelay: number;
  runnable: boolean = false;
  running: boolean = false;
  sizeIndex = 0;
  status: string = 'Not Start';
  currentTime: string;
  productName: string;

  isFullInfo(task: TaskInfo): boolean {
    return !!(task.region && task.mode && task.proxyGroup && task.keywords && task.colors && task.category
      && task.size.length !== 0 && task.profile && task.monitorDelay && task.checkoutDelay);
  }

  static readAll(): TaskInfo[] {
    const rawTaskInfos: TaskInfo[] = JSON.parse(localStorage.getItem(this.key));
    const taskInfos: TaskInfo[] = [];
    for (const taskInfo of rawTaskInfos) {
      taskInfos.push(Object.assign(new TaskInfo(), taskInfo));
    }
    return taskInfos;
  }
  static saveAll(taskInfos:TaskInfo[]) {
    localStorage.setItem(this.key, JSON.stringify(taskInfos));
  }
}
