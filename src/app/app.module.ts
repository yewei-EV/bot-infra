import 'reflect-metadata';
import '../polyfills';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AppRoutingModule } from './app-routing.module';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { HomeModule } from './home/home.module';

import { AppComponent } from './app.component';
import {SupremeModule} from './core/services/supreme/supreme.module';
import { SuccessComponent } from './pages/success/success.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProfilesComponent } from './pages/profiles/profiles.component';
import { ProxyComponent } from './pages/proxy/proxy.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import {MatTabsModule} from "@angular/material/tabs";
import { MatSidenavModule } from '@angular/material/sidenav';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {RouterModule} from '@angular/router';
import {MatCardModule} from '@angular/material/card';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    CoreModule,
    SharedModule,
    HomeModule,
    SupremeModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ModalModule.forRoot(),
    NgMultiSelectDropDownModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    MatTabsModule,
    MatSidenavModule,
    MatCardModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}