import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  public apiurl=environment.apiURL;

  constructor(private http: HttpClient)
  {

  }


  getData(lurl)
  {
    let url = this.apiurl+lurl;
    return this.http.get(url);
  }

  postdata(lurl, params)
  {
    let url = this.apiurl+lurl;
    return this.http.post(url, params);
  }
}
