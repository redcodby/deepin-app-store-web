import { Component, OnInit } from '@angular/core';
import { SoftwareService } from 'app/services/software.service';
import { SectionItemBase } from '../section-item-base';

@Component({
  selector: 'index-ranking',
  templateUrl: './ranking.component.html',
  styleUrls: ['./ranking.component.scss'],
})
export class RankingComponent extends SectionItemBase implements OnInit {
  constructor(private softwareService: SoftwareService) {
    super();
  }
  ngOnInit() {
    this.load().finally(() => {
      this.loaded.emit(true);
    });
  }
  async load() {
    const ranking = this.section.items || { top: 10 };
    let softs = [];

    for (let offset = 0; softs.length < ranking[0].top; offset += 10) {
      const list = await this.softwareService.list({}, { order: 'download', offset, limit: 10 });
      if (list.length === 0) {
        break;
      }
      softs = [...softs, ...list].slice(0, ranking[0].top);
    }
    this.softs$ = Promise.resolve(softs);
  }
}
