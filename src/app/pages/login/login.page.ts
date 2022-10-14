import { Component, OnInit } from '@angular/core';
import { MenuController, NavController } from '@ionic/angular';
import { AllcomponentsService } from 'src/app/global/services/allcomponents.service';
import { ApiService } from 'src/app/providers/api.service';
import { StorageService } from 'src/app/providers/storage.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  username:any="";
  password:any="";

  constructor(public navCtrl : NavController,public component:AllcomponentsService,public api:ApiService,public storage:StorageService,public menu: MenuController)
  {
    this.username="";
    this.password="";
  }

  ngOnInit() {
  }

  backAction()
  {
    this.navCtrl.back();
  }

  doLogin()
  {
    this.component.loadstart('Please wait we are validating');
    if(this.username=='' || this.username==undefined)
    {
      this.component.errorToast('Enter Username');
      this.component.loadstop();
    }
    else if(this.password=='' || this.password==undefined)
    {
      this.component.errorToast('Enter Password');
      this.component.loadstop();
    }
    else
    {

      this.api.getData('login&username='+this.username+'&password='+this.password).subscribe((data:any)=>
      {
        if(data.status=='true')
        {
          this.component.successToast(data.message);
          this.menu.enable(true);
          this.component.loadstop();
          this.storage.set('itrack_userid',data.userid);
          this.navCtrl.navigateRoot('home');
        }
        else
        {
          this.component.errorToast(data.message);
          this.component.loadstop();
        }
      });

      // let data={'username':this.username,'password':this.password};
      // this.api.postdata('login',data).subscribe((data:any)=>
      // {
      //   if(data.status=='true')
      //   {
      //     this.component.successToast(data.message);
      //     this.menu.enable(true);
      //     this.storage.set('itrack_userid',data.userid);
      //     this.navCtrl.navigateRoot('home');
      //   }
      //   else
      //   {
      //     this.component.errorToast(data.message);
      //   }
      // });
      // this.navCtrl.navigateRoot('home');
      // this.component.successToast('Login Successful');
    }
  }

  navigation(page)
  {
    this.navCtrl.navigateForward(page);
  }

}
