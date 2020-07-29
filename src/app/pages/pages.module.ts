import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {DashboardComponent} from "./dashboard/dashboard.component";
import {SuccessComponent} from "./success/success.component";
import {ProfilesComponent} from "./profiles/profiles.component";
import {ProxyComponent} from "./proxy/proxy.component";
import {FormsModule} from "@angular/forms";
import {NgMultiSelectDropDownModule} from "ng-multiselect-dropdown";
import {MatSidenavModule} from '@angular/material/sidenav';
import {CaptchaComponent} from './captcha/captcha.component';
import {MatCardModule} from '@angular/material/card';

@NgModule({
  declarations: [SuccessComponent, DashboardComponent, ProfilesComponent, ProxyComponent, CaptchaComponent],
    imports: [
        CommonModule,
        FormsModule,
        NgMultiSelectDropDownModule,
        MatSidenavModule,
        MatCardModule,
    ],
  exports: [
    DashboardComponent,
    SuccessComponent,
    ProfilesComponent,
    ProxyComponent,
    CaptchaComponent
  ],
})
export class PagesModule { }
