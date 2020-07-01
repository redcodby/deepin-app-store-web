import { Channel } from 'app/modules/client/utils/channel';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SysAuthService {
  noIntranetAuth$ = new BehaviorSubject(null);
  intranetAuthNotifyType: NotifyType;
  constructor() {
    this.getIntranetAuthState();
  }

  async getIntranetAuthState() {
    try {
      const resp = await Channel.exec<any>('settings.getIntranetAuthState');
      const result = JSON.parse(resp);
      // 注册状态
      const intranetAuthState = result.is_register === true;
      if (intranetAuthState !== true) {
        this.configIntranetAuthNotifyType(result);
      }
      this.noIntranetAuth$.next(intranetAuthState);
    } catch(e) {
      console.log('err', e);
      this.intranetAuthNotifyType = NotifyType.IntranetNotAuthorized;
      this.noIntranetAuth$.next(false);
    }
  }

  notifyIntranetFail() {
    Channel.exec('account.authorizationNotify', this.intranetAuthNotifyType);
  }

  configIntranetAuthNotifyType(result: any = {}) {
    if (result.code === 40005) {
      this.intranetAuthNotifyType = NotifyType.IntranetExceedLimit;
    } else {
      this.intranetAuthNotifyType = NotifyType.IntranetNotAuthorized;
    }
  }
}

enum NotifyType {
  ExtranetNotAuthorized,
  IntranetNotAuthorized,
  IntranetExceedLimit,
}
