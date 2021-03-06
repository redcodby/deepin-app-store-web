import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuardService } from './services/auth-guard.service';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'index',
    pathMatch: 'full',
  },
  // home page
  {
    path: 'index',
    loadChildren: () => import('app/modules/index/index.module').then(m => m.IndexModule),
  },
  // detail page
  {
    path: 'app/:id',
    loadChildren: () => import('app/modules/details/details.module').then(m => m.DetailsModule),
  },
  // list page
  {
    path: 'list/:name/:value',
    loadChildren: () => import('app/modules/list/list.module').then(m => m.ListModule),
  },
  // download
  {
    path: 'download',
    loadChildren: () => import('app/modules/download/download.module').then(m => m.DownloadModule),
  },
  {
    path: 'my/updates',
    loadChildren: () => import('app/modules/my-updates/my-updates.module').then(m => m.MyUpdatesModule),
  },
  {
    path: 'my/apps',
    loadChildren: () => import('app/modules/my-apps/my-apps.module').then(m => m.MyAppsModule),
  },
  {
    path: 'my/comments',
    loadChildren: () => import('app/modules/my-comments/my-comments.module').then(m => m.MyCommentsModule),
    canActivate: [AuthGuardService],
  },
  {
    path: 'my/donates',
    loadChildren: () => import('app/modules/my-donates/my-donates.module').then(m => m.MyDonatesModule),
    canActivate: [AuthGuardService],
  },
  // 404
  {
    path: "**",
    redirectTo: "index",
  },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
