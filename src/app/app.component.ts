import { Component } from '@angular/core';
import { MenuController, NavController, Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { StorageService } from './providers/storage.service';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(public storage:StorageService,public navCtrl:NavController,public platform:Platform,public menu : MenuController,public storage_n: Storage)
  {
    this.initializeApp();
  }

  // async logincheck()
  // {
  //   await this.storage.isLoggedIn().then(data => {
  //     if(data=='yes')
  //     {
  //       this.navCtrl.navigateRoot('home');
  //     }
  //     else
  //     {
  //       this.navCtrl.navigateRoot('welcome');
  //     }
  //   });
  // }

  splashScreen()
  {
    this.navCtrl.navigateRoot('splash');
  }

  initializeApp()
  {
    this.platform.ready().then(() => {
      this.storage_n.create();
    });
    this.storage.init();
    // this.logincheck();
    this.splashScreen();
  }

  menuNav(vl)
  {
    this.menu.close();
    if(vl!='logout')
    {
      this.navCtrl.navigateRoot(vl);
    }
    else
    {
      this.logout();
    }
  }

  pageNav(vl)
  {
    this.menu.close();
    this.navCtrl.navigateForward(vl);
  }

  logout()
  {
    this.menu.enable(false);
    this.storage.set('itrack_userid','');
    this.navCtrl.navigateRoot('welcome');
  }

  shareicon(link)
  {
    window.open(link, '_blank');
  }

  openWeb()
  {
    window.open('https://www.youtube.com/c/SDVentertainments');
  }
}
