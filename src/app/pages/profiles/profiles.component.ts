import { Component, OnInit } from '@angular/core';
import {Md5} from 'ts-md5/dist/md5';
import {ProfileInfo} from '../../core/google';
@Component({
  selector: 'app-profiles',
  templateUrl: './profiles.component.html',
  styleUrls: ['./profiles.component.css']
})
export class ProfilesComponent implements OnInit {
  profiles: ProfileInfo[] = [];
  curProfile: ProfileInfo = new ProfileInfo();

  constructor() { }

  ngOnInit(): void {
    this.profiles = ProfileInfo.readAll();
  }

  addProfile() {
    if (this.curProfile.isFullInfo()) {
      delete this.curProfile.md5;
      const value = JSON.stringify(this.curProfile);
      const md5 = Md5.hashStr(value).toString();
      if (!this.profiles.filter(profile => profile.md5 == md5).length) {
        this.curProfile.md5 = md5;
        this.profiles.push(Object.assign(new ProfileInfo(), {...this.curProfile}));
        ProfileInfo.saveAll(this.profiles);
      }
    }
  }

  edit(index: number) {
    this.curProfile = Object.assign(new ProfileInfo(), {...this.profiles[index]});
  }

  delete(index: number) {
    this.profiles.splice(index, 1);
    ProfileInfo.saveAll(this.profiles);
  }

  clearForm() {
    this.curProfile = new ProfileInfo();
  }
}
