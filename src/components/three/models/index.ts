import type { ComponentType } from 'react'
import type { TemplateId } from '@/lib/types'
import BottleModel from './Bottle'
import CameraModel from './Camera'
import BookModel from './Book'
import PhoneModel from './Phone'
import ChargerModel from './Charger'
import MugModel from './Mug'
import PencilModel from './Pencil'

/** TemplateId -> procedural model. Every model tags its parts with EXACTLY TEMPLATE_PART_IDS[templateId]. */
export const TEMPLATE_MODELS: Record<TemplateId, ComponentType> = {
  bottle: BottleModel,
  camera: CameraModel,
  book: BookModel,
  phone: PhoneModel,
  charger: ChargerModel,
  mug: MugModel,
  pencil: PencilModel,
}

