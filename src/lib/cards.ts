'use client'
// Storage for discovered object cards ("My cards" / "Deck").
import type { ByMode, ObjectLesson, TemplateId } from './types'
import { getTemplateLesson, TEMPLATES } from './templates'

export interface SavedCard {
  id: string
  title: ByMode | string
  emoji: string
  color: string
  discoveredAt: number
  kind: 'template' | 'photo'
  templateId?: TemplateId
  photoUrl?: string | null
  lesson: ObjectLesson
  isFavorite?: boolean
}

const KEY = 'curio.saved_cards'

export const CARD_COLORS = [
  '#C2410C', // Volcano burnt orange
  '#1E293B', // Deep navy
  '#EAB308', // Honeybee golden
  '#EA580C', // Autumn leaf orange
  '#7C3AED', // Octopus purple
  '#0F766E', // Seashell teal
  '#0284C7', // Sky blue
  '#D97706', // Antique amber
  '#4F46E5', // Indigo
  '#059669', // Emerald
]

function getInitialStarterCards(): SavedCard[] {
  const now = Date.now()
  const starters: SavedCard[] = [
    {
      id: 'autumn-leaf',
      title: {
        child: 'Autumn leaf',
        teen: 'Autumn leaf',
        adult: 'Deciduous leaf',
        plainWords: 'Autumn leaf',
      },
      emoji: '🍂',
      color: '#EA580C',
      discoveredAt: now - 3600_000 * 4,
      kind: 'photo',
      photoUrl: null,
      lesson: {
        id: 'autumn-leaf',
        kind: 'photo',
        source: 'gemini',
        title: { child: 'Autumn leaf', teen: 'Autumn leaf', adult: 'Deciduous leaf', plainWords: 'Autumn leaf' },
        emoji: '🍂',
        intro: {
          child: "Meet Rusty the Leaf! When chilly winds whisper, leaves put on cozy orange coats!",
          teen: "As days get shorter, trees break down chlorophyll and reveal brilliant carotenoids and anthocyanins.",
          adult: "Photoprotective nutrient recovery: nitrogen resorption and anthocyanin synthesis in deciduous foliage.",
          plainWords: "Let's look at why leaves change color in autumn.",
        },
        causeAndEffect: 'Cold & shorter days -> Chlorophyll fades -> Warm colors show',
        parts: [
          {
            id: 'p1',
            name: { child: 'Coat', teen: 'Leaf blade', adult: 'Lamina', plainWords: 'The leaf' },
            short: { child: 'The colorful flat part', teen: 'Catches sunlight for energy', adult: 'Primary photosynthetic surface', plainWords: 'The flat leaf' },
            learn: {
              child: 'The big flat leaf catches sunshine all summer long!',
              teen: 'Contains cells packed with chloroplasts that convert light into carbohydrates.',
              adult: 'High surface-area-to-volume ratio engineered for maximum photon capture.',
              plainWords: 'This is the main flat part of the leaf.',
            },
            anchor: [0, 0.2, 0.8],
          },
          {
            id: 'p2',
            name: { child: 'Veins', teen: 'Vein network', adult: 'Vascular bundles', plainWords: 'Little lines' },
            short: { child: 'Carries water and food', teen: 'Xylem and phloem pipes', adult: 'Vascular fluid transport system', plainWords: 'Water paths' },
            learn: {
              child: 'Little veins drink up water like tiny drinking straws!',
              teen: 'Veins transport water up from roots and sugars down to the branches.',
              adult: 'Xylem transports water and minerals; phloem translocates photosynthates.',
              plainWords: 'These lines carry water through the leaf.',
            },
            anchor: [0, -0.1, 0.8],
          },
          {
            id: 'p3',
            name: { child: 'Stem', teen: 'Petiole & seal', adult: 'Abscission zone', plainWords: 'The stem' },
            short: { child: 'Holds onto the branch', teen: 'Seals off before falling', adult: 'Cellular abscission boundary', plainWords: 'The stem' },
            learn: {
              child: 'When it is time to dance, the stem lets go gently!',
              teen: 'A layer of cork cells forms at the base, sealing the branch before the leaf drops.',
              adult: 'Ethylene triggers cell wall digestion in the abscission zone, separating petiole from stem.',
              plainWords: 'This little stem attaches the leaf to the tree branch.',
            },
            anchor: [0, -0.6, 0.8],
          },
        ],
        quiz: [
          {
            id: 'q1',
            answerPartId: 'p1',
            prompt: {
              child: 'Why do leaves change color?',
              teen: 'What causes the green color to disappear in autumn?',
              adult: 'What initiates seasonal senescence?',
              plainWords: 'What happens to the leaf in autumn?',
            },
            hint: { child: 'The green coat fades away!', teen: 'Chlorophyll breaks down', adult: 'Chlorophyll degradation', plainWords: 'The green fades' },
            praise: { child: 'Yay! The green fades away to show the warm colors!', teen: 'Correct! Chlorophyll breakdown reveals carotenoids.', adult: 'Accurate: chlorophyll resorption exposes accessory pigments.', plainWords: 'Well done! That is correct.' },
          },
        ],
      },
    },
    {
      id: 'the-moon',
      title: { child: 'The Moon', teen: 'The Moon', adult: 'Lunar satellite', plainWords: 'The Moon' },
      emoji: '🌙',
      color: '#1E293B',
      discoveredAt: now - 3600_000 * 24,
      kind: 'photo',
      photoUrl: null,
      lesson: {
        id: 'the-moon',
        kind: 'photo',
        source: 'gemini',
        title: { child: 'The Moon', teen: 'The Moon', adult: 'Earth Moon', plainWords: 'The Moon' },
        emoji: '🌙',
        intro: {
          child: "The Moon is Earth's best friend in the night sky, bouncing bright sunlight down to us!",
          teen: "Our natural satellite reflects sunlight and pulls Earth's oceans to create ocean tides.",
          adult: "Tidally-locked rocky satellite orbiting at ~384,400 km, governing terrestrial tidal harmonics.",
          plainWords: "Let's explore how the Moon shines and moves.",
        },
        causeAndEffect: 'Sunlight -> Bounces off Moon -> Glows in night sky',
        parts: [
          {
            id: 'p1',
            name: { child: 'Craters', teen: 'Impact craters', adult: 'Impact basins', plainWords: 'Round craters' },
            short: { child: 'Giant footprints from space rocks', teen: 'Evidence of meteorite impacts', adult: 'Kinetic meteorite excavation scars', plainWords: 'Craters' },
            learn: {
              child: 'Space rocks bumped into the Moon long ago and made round bowls!',
              teen: 'Without an atmosphere or weather, impact craters stay preserved for billions of years.',
              adult: 'Vacuum surface conditions preserve ancient bombardment records indefinitely.',
              plainWords: 'These round marks were made by space rocks long ago.',
            },
            anchor: [-0.2, 0.3, 0.8],
          },
          {
            id: 'p2',
            name: { child: 'Dark Seas', teen: 'Lunar Maria', adult: 'Basaltic plains', plainWords: 'Dark spots' },
            short: { child: 'Dark volcanic plains', teen: 'Ancient cooled basalt lava', adult: 'Solidified basaltic magma flows', plainWords: 'Dark areas' },
            learn: {
              child: 'Ancient lava cooled into smooth dark plains that look like seas!',
              teen: 'Early volcanic activity filled large basins with iron-rich basaltic lava.',
              adult: 'Extensive flood basalt volcanism formed low-albedo plains across the nearside.',
              plainWords: 'These dark patches are ancient volcanic rock.',
            },
            anchor: [0.1, -0.1, 0.8],
          },
          {
            id: 'p3',
            name: { child: 'Moon Dust', teen: 'Regolith dust', adult: 'Lunar regolith', plainWords: 'Moon dust' },
            short: { child: 'Tiny sharp space sand', teen: 'Micro-shattered meteorite dust', adult: 'Micrometeorite-comminuted regolith', plainWords: 'Surface dust' },
            learn: {
              child: 'Footprints in the moon dust can stay there forever because there is no wind!',
              teen: 'Fine glass-like dust covers the surface, created by millions of micrometeoroid impacts.',
              adult: 'Abrasive, highly-electrostatic pulverized silicate particles forming a 4-15m blanket.',
              plainWords: 'A powdery dust covers the entire surface of the Moon.',
            },
            anchor: [0, -0.5, 0.8],
          },
        ],
        quiz: [
          {
            id: 'q1',
            answerPartId: 'p2',
            prompt: {
              child: 'Can you tap the dark spots on the Moon?',
              teen: 'Which areas are ancient basaltic lava plains?',
              adult: 'Identify the lunar maria.',
              plainWords: 'Tap the dark area of the Moon.',
            },
            hint: { child: 'The dark patches called seas!', teen: 'The dark maria', adult: 'Basaltic maria', plainWords: 'The dark spots' },
            praise: { child: 'Awesome! You found the ancient lunar seas!', teen: 'Correct! The maria are smooth basalt plains.', adult: 'Confirmed: basaltic lunar maria.', plainWords: 'Great job! That is correct.' },
          },
        ],
      },
    },
    {
      id: 'honeybee',
      title: { child: 'Honeybee', teen: 'Honeybee', adult: 'Apis mellifera', plainWords: 'Honeybee' },
      emoji: '🐝',
      color: '#EAB308',
      discoveredAt: now - 3600_000 * 48,
      kind: 'photo',
      photoUrl: null,
      lesson: {
        id: 'honeybee',
        kind: 'photo',
        source: 'gemini',
        title: { child: 'Honeybee', teen: 'Honeybee', adult: 'Honeybee (Apis)', plainWords: 'Honeybee' },
        emoji: '🐝',
        intro: {
          child: "Bzz! Bees fly from flower to flower doing a waggle dance to tell friends where sweet nectar is!",
          teen: "Honeybees are nature's supreme pollinators, using complex waggle dances to navigate by polarized light.",
          adult: "Eusocial hymenopteran vital to agricultural pollination, communicating vector coordinates via waggle dances.",
          plainWords: "Let's explore how honeybees fly, work, and make honey.",
        },
        causeAndEffect: 'Flower visits -> Pollen transfers -> Plants grow fruit',
        parts: [
          {
            id: 'p1',
            name: { child: 'Fast Wings', teen: 'Wings & flight muscles', adult: 'Flight wings', plainWords: 'Wings' },
            short: { child: 'Flaps 230 times per second', teen: 'High-frequency aerodynamic flapping', adult: 'Asynchronous flight muscle actuation', plainWords: 'Fast wings' },
            learn: {
              child: 'Their tiny wings flap super fast to make the famous buzz sound!',
              teen: 'Bees beat wings 230 times a second, creating miniature vortices for extraordinary lift.',
              adult: 'High wingbeat frequency combined with short amplitude enables agile hovering and payload transport.',
              plainWords: 'These wings flap quickly so the bee can fly.',
            },
            anchor: [0, 0.4, 0.8],
          },
          {
            id: 'p2',
            name: { child: 'Pollen Baskets', teen: 'Corbiculae (pollen baskets)', adult: 'Corbicula apparatus', plainWords: 'Pollen pockets' },
            short: { child: 'Pockets for flower dust', teen: 'Hind leg pollen storage combs', adult: 'Tibial pollen storage corbiculae', plainWords: 'Pollen bags' },
            learn: {
              child: 'Bees pack golden flower dust onto their back legs like little backpacks!',
              teen: 'Specialized bristles on their hind legs pack bright yellow pollen granules into dense pellets.',
              adult: 'Pollen combs pack grains into the smooth, concave outer surface of the hind tibia.',
              plainWords: 'These pockets on the legs hold yellow flower pollen.',
            },
            anchor: [-0.3, -0.2, 0.8],
          },
          {
            id: 'p3',
            name: { child: 'Stripes', teen: 'Warning abdomen', adult: 'Abdominal aposematism', plainWords: 'Stripes' },
            short: { child: 'Black and yellow warning', teen: 'Aposematic warning coloration', adult: 'Aposematic warning banding', plainWords: 'Striped body' },
            learn: {
              child: 'Black and yellow stripes tell birds: I am busy making honey, please do not bother me!',
              teen: 'Aposematic coloration signals potential predators that the bee has a defensive sting.',
              adult: 'High-contrast alternating melanic and xanthic banding provides visual deterrence.',
              plainWords: 'These stripes show that the bee should not be touched.',
            },
            anchor: [0.3, -0.3, 0.8],
          },
        ],
        quiz: [
          {
            id: 'q1',
            answerPartId: 'p2',
            prompt: {
              child: 'Where does the bee carry flower pollen?',
              teen: 'Which leg feature is used to pack and carry pollen back to the hive?',
              adult: 'Locate the corbicula pollen carrier.',
              plainWords: 'Tap where the bee keeps the pollen.',
            },
            hint: { child: 'Look on the back legs!', teen: 'The corbiculae on the hind legs', adult: 'Hind tibial corbicula', plainWords: 'The pockets on the back legs' },
            praise: { child: 'Bzz-illiant! That is where the bee packs pollen!', teen: 'Correct! The corbiculae carry pollen pellets.', adult: 'Accurate: corbicula identified.', plainWords: 'Well done! That is correct.' },
          },
        ],
      },
    },
  ]
  return starters
}

let memoryCards: SavedCard[] | null = null
const listeners = new Set<() => void>()

export function getSavedCards(): SavedCard[] {
  if (typeof window === 'undefined') return getInitialStarterCards()
  if (memoryCards) return memoryCards
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) {
      const initial = getInitialStarterCards()
      memoryCards = initial
      window.localStorage.setItem(KEY, JSON.stringify(initial))
      return initial
    }
    const parsed = JSON.parse(raw) as SavedCard[]
    if (Array.isArray(parsed) && parsed.length) {
      memoryCards = parsed
      return parsed
    }
    const initial = getInitialStarterCards()
    memoryCards = initial
    return initial
  } catch {
    return getInitialStarterCards()
  }
}

export function saveCard(card: Omit<SavedCard, 'discoveredAt'>): SavedCard {
  const current = getSavedCards()
  // Check if card with this id or templateId already exists
  const existingIdx = current.findIndex(
    (c) => c.id === card.id || (card.templateId && c.templateId === card.templateId),
  )

  const fullCard: SavedCard = {
    ...card,
    discoveredAt: existingIdx >= 0 ? current[existingIdx].discoveredAt : Date.now(),
  }

  let updated: SavedCard[]
  if (existingIdx >= 0) {
    updated = [...current]
    updated[existingIdx] = fullCard
  } else {
    // Put newest at the front
    updated = [fullCard, ...current]
  }

  memoryCards = updated
  try {
    window.localStorage.setItem(KEY, JSON.stringify(updated))
  } catch {}

  listeners.forEach((fn) => fn())
  return fullCard
}

export function subscribeCards(fn: () => void): () => void {
  listeners.add(fn)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      memoryCards = null
      fn()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(fn)
    window.removeEventListener('storage', onStorage)
  }
}
