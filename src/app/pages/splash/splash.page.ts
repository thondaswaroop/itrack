import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { StorageService } from 'src/app/providers/storage.service';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
})
export class SplashPage implements OnInit {

  constructor(public storage:StorageService,public navCtrl:NavController) { 
    setTimeout(() => {
      this.logincheck();
    }, 3500);
  }

  async logincheck()
  {
    await this.storage.isLoggedIn().then(data => {
      if(data=='yes')
      {
        this.navCtrl.navigateRoot('home');
      }
      else
      {
        this.navCtrl.navigateRoot('welcome');
      }
    });
  }

  ngOnInit() {
  }

}
