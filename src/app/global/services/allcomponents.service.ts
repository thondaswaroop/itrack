import { Injectable } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AllcomponentsService {

  isLoading:boolean = false;

  constructor(public toastController: ToastController,public loading:LoadingController) { }


  async errorToast(text) {
    const toast = await this.toastController.create({
      message: text,
      color:'danger',
      duration: 2000
    });
    toast.present();
  }

  async successToast(text) {
    const toast = await this.toastController.create({
      message: text,
      color:'success',
      duration: 2000
    });
    toast.present();
  }

  async loadstart(data) {
    this.isLoading = true;
    return await this.loading.create({
      // duration: 5000,
      message: data
    }).then(a => {
      a.present().then(() => {
        console.log('presented');
        if (!this.isLoading) {
          a.dismiss().then(() => console.log('abort presenting'));
        }
      });
    });
  }

  async loadstop() {
    this.isLoading = false;
    return await this.loading.dismiss().then(() => console.log('dismissed'));
  }

}
