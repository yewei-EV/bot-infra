import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './shared/components';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {ProxyComponent} from './pages/proxy/proxy.component';
import {ProfilesComponent} from './pages/profiles/profiles.component';
import {SuccessComponent} from './pages/success/success.component';
import {HomeComponent} from "./home/home.component";
import {CaptchaComponent} from './pages/captcha/captcha.component';

const routes: Routes = [
  { path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'proxy',
    component: ProxyComponent
  },
  {
    path: 'profiles',
    component: ProfilesComponent
  },
  {
    path: 'success',
    component: SuccessComponent
  },
  {
    path: 'captcha',
    component: CaptchaComponent
  },
  {
    path: '**',
    component: PageNotFoundComponent
  }
];


@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
