import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  query,
  orderBy,
  Timestamp
} from '@angular/fire/firestore';

export interface ChatMessage {
  userName: string;
  message: string;
  timestamp: Timestamp;
  color?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private firestore = inject(Firestore);
  private messagesRef = collection(this.firestore, 'cs336-chat');

  // 🔥 use your expected name: mesgs$
  mesgs$ = collectionData(
    query(this.messagesRef, orderBy('timestamp')),
    { idField: 'id' }
  ) as any;

  async submitNewMessage(userName: string, message: string, color: string) {
    const safeColor = color && color.trim() !== '' ? color : '#000000';
    return addDoc(this.messagesRef, {
      userName,
      message,
      color,
      timestamp: Timestamp.fromDate(new Date())
    });

  }
}
