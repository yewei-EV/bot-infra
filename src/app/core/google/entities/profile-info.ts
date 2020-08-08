
export class ProfileInfo {
  private static key = 'profileInfos';
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

  isFullInfo(): boolean {
    return !!(this.fullName && this.email && this.phoneNo && this.address1 && this.city && this.state
      && this.zipCode && this.country);
  }

  static readAll(): ProfileInfo[] {
    const rawProfileInfo: ProfileInfo[] = JSON.parse(localStorage.getItem(this.key));
    const profileInfos: ProfileInfo[] = [];
    for (const taskInfo of rawProfileInfo) {
      profileInfos.push(Object.assign(new ProfileInfo(), taskInfo));
    }
    return profileInfos;
  }

  static saveAll(profileInfos: ProfileInfo[]) {
    localStorage.setItem(this.key, JSON.stringify(profileInfos));
  }
}
