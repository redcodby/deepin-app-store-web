import { Component, OnInit } from '@angular/core';
import { SectionItemBase } from '../section-item-base';
import { SoftwareService } from 'app/services/software.service';
import { KeyvalueService } from 'app/services/keyvalue.service';

@Component({
  selector: 'index-phrase',
  templateUrl: './phrase.component.html',
  styleUrls: ['./phrase.component.scss'],
})
export class PhraseComponent extends SectionItemBase implements OnInit {
  constructor(private softwareService: SoftwareService, private keyvalue: KeyvalueService) {
    super();
  }
  more: string;
  phrase = new Map<string, string>();
  ngOnInit() {
    this.more = 'more/' + this.keyvalue.add(this.section);
    this.init();
  }
  phraseData;
  async init() {
    const apps = this.section.items;
    this.phraseData = this.section.items;
    this.softs$ = this.softwareService
      .list({ ids: apps.filter(app => app.show).map(app => app.app_id) })
      .finally(() => this.loaded.emit(true));
  }
  handleData(id: number) {
    return this.phraseData.find(v => v.app_id === id).phrase;
  }
}
