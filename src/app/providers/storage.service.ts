import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private _storage: Storage | null = null;

  constructor(private storage: Storage) {
    this.init();
  }

  isLoggedIn(): Promise<any> {
    return this.storage.get('itrack_userid').then((data) => {
      if(data!=undefined && data!='' && data!='undefined')
      	{
      		return 'yes';
      	}
    }).catch((error: any) =>
    {
    });
  }



  async init() {
    // If using, define drivers here: await this.storage.defineDriver(/*...*/);
    const storage = await this.storage.create();
    this._storage = storage;
  }

  // Create and expose methods that users of this service can
  // call, for example:
  public set(key: string, value: any) {
    this._storage?.set(key, value);
  }

  get(vl): Promise<any> {
    return this.storage.get(vl).then((value) => {
      	return value;
    });
  }

  async ngOnInit() {
    // If using a custom driver:
    // await this.storage.defineDriver(MyCustomDriver)
    await this.storage.create();
  }

}
