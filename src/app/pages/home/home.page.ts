import { Component, OnInit } from '@angular/core';
import { NavigationExtras } from '@angular/router';
import { NavController } from '@ionic/angular';
import { AllcomponentsService } from 'src/app/global/services/allcomponents.service';
import { ApiService } from 'src/app/providers/api.service';
import { StorageService } from 'src/app/providers/storage.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  banners:any=[];
  shipments:any=[];

  constructor(public navCtrl: NavController,private storage: StorageService,public component: AllcomponentsService,public api: ApiService) {

  setTimeout(() => {
    this.dataload();
  }, 1000);

  }

  redirectbanner(url)
  {
    window.open(url);
  }

  slideOptsOne = {
    initialSlide: 0,
    slidesPerView: 1,
    autoplay:true
   };

  dataload()
    {
      this.component.loadstart('Please wait.. Data is loading');
      this.storage.get("itrack_userid").then(itrack_userid => {
        if(itrack_userid!=undefined && itrack_userid!='' && itrack_userid!='undefined')
        {
          this.api.getData('getprofile&id='+itrack_userid).subscribe((daa : any) => {
              let country=daa.userdata.country;
              this.api.getData('banners&id='+country).subscribe((res : any) => {
                this.banners=res.banners;
              });
              this.api.getData('shipments&id='+itrack_userid).subscribe((res : any) => {
                this.shipments=res.shipments;
                this.component.loadstop();
              });
          });
        }
      });
    }

    pageOpen(pagename,id)
    {
      let navigationExtras: NavigationExtras = { state: { 'id': id } };

      this.navCtrl.navigateForward(pagename, navigationExtras)
    }

    menuNav(vl)
    {
      this.navCtrl.navigateRoot(vl);
    }


    do1()
    {

    }

  ngOnInit() {
  }

}
