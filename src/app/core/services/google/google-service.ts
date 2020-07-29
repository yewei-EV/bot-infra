import {SharedInfo} from './shared-info';
import {Injectable} from '@angular/core';
import {TaskInfo} from './task-info';

@Injectable()
export abstract class GoogleService {
  protected sharedInfo: SharedInfo;
  protected taskInfo: TaskInfo;
  setSharedInfo(sharedInfo: SharedInfo) {
    this.sharedInfo = sharedInfo;
  }
  setTaskInfo(taskInfo: TaskInfo) {
    this.taskInfo = taskInfo;
  }
  async run(): Promise<any> {
    console.log(this.constructor.name, ' start: ');
  }
}
