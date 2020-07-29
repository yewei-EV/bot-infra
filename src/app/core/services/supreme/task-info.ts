import {ProfileInfo} from './profile-info';
import {ProxyGroup} from './proxy-group';

export class TaskInfo {
  md5: string;
  region: string;
  mode: string;
  proxy: ProxyGroup;
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
  imageUrl: string = 'https://www.fashionseoul.com/wp-content/uploads/2016/02/20160218_SUPREME_1.jpg';
  currentTime: string;
  productName: string;

  static isFullInfo(task: TaskInfo): boolean {
    return !!(task.region && task.mode && task.proxy && task.keywords && task.colors && task.category
      && task.size.length !== 0 && task.profile && task.monitorDelay && task.checkoutDelay);
  }
}
