import {Component} from '../component';
import {Injectable} from '@angular/core';
import {ProfileInfo} from '../../profile-info';

@Injectable()
export class CookieBrowser extends Component {

  async run() {
    await super.run();
    const page = this.sharedInfo.basic.page;
    const cookie = ProfileInfo.toCookie(this.taskInfo.profile);
    await page.setCookie(cookie);
  }

}
