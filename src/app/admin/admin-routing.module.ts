import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Dashboard} from './dashboard/dashboard';
import { Layout } from './layout/layout';
import { Orders } from './orders/orders';
import { Reviews } from './reviews/reviews';
import { AdminCommissions } from './commissions/commissions';
import { Registrations } from './registrations/registrations';
import { Recordings } from './recordings/recordings';
import { Prints } from './prints/prints';
import { Bundles } from './bundles/bundles';

const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: '', component: Dashboard },
      // add more admin pages here
      {path: 'originals', component: Orders},
      {path: 'prints', component: Prints},
      {path: 'reviews', component: Reviews},
      {path: 'commissions', component: AdminCommissions},
      {path: 'wsregistrations', component: Registrations},
      {path: 'recordings', component: Recordings},
      {path: 'bundles', component: Bundles}


    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}
