import { Channel } from 'app/modules/client/utils/channel';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SysAuthService {
  noIntranetAuth$ = new BehaviorSubject(null);

  constructor() {
    this.getIntranetAuthState();
   }

  async getIntranetAuthState() {
    const resp = await Channel.exec<any>('settings.getIntranetAuthState');
    const intranetAuthState = resp === true;
    this.noIntranetAuth$.next(intranetAuthState);
  }

  notifyIntranetFail() {
    Channel.exec('account.authorizationNotify', NotifyTpye.IntranetNotAuthorized);
  }

}

enum NotifyTpye {
  ExtranetNotAuthorized,
  IntranetNotAuthorized,
}
