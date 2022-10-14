import { Component, OnInit } from '@angular/core';
import { MenuController, NavController } from '@ionic/angular';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
})
export class WelcomePage implements OnInit {

  constructor(public NavController:NavController,public menu:MenuController) {
    this.menu.enable(false);
  }

  ngOnInit() {
  }

  navigation(page)
  {
    this.NavController.navigateForward(page);
  }

}
