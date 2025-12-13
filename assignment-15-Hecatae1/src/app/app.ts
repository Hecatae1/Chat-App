import { Component, signal, inject, PLATFORM_ID, NgModule } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AsyncPipe, CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, RouterOutlet, CommonModule],
  template: `

<router-outlet ></router-outlet>
  `,
  styleUrl: '../styles.css'
})
export class App { }