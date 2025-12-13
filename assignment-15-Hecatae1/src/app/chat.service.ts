import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  query,
  orderBy,
  Timestamp,
  CollectionReference,
  DocumentData
} from '@angular/fire/firestore';

export interface ChatMessage {
  userName: string;
  message: string;
  timestamp: Timestamp;
  color?: string;
}
@Injectable({ providedIn: 'root' })
export class ChatService {
  private firestore = inject(Firestore);
  private messagesRef: CollectionReference<DocumentData> | null = null;

  // observable stream of messages
  mesgs$ = null as any;

  /** Call this when entering a room */
  setRoom(roomId: string) {
    this.messagesRef = collection(this.firestore, `rooms/${roomId}/chats`);
    this.mesgs$ = collectionData(
      query(this.messagesRef, orderBy('timestamp')),
      { idField: 'id' }
    ) as any;
  }

  // ✅ Updated to accept userId as well
  async submitNewMessage(userId: string, userName: string, message: string, color: string) {
    if (!this.messagesRef) {
      throw new Error('Room not set. Call setRoom(roomId) first.');
    }
    const safeColor = color && color.trim() !== '' ? color : '#000000';

    return addDoc(this.messagesRef, {
      userId,                // permanent identity
      userName,              // display handle
      message: message.trim(),
      color: safeColor,
      timestamp: Timestamp.fromDate(new Date())
    });
  }
}
