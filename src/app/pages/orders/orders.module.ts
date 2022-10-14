import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OrdersPageRoutingModule } from './orders-routing.module';

import { OrdersPage } from './orders.page';
import { IncludeLibraryModule } from 'src/app/global/include-library.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IncludeLibraryModule,
    IonicModule,
    OrdersPageRoutingModule
  ],
  declarations: [OrdersPage]
})
export class OrdersPageModule {}
