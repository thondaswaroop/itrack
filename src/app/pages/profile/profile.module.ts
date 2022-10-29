import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ProfilePageRoutingModule } from './profile-routing.module';

import { ProfilePage } from './profile.page';
import { IncludeLibraryModule } from 'src/app/global/include-library.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IncludeLibraryModule,
    ProfilePageRoutingModule
  ],
  declarations: [ProfilePage]
})
export class ProfilePageModule {}
