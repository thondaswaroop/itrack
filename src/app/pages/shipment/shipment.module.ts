import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ShipmentPageRoutingModule } from './shipment-routing.module';

import { ShipmentPage } from './shipment.page';
import { IncludeLibraryModule } from 'src/app/global/include-library.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IncludeLibraryModule,
    ShipmentPageRoutingModule
  ],
  declarations: [ShipmentPage]
})
export class ShipmentPageModule {}
