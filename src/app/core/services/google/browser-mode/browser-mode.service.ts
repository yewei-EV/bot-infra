import {Injectable} from '@angular/core';
import {GoogleService} from '../google-service';
import {Setup} from '../components/setup/setup';
import {LoginBrowser} from '../components/login/login-browser';
import {SharedInfo} from '../shared-info';
import {TaskInfo} from '../task-info';

@Injectable({
  providedIn: 'root'
})
export class BrowserModeService extends GoogleService {

  constructor(
    private setup: Setup,
    private login: LoginBrowser,
    ) {
    super();
  }

  setSharedInfo(sharedInfo: SharedInfo) {
    super.setSharedInfo(sharedInfo);
    this.setup.setSharedInfo(sharedInfo);
    this.login.setSharedInfo(sharedInfo);
  }

  setTaskInfo(taskInfo: TaskInfo) {
    super.setTaskInfo(taskInfo);
    this.setup.setTaskInfo(taskInfo);
    this.login.setTaskInfo(taskInfo);
  }

  async run() {
    await super.run();
    await this.setup.run();
    await this.login.run();
    console.log('Finished');
  }
}
