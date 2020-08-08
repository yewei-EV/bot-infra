import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {DashboardComponent} from "./dashboard/dashboard.component";
import {ProfilesComponent} from "./profiles/profiles.component";
import {ProxyComponent} from "./proxy/proxy.component";
import {FormsModule} from "@angular/forms";
import {NgMultiSelectDropDownModule} from "ng-multiselect-dropdown";
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatCardModule} from '@angular/material/card';

@NgModule({
  declarations: [DashboardComponent, ProfilesComponent, ProxyComponent],
    imports: [
        CommonModule,
        FormsModule,
        NgMultiSelectDropDownModule,
        MatSidenavModule,
        MatCardModule,
    ],
  exports: [
    DashboardComponent,
    ProfilesComponent,
    ProxyComponent,
  ],
})
export class PagesModule { }
