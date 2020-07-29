import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';

import { HomeComponent } from './home.component';
import { SharedModule } from '../shared/shared.module';
import {MatTabsModule} from "@angular/material/tabs";
import {PagesModule} from "../pages/pages.module";
import { MatSidenavModule } from '@angular/material/sidenav';

@NgModule({
    declarations: [HomeComponent],
    exports: [
        HomeComponent
    ],
  imports: [CommonModule, SharedModule, HomeRoutingModule, SharedModule, MatTabsModule, PagesModule, MatSidenavModule]
})
export class HomeModule {}
