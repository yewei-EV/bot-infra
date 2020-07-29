import { Component, OnInit } from '@angular/core';
import {ProfileInfo} from '../../core/services/supreme/profile-info';
import {Md5} from 'ts-md5/dist/md5';

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
    this.profiles = JSON.parse(localStorage.getItem('profiles')) || [];
    this.curProfile.state = "";
    this.curProfile.country = "";
    this.curProfile.cardType = "";
    this.curProfile.expireMonth = "";
    this.curProfile.expireYear = "";
  }

  addProfile() {
    if (ProfileInfo.isFullInfo(this.curProfile)) {
      delete this.curProfile.md5;
      const value = JSON.stringify(this.curProfile);
      const md5 = Md5.hashStr(value).toString();
      if (!this.profiles.filter(profile => profile.md5 == md5).length) {
        this.curProfile.md5 = md5;
        this.profiles.push({...this.curProfile});
        localStorage.setItem('profiles', JSON.stringify(this.profiles));
      }
    }
  }

  edit(index: number) {
    this.curProfile.name = this.profiles[index].name;
    this.curProfile.fullName = this.profiles[index].fullName;
    this.curProfile.phoneNo = this.profiles[index].phoneNo;
    this.curProfile.email = this.profiles[index].email;
    this.curProfile.address1 = this.profiles[index].address1;
    this.curProfile.address2 = this.profiles[index].address2;
    this.curProfile.zipCode = this.profiles[index].zipCode;
    this.curProfile.city = this.profiles[index].city;
    this.curProfile.state = this.profiles[index].state;
    this.curProfile.country = this.profiles[index].country;
    this.curProfile.cardNo = this.profiles[index].cardNo;
    this.curProfile.cvvNo = this.profiles[index].cvvNo;
    this.curProfile.cardType = this.profiles[index].cardType;
    this.curProfile.expireMonth = this.profiles[index].expireMonth;
    this.curProfile.expireYear = this.profiles[index].expireYear;
  }

  delete(index: number) {
    this.profiles.splice(index, 1);
    localStorage.setItem('profiles', JSON.stringify(this.profiles));
  }

  clearForm() {
    this.curProfile.name = "";
    this.curProfile.fullName = "";
    this.curProfile.phoneNo = "";
    this.curProfile.email = "";
    this.curProfile.address1 = "";
    this.curProfile.address2 = "";
    this.curProfile.zipCode = "";
    this.curProfile.city = "";
    this.curProfile.state = "";
    this.curProfile.country = "";
    this.curProfile.cardNo = "";
    this.curProfile.cvvNo = "";
    this.curProfile.cardType = "";
    this.curProfile.expireMonth = "";
    this.curProfile.expireYear = "";
  }
}
