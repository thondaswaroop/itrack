import { Component, Input, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {

  @Input() highlight = '';
  selectfooter:any='';

  constructor(public navCtrl:NavController) {
  }

  ngOnInit() {}

  menuNav(page)
  {
    this.navCtrl.navigateRoot(page);
  }

}
