import {SharedInfo} from '../entities/shared-info';
import {TaskInfo} from '../entities/task-info';

export abstract class Service {
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
