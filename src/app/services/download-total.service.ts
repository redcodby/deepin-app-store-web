import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { first } from 'rxjs/operators';

import { environment } from 'environments/environment';
import { AuthService } from './auth.service';
import { Software } from './software.service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DownloadTotalService {
  server = environment.operationServer;
  installCount$ = new Subject<Software>();
  constructor(private http: HttpClient, private auth: AuthService) {}

  installed(apps: Software[]) {
    if (!Array.isArray(apps) || !apps.length) {
      return;
    }
    for (let i = 0; i < apps.length; i++) {
      this.installCount$.next(apps[i]);
    }
    this.auth.logged$.pipe(first()).subscribe(logged => {
      if (!logged) {
        this.downloadTotal(apps[0]);
        return;
      }
      this.userDownloadTotal(apps[0]);
    });
  }
  // 访客下载统计
  private downloadTotal(app: Software) {
    const url = '/api/public/download';
    this.http
      .post(url, {
        app_id: app.id,
        app_version: app.package.remoteVersion||app.package.localVersion,
      })
      .subscribe();
  }
  // 用户下载统计
  private userDownloadTotal(app: Software) {
    const url = '/api/user/download';
    this.http
      .post(url, {
        app_id: app.id,
        app_version: app.package.remoteVersion||app.package.localVersion,
      })
      .subscribe();
  }
  // // 记录云端应用
  // private addUserApps(apps: Software[]) {
  //   const userApps = apps.map(app => {
  //     return {
  //       appName: app.name,
  //       version: app.package.remoteVersion,
  //     };
  //   });
  //   const url = this.server + '/api/user/my/app';
  //   this.http.post(url, userApps).subscribe();
  // }
  // // 同步安装,记录软件下载统计
  // private async installApps(apps: Software[]) {
  //   const url = this.server + '/api/user/app/install';
  //   const params = {};
  //   const auto = await Channel.exec<Boolean>('settings.getAutoInstall');
  //   if (auto) {
  //     params['sync'] = 'true';
  //   }
  //   const install = apps.map(app => {
  //     return {
  //       appName: app.name,
  //       packageURLs: app.info.packages.map(pkg => pkg.packageURI),
  //     };
  //   });
  //   return this.http.post(url, { install }, { params }).toPromise();
  // }
}
