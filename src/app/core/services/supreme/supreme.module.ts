import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {BrowserModeService} from './browser-mode/browser-mode.service';
import {ComponentModule} from './components/component.module';
import {SupremeService} from './supreme-service';
import {RequestModeService} from './request-mode/request-mode.service';
import {HybridModeService} from './hybrid-mode/hybrid-mode.service';
import {BaseModeService} from './base-mode/base-mode.service';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    ComponentModule,
  ],
  providers: [
    {provide: SupremeService, useClass: BrowserModeService},
    {provide: SupremeService, useClass: RequestModeService},
    {provide: SupremeService, useClass: HybridModeService},
    {provide: SupremeService, useClass: BaseModeService}
  ]
})
export class SupremeModule { }
