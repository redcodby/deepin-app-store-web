import { Component, OnInit, Input, OnChanges, ViewChild, ElementRef } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { first, flatMap } from 'rxjs/operators';

import * as _ from 'lodash';

import smoothScrollIntoView from 'smooth-scroll-into-view-if-needed';

import { AuthService, UserInfo } from 'app/services/auth.service';
import { CommentService, AppComment } from '../../services/comment.service';
import { switchMap, filter, tap } from 'rxjs/operators';
import { APIBase } from 'app/services/api';
import { FormBuilder, Validators, FormGroup, FormArray, FormGroupName } from '@angular/forms';

enum CommentType {
  News,
  History,
}
export enum CommentError {
  Unknown,
  RateInvalid,
  CommentInvalid,
  AllInvalid,
  Failed,
}

@Component({
  selector: 'dstore-app-comment',
  templateUrl: './app-comment.component.html',
  styleUrls: ['./app-comment.component.scss'],
  animations: [
    trigger('myComment', [
      state('in', style({ transform: 'scaleY(1)', opacity: 1 })),
      transition('void => in', [
        style({
          transform: 'scaleY(0)',
          opacity: 0,
        }),
        animate(200),
      ]),
    ]),
  ],
})
export class AppCommentComponent implements OnInit {
  constructor(
    private domSanitizer: DomSanitizer,
    private authService: AuthService,
    private commentService: CommentService,
    private auth: AuthService,
    private fb: FormBuilder,
  ) {}
  @ViewChild('commentRef', { static: true }) commentRef: ElementRef<HTMLDivElement>;
  @Input()
  appID: number;
  @Input()
  version: string;

  content = this.fb.control('', Validators.required);
  score = this.fb.control(0, Validators.min(0.5));
  submitted = this.fb.control(null);
  commentGroup = this.fb.group({
    content: this.content,
    score: this.score,
    submitted: this.submitted,
  });

  loading = true;
  loadCount = 0;
  info: UserInfo;
  info$ = this.auth.info$;
  own: AppComment;

  CommentType = CommentType;
  CommentError = CommentError;
  haveNewComment = false;
  total: { [key: number]: number } = {};
  select = CommentType.News;
  list: AppComment[];
  page = { index: 0, size: 20 };

  login = () => this.authService.login();
  logout = () => this.authService.logout();

  register = () => this.authService.register();

  get publicAPI() {
    return this.commentService.publicAPI(this.appID);
  }
  get userAPI() {
    return this.commentService.userAPI(this.appID);
  }
  // comment first page size
  get firstPageSize() {
    return this.total[this.select] % this.page.size;
  }
  get selectVersion() {
    if (this.select === CommentType.News) {
      return { version: this.version };
    }
    return { exclude_version: this.version };
  }

  ngOnInit() {
    this.init();
  }
  async init() {
    await this.getCount();
    this.selectChange(CommentType.News);
  }
  async getCount() {
    {
      const resp = await this.publicAPI.list({ limit: 1, version: this.version });
      this.total[CommentType.News] = resp.count;
    }
    {
      const resp = await this.publicAPI.list({ limit: 1, exclude_version: this.version });
      this.total[CommentType.History] = resp.count;
    }
  }
  async selectChange(select: CommentType) {
    this.select = select;
    await this.pageChange(0);
  }
  async pageChange(page: number) {
    this.page.index = page;
    await this.getComments();
    this.commentTop();
  }
  async getComments() {
    if (this.total[this.select] === 0) {
      await this.getCount();
      if (this.total[this.select] === 0) {
        this.list = [];
        this.loading = false;
        return;
      }
    }
    this.loadCount++;
    const mark = this.loadCount;
    this.loading = true;
    const opt = {
      limit: 20,
      offset: (Math.ceil(this.total[this.select] / this.page.size) - (this.page.index + 1)) * this.page.size,
      ...this.selectVersion,
    };
    // get comment list
    const resp = await this.publicAPI.list(opt);
    if (this.firstPageSize > 0) {
      if (opt.offset > 0) {
        opt.offset -= this.page.size;
        if (opt.offset < 0) {
          opt.offset = 0;
        }
        const nextResp = await this.publicAPI.list(opt);
        resp.items = [...resp.items, ...nextResp.items];
      }
      if (this.page.index !== 0) {
        resp.items = resp.items.slice(this.page.size - this.firstPageSize);
      }
      resp.items.slice(0, this.page.size);
    }
    if (this.page.index === 0) {
      // get hot comment
      const topResp = await this.publicAPI.list({ top: true, ...this.selectVersion });
      topResp.items.forEach(item => {
        item.isHot = true;
        const index = resp.items.findIndex(c => c.id === item.id);
        if (index !== -1) {
          resp.items.splice(index, 1);
        }
      });
      resp.items = [...topResp.items, ...resp.items];

      const info = await this.info$.pipe(first()).toPromise();
      if (info) {
        console.log(info);
        const userResp = await this.userAPI.list({ app_id: this.appID, ...this.selectVersion });
        if (this.select === CommentType.News) {
          this.own = userResp.items[0];
        }
        resp.items = [...userResp.items, ...resp.items.filter(c => c.commenter !== info.uid)];
      }
    }
    if (this.loadCount === mark) {
      this.list = resp.items;
      this.loading = false;
    }
  }
  async submitComment() {
    const content = this.commentGroup.get('content');
    content.setValue(content.value.trim());
    this.commentGroup.markAllAsTouched();
    if (this.commentGroup.invalid) {
      return;
    }
    try {
      this.commentGroup.disable();
      await this.userAPI.post({ app_id: this.appID, content: this.content.value, score: this.score.value });
      this.haveNewComment = true;
      await this.selectChange(CommentType.News);
      setTimeout(() => (this.haveNewComment = false), 1000);
      this.commentGroup.reset();
    } catch {
      this.commentGroup.setErrors({ error: true });
      this.commentGroup.enable();
    }
  }
  async thumbUpClick(c: AppComment) {
    const info = await this.info$.pipe(first()).toPromise();
    const by = c.likes.findIndex(like => like.liker === info.uid);
    if (by === -1) {
      await this.commentService.like(c.id).toPromise();
      c.likes.push({ liker: info.uid });
    } else {
      await this.commentService.dislike(c.id).toPromise();
      c.likes.splice(by, 1);
    }
  }
  commentTop() {
    smoothScrollIntoView(this.commentRef.nativeElement, {
      scrollMode: 'if-needed',
      block: 'start',
    });
  }
  scrollToTop() {
    smoothScrollIntoView(document.querySelector('.appInfo'), {
      block: 'start',
    });
  }
  likeByMe(likes: { liker: number }[], uid: number) {
    return likes.find(like => like.liker === uid);
  }
}
