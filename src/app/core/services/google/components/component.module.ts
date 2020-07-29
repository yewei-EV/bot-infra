import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Setup} from './setup/setup';
import {LoginBrowser} from './login/login-browser';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
  ],
  providers: [
    Setup,
    LoginBrowser
  ]
})
export class ComponentModule { }
