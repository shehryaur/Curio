'use client'
import { useEffect, useState } from 'react'
import { getSavedCards, saveCard, subscribeCards, type SavedCard } from '@/lib/cards'

export function useSavedCards() {
  const [cards, setCards] = useState<SavedCard[]>(() => getSavedCards())

  useEffect(() => {
    setCards(getSavedCards())
    return subscribeCards(() => setCards(getSavedCards()))
  }, [])

  return {
    cards,
    count: cards.length,
    save: saveCard,
  }
}
