import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {BrowserModeService} from './browser-mode/browser-mode.service';
import {ComponentModule} from './components/component.module';
import {GoogleService} from './google-service';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    ComponentModule,
  ],
  providers: [
    {provide: GoogleService, useClass: BrowserModeService},
  ]
})
export class GoogleModule { }
