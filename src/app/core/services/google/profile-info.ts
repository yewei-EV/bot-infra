import {SetCookie} from 'puppeteer';

export class ProfileInfo {
  md5: string;
  name: string;
  fullName: string;
  phoneNo: string;
  email: string;
  address1: string;
  address2: string;
  zipCode: string;
  city: string;
  state: string;
  country: string;
  cardType: string;
  cardNo: string;
  cvvNo: string;
  expireMonth: string;
  expireYear: string;
  static toCookie(profile: ProfileInfo): SetCookie {
    //TODO 欧洲
    const cookies = [
      profile.fullName,
      profile.email,
      profile.phoneNo,
      profile.address1,
      profile.address2,
      profile.city,
      profile.state,
      profile.zipCode,
      profile.country,
    ];

    return {
      name: 'js-address',
      value: encodeURIComponent(cookies.join('|')),
      domain: '.supremenewyork.com'
    }
  }
  static isFullInfo(profile: ProfileInfo): boolean {
    return !!(profile.fullName && profile.email && profile.phoneNo && profile.address1 && profile.city && profile.state
      && profile.zipCode && profile.country);
  }
}
