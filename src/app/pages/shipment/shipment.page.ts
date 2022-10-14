import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AllcomponentsService } from 'src/app/global/services/allcomponents.service';
import { ApiService } from 'src/app/providers/api.service';

@Component({
  selector: 'app-shipment',
  templateUrl: './shipment.page.html',
  styleUrls: ['./shipment.page.scss'],
})
export class ShipmentPage implements OnInit {

  countries:any=[];
  providers:any=[];

  constructor(public navCtrl:NavController,public component:AllcomponentsService,public api:ApiService) {
    this.api.getData('countries').subscribe((data:any)=>
    {
      this.countries=data.countries;
    });
  }

  countryselect(id)
  {
    this.api.getData('providers&country='+id).subscribe((data:any)=>
    {
      this.providers=data.providers;
    });
  }

  ngOnInit() {
  }

}
