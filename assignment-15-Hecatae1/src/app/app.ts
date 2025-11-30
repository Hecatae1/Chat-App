import { Component, signal, inject, PLATFORM_ID, NgModule } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatService } from './chat.service';
import { AsyncPipe, CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, RouterOutlet, CommonModule, AsyncPipe],
  template: `
    <h1> {{ title() }}!</h1>
    <div class="container">

  <header>

    <label>
      Handle:
      <input [(ngModel)]="userName" (change)="saveUserName()" />
    </label>

    <label>
      Color:
      <input type="color" [(ngModel)]="color" (change)="saveColor()" />
    </label>
  </header>

  <main>
@for (mesg of (chat.mesgs$ | async) ?? []; track mesg.id)  {
  <div class="message">
    <span [style.color]="mesg.color ?? '#22eeff'">
      {{ mesg.timestamp.toDate() | date:'medium' }} —
      <strong>{{ mesg.userName }}</strong>:
      {{ mesg.message }}
    </span>
  </div>
}

  </main>

  <footer>
   <input
      [(ngModel)]="message"
      (keyup.enter)="sendMessage()"
      placeholder="Type a message…"
  />

    <button (click)="sendMessage()" class="send-btn">➤</button>

  </footer>

</div>

<router-outlet />
  `,
  styleUrl: '../styles.css'
})
export class App {
  title = signal('assignment-15-Hecatae1');

  chat = inject(ChatService);
  platformId = inject(PLATFORM_ID);

  userName = '';
  color = '#000000';


  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const storedColor = localStorage.getItem('color');
      this.color = storedColor && storedColor.trim() !== ''
        ? storedColor
        : '#000000';
    }
  }

  saveColor() {
    if (isPlatformBrowser(this.platformId)) {
      if (!this.color || this.color.trim() === '') {
        this.color = '#000000';
      }
      localStorage.setItem('color', this.color);
    }
  }

  saveUserName() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('userName', this.userName);
    }
  }



  message: string = '';

  async sendMessage() {
    if (!this.message || !this.message.trim()) return;
    await this.chat.submitNewMessage(this.userName, this.message, this.color);
    this.message = ''; // clear after sending
  }

}
