import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { AllcomponentsService } from 'src/app/global/services/allcomponents.service';
import { ApiService } from 'src/app/providers/api.service';

@Component({
  selector: 'app-order',
  templateUrl: './order.page.html',
  styleUrls: ['./order.page.scss'],
})
export class OrderPage implements OnInit {

  shipid:any='';
  tracking:any=[];

  constructor(public api:ApiService,private route: ActivatedRoute, public navCtrl:NavController,public components:AllcomponentsService,private router: Router,public component:AllcomponentsService) {

    this.route.queryParams.subscribe(params => {
      if (this.router.getCurrentNavigation().extras.state) {
        this.shipid= this.router.getCurrentNavigation().extras.state.id;
        this.dataload(this.shipid);
      }
    });
  }

  dataload(id)
  {
    this.component.loadstart('Please wait.. Data is loading');
    this.api.getData('tracking&id='+id).subscribe((data:any) =>
    {
      this.tracking=data.shipments;
      this.component.loadstop();
    });
  }

  ngOnInit() {
  }

}
