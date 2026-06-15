'use client';

import { CollectionCard } from '@/types';

const STORAGE_KEY = 'card-scanner-collection';

export function getCollection(): CollectionCard[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCollection(cards: CollectionCard[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export function addToCollection(card: CollectionCard): void {
  const collection = getCollection();
  const existing = collection.findIndex(
    (c) => c.productId === card.productId && c.condition === card.condition
  );
  if (existing >= 0) {
    collection[existing].quantity += card.quantity;
  } else {
    collection.push(card);
  }
  saveCollection(collection);
}

export function removeFromCollection(productId: number): void {
  const collection = getCollection().filter((c) => c.productId !== productId);
  saveCollection(collection);
}

export function updateQuantity(productId: number, quantity: number): void {
  const collection = getCollection();
  const card = collection.find((c) => c.productId === productId);
  if (card) {
    card.quantity = quantity;
    saveCollection(collection);
  }
}

export function isInCollection(productId: number): boolean {
  return getCollection().some((c) => c.productId === productId);
}

export function getCollectionStats(): { totalCards: number; totalValue: number; uniqueCards: number } {
  const collection = getCollection();
  const totalCards = collection.reduce((sum, c) => sum + c.quantity, 0);
  const totalValue = collection.reduce((sum, c) => sum + (c.marketPrice ?? 0) * c.quantity, 0);
  const uniqueCards = collection.length;
  return { totalCards, totalValue, uniqueCards };
}
