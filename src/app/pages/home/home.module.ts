import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HomePageRoutingModule } from './home-routing.module';

import { HomePage } from './home.page';
import { IncludeLibraryModule } from 'src/app/global/include-library.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IncludeLibraryModule,
    HomePageRoutingModule
  ],
  declarations: [HomePage]
})
export class HomePageModule {}
