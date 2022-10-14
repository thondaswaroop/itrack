import { Component, OnInit } from '@angular/core';
import { NavigationExtras } from '@angular/router';
import { NavController } from '@ionic/angular';
import { AllcomponentsService } from 'src/app/global/services/allcomponents.service';
import { ApiService } from 'src/app/providers/api.service';
import { StorageService } from 'src/app/providers/storage.service';

@Component({
  selector: 'app-orderview',
  templateUrl: './orderview.page.html',
  styleUrls: ['./orderview.page.scss'],
})
export class OrderviewPage implements OnInit {

  shipments:any=[];
  searchText:string='';

  constructor(public navCtrl: NavController,private storage: StorageService,public component: AllcomponentsService,public api: ApiService) {
    // this.dataload();
  }

  dataload()
  {
    this.component.loadstart('Please wait.. Data is loading');
    this.storage.get("itrack_userid").then(itrack_userid => {
      if(itrack_userid!=undefined && itrack_userid!='' && itrack_userid!='undefined')
      {
        this.api.getData('getprofile&id='+itrack_userid).subscribe((daa : any) => {
            this.api.getData('shipments&id='+itrack_userid).subscribe((res : any) => {
              this.shipments=res.shipments;
              this.component.loadstop();
            });
        });
      }
    });
  }

  searchFun(text)
  {
    let searchText=text;
    if(searchText!='')
    {
      this.component.loadstart('Please wait.. Validating Tracking Number');
      this.api.getData('trackpackage&id='+searchText).subscribe((data:any) =>
      {
        if(data.trackid!='')
        {
          this.component.loadstop();
          let navigationExtras: NavigationExtras = { state: { 'id': data.trackid } };
          this.navCtrl.navigateForward('order', navigationExtras);
        }
        else
        {
          this.component.errorToast('Invalid Tracking Number');
          this.component.loadstop();
        }
      });
    }
    else
    {
      this.component.errorToast('Please Input Tracking Number');
    }
  }

  pageOpen(pagename,id)
  {
    let navigationExtras: NavigationExtras = { state: { 'id': id } };

    this.navCtrl.navigateForward(pagename, navigationExtras)
  }

  ngOnInit() {
  }

}
