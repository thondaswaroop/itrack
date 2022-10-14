import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OrderviewPageRoutingModule } from './orderview-routing.module';

import { OrderviewPage } from './orderview.page';
import { IncludeLibraryModule } from 'src/app/global/include-library.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IncludeLibraryModule,
    OrderviewPageRoutingModule
  ],
  declarations: [OrderviewPage]
})
export class OrderviewPageModule {}
