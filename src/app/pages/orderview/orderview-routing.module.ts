import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OrderviewPage } from './orderview.page';

const routes: Routes = [
  {
    path: '',
    component: OrderviewPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrderviewPageRoutingModule {}
