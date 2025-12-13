import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing';
import { RoomComponent } from './pages/room/room';


export const routes: Routes = [
  { path: '', component: LandingComponent },
  {
    path: 'room/:id',
    component: RoomComponent,
    data: { renderMode: 'server' }   // 👈 disables prerender for this route
  },
  { path: '**', redirectTo: '' },

];