import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './shared/components';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {ProxyComponent} from './pages/proxy/proxy.component';
import {ProfilesComponent} from './pages/profiles/profiles.component';

const routes: Routes = [
  { path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
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
    path: '**',
    component: PageNotFoundComponent
  }
];


@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
