import { IStorage } from "./types";
import { FirestoreStorage } from "./firestoreStorage";

// Use FirestoreStorage as requested by the user
export const storage: IStorage = new FirestoreStorage();
