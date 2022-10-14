import { Component, OnInit } from '@angular/core';
import { MenuController, NavController } from '@ionic/angular';
import { AllcomponentsService } from 'src/app/global/services/allcomponents.service';
import { ApiService } from 'src/app/providers/api.service';
import { StorageService } from 'src/app/providers/storage.service';

@Component({
  selector: 'app-sample',
  templateUrl: './sample.page.html',
  styleUrls: ['./sample.page.scss'],
})
export class SamplePage implements OnInit {

  countries:any=[];

  constructor(public navCtrl:NavController,public component:AllcomponentsService,public api:ApiService,public storage:StorageService,public menu: MenuController) {

  }

  ngOnInit() {
  }

}
