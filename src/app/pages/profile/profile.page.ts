import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AllcomponentsService } from 'src/app/global/services/allcomponents.service';
import { ApiService } from 'src/app/providers/api.service';
import { StorageService } from 'src/app/providers/storage.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {

  countries: any = [];
  providers: any = [];
  selectedArray: any = [];
  customer: any = [];

  constructor(public navCtrl: NavController, public component: AllcomponentsService, public api: ApiService, private storage: StorageService) {
    
    this.component.loadstart('Please wait we are fetching data');
    this.storage.get("itrack_userid").then(itrack_userid => {
      if (itrack_userid != undefined && itrack_userid != '' && itrack_userid != 'undefined') {

        this.api.getData('getprofile&id=' + itrack_userid).subscribe((rec: any) => {
          this.customer = rec.userdata;
          this.api.getData('countries').subscribe((data: any) => {
            this.countries = data.countries;
            this.component.loadstop();
          });
        });
      }
    });
  }

  countryselect(id) {
    this.component.loadstart('Please wait we are fetching hubs');
    this.storage.get("itrack_userid").then(itrack_userid => {
      if (itrack_userid != undefined && itrack_userid != '' && itrack_userid != 'undefined') {

          this.api.getData('gethubs&country=' + id + '&userid=' + itrack_userid).subscribe((data: any) => {
            data.providers.forEach(element => {
              if (element.checked) {
                this.selectedArray.push(element.hub.id);
              }
              this.component.loadstop();
            });
            this.providers = data.providers;
            console.log('providers', this.providers);
          });
      }
    });
  }


  selectMember(data) {
    console.log('data', data);
    if (data.checked == true) {

      const index = this.selectedArray.indexOf(data.hub.id);
      if (index > -1) { // only splice array when item is found
        this.selectedArray.splice(index, 1); // 2nd parameter means remove one item only
      }

    } else {
      this.selectedArray.push(data.hub.id);
    }
    console.log(this.selectedArray);
  }

  submitProviders() {
    if (this.selectedArray.length > 0) {
      this.component.loadstart('Please wait.. Data is loading');
      this.storage.get("itrack_userid").then(itrack_userid => {
        if (itrack_userid != undefined && itrack_userid != '' && itrack_userid != 'undefined') {
          this.api.getData('updatemylocations&userid=' + itrack_userid + '&locations=' + this.selectedArray).subscribe((data: any) => {
            if (data.status == 'true') {
              this.component.successToast(data.message);
              this.component.loadstop();
            }
            else {
              this.component.errorToast(data.message);
              this.component.loadstop();
            }
          });
        }
      });
    }
  }

  ngOnInit() {
  }
}
