import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { RouterLink, NavigationEnd } from '@angular/router';
import { collection, getDocs, deleteDoc, doc } from '@angular/fire/firestore';
import { ChatService } from '../../chat.service';

/**
 * LandingComponent
 * ----------------
 * This component represents the landing page of the chat app.
 * Responsibilities:
 *  - Allow the user to set their handle (locked once chosen) and color (can be changed anytime).
 *  - Manage the list of saved rooms in localStorage (sidebar persistence).
 *  - Provide entry points to join the public room, generate a new room ID, or join a custom room.
 *  - Delete rooms and their associated messages from Firestore.
 */


@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="app-shell">
    <h1>Chat</h1>

    <section class="landing">

<aside class="sidebar">
    <h2>My Rooms</h2>
    @if (rooms.length > 0) {
      <ul>
        @for (r of rooms; track r) {
          <li>
            <a [routerLink]="['/room', r]" [ngClass]="{ active: r === roomId }">
              {{ r }}
            </a>
            <button class="delete-btn" (click)="deleteRoom(r)">×</button>

          </li>
        }
      </ul>
    } @else {
      <p>No rooms yet. Create or join one above.</p>
    }
  </aside>
      <form (submit)="onJoinCustom($event)">
        <label>
          Handle:
          <input type="text" [(ngModel)]="handle" name="handle" required />
        </label>

        <label>
          Color:
          <input type="color" [(ngModel)]="color" name="color" />
        </label>

        <div class="actions">
          <button type="button" (click)="onJoinPublic()">Join Public Room</button>
        </div>

        <hr />

        <label>
          Room ID:
          <input type="text" [(ngModel)]="roomId" name="roomId" placeholder="Enter or generate" />
        </label>

        <div class="actions">
          <button type="button" (click)="generateId()">Generate Room-ID</button>
          <button type="button" (click)="onJoinCustom($event)">Join Room</button>
        </div>
      </form>



    </section>
  </div>
  `,
  styleUrl: './landing.styles.css'
})


export class LandingComponent implements OnInit {
  // Injected services
  platformId = inject(PLATFORM_ID);
  chat = inject(ChatService);

  // Local state
  rooms: string[] = [];   // list of saved rooms for sidebar
  handle = '';            // user handle (locked once set)
  color = '#3b82f6';      // user bubble color (default blue, can be changed)
  roomId = '';            // custom room ID input

  constructor(private router: Router) {
    // Refresh rooms list whenever navigation happens
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.loadRooms();
      }
    });
  }

  /**
   * Lifecycle hook: runs when component initializes.
   * - Loads saved rooms from localStorage
   * - Loads saved handle and color from localStorage
   * - Locks handle if already set
   */
  ngOnInit(): void {
    this.loadRooms();

    if (isPlatformBrowser(this.platformId)) {
      const savedHandle = localStorage.getItem('handle');
      const savedColor = localStorage.getItem('color');

      if (savedHandle) {
        // Handle already set, lock it
        this.handle = savedHandle;
      }
      if (savedColor) {
        this.color = savedColor;
      }
    }
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
   * Save user preferences (handle and color) to localStorage.
   * - Handle is locked: only set once, cannot be overwritten.
   * - Color can always be updated.
   */
  savePrefs(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (!localStorage.getItem('handle')) {
        localStorage.setItem('handle', this.handle.trim());
      } else {
        // Prevent overwriting handle
        this.handle = localStorage.getItem('handle')!;
      }

      // Color can always be updated
      localStorage.setItem('color', this.color);
    }
  }

  /**
   * Join the public room.
   * - Saves preferences
   * - Ensures 'public' room is saved in sidebar
   * - Navigates to /room/public
   */
  onJoinPublic(): void {
    if (!this.handle.trim()) return;
    this.savePrefs();
    this.saveRoom('public');
    this.router.navigate(['/room', 'public']);
  }

  /**
   * Generate a random room ID and save it.
   * - Uses base36 substring for short ID
   * - Saves preferences and room
   */
  generateId(): void {
    this.roomId = Math.random().toString(36).substring(2, 8);
    this.savePrefs();
    this.saveRoom(this.roomId);
  }

  /**
   * Join a custom room by ID.
   * - Saves preferences and room
   * - Navigates to /room/{roomId}
   */
  onJoinCustom(e: Event): void {
    e.preventDefault();
    if (!this.handle.trim() || !this.roomId.trim()) return;
    this.savePrefs();
    this.saveRoom(this.roomId);
    this.router.navigate(['/room', this.roomId]);
  }

  /**
   * Save a room ID into localStorage (sidebar persistence).
   * - Enforces max of 5 rooms.
   */
  saveRoom(roomId: string): void {
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
   * Delete a room completely.
   * - Removes all messages from Firestore
   * - Removes room from localStorage sidebar
   */
  async deleteRoom(roomId: string): Promise<void> {
    const confirmed = confirm(`Are you sure you want to delete room "${roomId}"?`);
    if (!confirmed) return;

    // Delete all messages in the room from Firestore
    const messagesRef = collection(this.chat['firestore'], `rooms/${roomId}/chats`);
    const snapshot = await getDocs(messagesRef);
    snapshot.forEach(async (msg) => {
      await deleteDoc(doc(messagesRef, msg.id));
    });

    // Remove from localStorage sidebar
    let updated = this.rooms.filter(r => r !== roomId);
    localStorage.setItem('rooms', JSON.stringify(updated));
    this.rooms = updated;
  }
}