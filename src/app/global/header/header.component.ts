import { Component, Input, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @Input() title = '';

  constructor(public menu: MenuController) { }

  ngOnInit() {}

  openMenu()
  {
    this.menu.enable(true, 'first');
    this.menu.open('first');
  }

}
