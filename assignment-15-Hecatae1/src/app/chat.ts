import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, query, orderBy, Timestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface FirestoreRec {
  userName: string;
  message: string;
  timestamp: Timestamp;
  color?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Chat {

  public mesgs$: Observable<FirestoreRec[]>;

  private chatCollection;

  constructor(private firestore: Firestore) {
    // reference to the Firestore collection
    this.chatCollection = collection(this.firestore, 'cs336-chat');

    // query for messages ordered by time
    const q = query(this.chatCollection, orderBy('timestamp'));

    // observable stream of messages
    this.mesgs$ = collectionData(q, { idField: 'id' }) as Observable<FirestoreRec[]>;
  }

  async submitNewMessage(userName: string, message: string, color: string) {
    if (!message.trim()) return;

    await addDoc(this.chatCollection, {
      userName,
      message,
      color,
      timestamp: new Date(),   // professor's instructions (even though Firestore timestamp is better)
    });
  }
}
