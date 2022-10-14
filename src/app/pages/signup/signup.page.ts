import { Component, OnInit } from '@angular/core';
import { MenuController, NavController } from '@ionic/angular';
import { AllcomponentsService } from 'src/app/global/services/allcomponents.service';
import { ApiService } from 'src/app/providers/api.service';
import { StorageService } from 'src/app/providers/storage.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage implements OnInit {
  name:any='';
  mobile:any='';
  email:any='';
  username:any='';
  country:any='';
  password:any='';
  address:any='';

  countries:any=[];

  constructor(public navCtrl:NavController,public component:AllcomponentsService,public api:ApiService,public storage:StorageService,public menu: MenuController) {
    this.api.getData('countries').subscribe((data:any)=>
      {
        this.countries=data.countries;
      });
  }

  ngOnInit() {
  }

  backAction()
  {
    this.navCtrl.back();
  }

  navigation(page)
  {
    this.navCtrl.navigateForward(page);
  }

  doSignup()
  {

    if(this.name=='' || this.name==undefined)
    {
      this.component.errorToast('Enter Display Name');
    }
    else if(this.mobile=='' || this.mobile==undefined)
    {
      this.component.errorToast('Enter Mobile Number');
    }
    else if(this.email=='' || this.email==undefined)
    {
      this.component.errorToast('Enter Email Address');
    }
    else if(this.username=='' || this.username==undefined)
    {
      this.component.errorToast('Enter Username');
    }
    else if(this.password=='' || this.password==undefined)
    {
      this.component.errorToast('Enter Password');
    }
    else if(this.country=='' || this.country==undefined)
    {
      this.component.errorToast('Enter Country');
    }
    else if(this.address=='' || this.address==undefined)
    {
      this.component.errorToast('Enter Address');
    }
    else
    {
      let data = 'name='+encodeURI(this.name)+'&mobile='+encodeURI(this.mobile)+'&email='+encodeURI(this.email)+'&username='+encodeURI(this.username)+'&password='+encodeURI(this.password)+'&country='+encodeURI(this.country)+'&address='+encodeURI(this.address);
      this.api.getData('signup&'+data).subscribe((data:any)=>
      {
        if(data.status=='true')
        {
          this.component.successToast(data.message);
          this.menu.enable(true);
          this.navCtrl.navigateRoot('welcome');
        }
        else
        {
          this.component.errorToast(data.message);
        }
      });
    }
  }

}
