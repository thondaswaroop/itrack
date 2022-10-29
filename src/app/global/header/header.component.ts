import { Component, Input, OnInit } from '@angular/core';
import { NavigationExtras } from '@angular/router';
import { MenuController, NavController } from '@ionic/angular';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @Input() title = '';

  constructor(public menu: MenuController,public navCtrl: NavController) { }

  ngOnInit() {}

  profile()
  {
    // let navigationExtras: NavigationExtras = { state: { 'id': id } };

    this.navCtrl.navigateForward('profile')
  }
  openMenu()
  {
    this.menu.enable(true, 'first');
    this.menu.open('first');
  }

}
