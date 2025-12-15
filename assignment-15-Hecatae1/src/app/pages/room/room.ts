import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PLATFORM_ID, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ChatService } from '../../chat.service';
import { RouterLink, NavigationEnd, Router } from '@angular/router';
import { getDoc, collection, getDocs, deleteDoc, doc } from '@angular/fire/firestore';
import { LinkifyPipe } from '../../linkify-pipe';
/**
 * RoomComponent
 * -------------
 * This component represents a single chat room.
 * It handles:
 *  - Loading and saving room IDs to localStorage (sidebar persistence)
 *  - Managing the current user's identity (userId, handle, color)
 *  - Sending and deleting messages via ChatService
 *  - Deleting entire rooms (including Firestore history)
 */


@Component({
  selector: 'app-room',
  standalone: true,
  imports: [CommonModule, FormsModule, AsyncPipe, RouterLink, LinkifyPipe],
  template: `
   <div class="app-shell">
  <aside class="sidebar">
   <button class="back-btn" (click)="router.navigate(['/'])">
      ←
    </button>

    <h2>Rooms</h2>
    <ul>
        @for (r of rooms; track r) {
          <li>
            <a [routerLink]="['/room', r]" [ngClass]="{ active: r === roomId }">
              {{ r }}
            </a>
<button (click)="handleDelete(roomId)" class="delete-btn" title="Delete room">
  ✖
</button>



          </li>
        }
      </ul>
      <div class="add-room-container">
      <button class="add-room-btn" (click)="router.navigate(['/'])">
        + Add Room
      </button>
    </div>

  </aside>

  <section class="chat-area">
    <header class="chat-header">
      <span>Room: {{ roomId }}</span>
      <span>
        Handle: <strong>{{ userName }}</strong>
        <span [style.color]="color">●</span>
      </span>
      <button (click)="copyLink()">Copy Link</button>
    </header>

    <main class="chat-messages">
      @for (mesg of (chat.mesgs$ | async) ?? []; track mesg.id) {
        <div class="message" [ngClass]="{ mine: mesg.userId === currentUser.userId }">
          <div class="bubble" [style.borderColor]="mesg.color ?? '#22eeff'">
            <div class="meta">
              <span [style.color]="mesg.color ?? '#22eeff'">
                <strong>{{ mesg.userName }}</strong>
              </span>
              <span class="time">{{ mesg.timestamp.toDate() | date:'shortTime' }}</span>
            </div>
            <div class="text" [innerHTML]="mesg.message | linkify"></div>

          </div>
        </div>
      }
    </main>

    <footer class="chat-footer">
      <input
        [(ngModel)]="message"
        (keyup.enter)="sendMessage()"
        placeholder="Type a message…"
      />
      <button (click)="sendMessage()" class="send-btn">➤</button>
    </footer>
  </section>
</div>
  `,
  styleUrls: ['./room.styles.css']
})


export class RoomComponent implements OnInit {
  // Injected services
  chat = inject(ChatService);
  platformId = inject(PLATFORM_ID);
  route = inject(ActivatedRoute);
  router = inject(Router);

  // Local state
  rooms: string[] = [];   // list of saved rooms for sidebar
  roomId = '';            // current room ID
  userName = '';          // current user's handle
  color = '#000000';      // current user's bubble color
  message = '';           // message input field

  /**
   * Current user identity object.
   * - userId: permanent unique identifier (UUID stored in localStorage)
   * - userName: handle chosen once and locked
   * - color: bubble color (can be changed anytime)
   */
  currentUser = {
    userId: '',
    userName: '',
    color: '#000000'
  };

  /**
   * Lifecycle hook: runs when component initializes.
   * - Loads room from route params
   * - Initializes current user identity from localStorage
   * - Ensures room list is updated
   * - Subscribes to router events to refresh sidebar
   */
  ngOnInit(): void {
    // Get room ID from route
    this.route.paramMap.subscribe(params => {
      this.roomId = params.get('id') ?? 'public';
      this.chat.setRoom(this.roomId);
      this.saveRoom(this.roomId);
      this.loadRooms();
    });

    // Only run in browser (not SSR)
    if (isPlatformBrowser(this.platformId)) {
      const storedHandle = localStorage.getItem('handle');
      const storedColor = localStorage.getItem('color');
      const storedId = localStorage.getItem('userId');

      // Generate permanent userId if none exists
      if (!storedId) {
        const newId = crypto.randomUUID();
        localStorage.setItem('userId', newId);
        this.currentUser.userId = newId;
      } else {
        this.currentUser.userId = storedId;
      }

      // Handle is locked: only set once
      if (storedHandle) {
        this.userName = storedHandle;
        this.currentUser.userName = storedHandle;
      } else {
        // Prompt user to set handle if none exists
        const chosenHandle = prompt('Enter your chat handle (cannot be changed later):');
        if (chosenHandle && chosenHandle.trim() !== '') {
          localStorage.setItem('handle', chosenHandle.trim());
          this.userName = chosenHandle.trim();
          this.currentUser.userName = chosenHandle.trim();
        } else {
          alert('A handle is required to join the chat.');
        }
      }

      // Color can be updated anytime
      if (storedColor) {
        this.color = storedColor;
        this.currentUser.color = storedColor;
      }
    }

    // Save and load rooms for sidebar
    this.saveRoom(this.roomId);
    this.loadRooms();

    // Refresh sidebar whenever navigation happens
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.loadRooms();
      }
    });

    // Tell ChatService which room to use
    this.chat.setRoom(this.roomId);
  }

  /**
   * Load rooms list from localStorage into component state.
   */
  private loadRooms(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.rooms = JSON.parse(localStorage.getItem('rooms') ?? '[]');
    }
  }

  /**
   * Save a room ID into localStorage (sidebar persistence).
   * - Enforces max of 5 rooms.
   */
  private saveRoom(roomId: string): void {
    if (isPlatformBrowser(this.platformId)) {
      let rooms = JSON.parse(localStorage.getItem('rooms') ?? '[]');
      if (!rooms.includes(roomId)) {
        if (rooms.length >= 5) {
          alert('You can only keep up to 5 rooms in your sidebar.');
          return;
        }
        rooms.push(roomId);
        localStorage.setItem('rooms', JSON.stringify(rooms));
        this.rooms = rooms;
      }
    }
  }

  /**
   * Copy current room link to clipboard.
   */
  copyLink(): void {
    navigator.clipboard.writeText(window.location.href);
    alert('Room link copied!');
  }

  /**
   * Send a new message to the current room.
   * - Uses ChatService to push message to Firestore
   * - Includes userId, userName, and color for identity
   */
  async sendMessage(): Promise<void> {
    if (!this.message.trim()) return;
    await this.chat.submitNewMessage(
      this.currentUser.userId,
      this.currentUser.userName,
      this.message,
      this.currentUser.color
    );
    this.message = ''; // clear input after sending
  }



  async handleDelete(roomId: string): Promise<void> {
    // Step 1: Ask for confirmation
    const confirmed = confirm(`Do you want to delete room "${roomId}"?`);
    if (!confirmed) return;

    // Step 2: Update UI immediately (localStorage + sidebar)
    let updated = this.rooms.filter(r => r !== roomId);
    localStorage.setItem('rooms', JSON.stringify(updated));
    this.rooms = updated;

    // Step 3: Redirect if you were in the deleted room
    if (this.roomId === roomId) {
      if (this.rooms.length > 0) {
        this.router.navigate(['/room', this.rooms[0]]);
      } else {
        this.router.navigate(['/landing']);
      }
    }

    // Step 4: Check if current user is the creator
    const roomDoc = doc(this.chat['firestore'], 'rooms', roomId);
    const roomSnap = await getDoc(roomDoc);

    if (roomSnap.exists()) {
      const createdBy = roomSnap.data()['createdBy'];
      if (createdBy === this.currentUser.userId) {
        // Admin/creator → extra alert
        alert(`Room "${roomId}" will be removed for ALL users.`);

        // Firestore cleanup (async, doesn’t block UI)
        const messagesRef = collection(this.chat['firestore'], `rooms/${roomId}/chats`);
        const snapshot = await getDocs(messagesRef);
        snapshot.forEach(async (msg) => {
          await deleteDoc(doc(messagesRef, msg.id));
        });

        await deleteDoc(roomDoc);
      }
      // Non‑creator → nothing else to do (soft delete already handled)
    }
  }
}