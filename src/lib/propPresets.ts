import type { PropType } from './types'

// 3D hotspot positions per prop, one per tour step. Fill real values from modelviewer.dev/editor
// once the .glb files exist in public/models. Units are model space, format "x y z".
export interface Hotspot {
  stepNumber: 1 | 2 | 3
  position: string
  normal: string
}
export interface PropPreset {
  type: Exclude<PropType, 'wildcard'>
  title: string
  modelUrl: string
  cameraOrbit: string
  hotspots: Hotspot[]
}

export const PROP_PRESETS: Record<PropPreset['type'], PropPreset> = {
  charger: {
    type: 'charger',
    title: 'USB-C Wall Charger',
    modelUrl: '/models/charger.glb',
    cameraOrbit: '30deg 75deg 0.4m',
    hotspots: [
      { stepNumber: 1, position: '0 0.02 0.03', normal: '0 0 1' },
      { stepNumber: 2, position: '0 -0.03 0', normal: '0 -1 0' },
      { stepNumber: 3, position: '0.02 0 0', normal: '1 0 0' },
    ],
  },
  phone: {
    type: 'phone',
    title: 'Smartphone',
    modelUrl: '/models/phone.glb',
    cameraOrbit: '0deg 80deg 0.5m',
    hotspots: [
      { stepNumber: 1, position: '0 -0.07 0', normal: '0 -1 0' },
      { stepNumber: 2, position: '0.02 0.06 -0.004', normal: '0 0 -1' },
      { stepNumber: 3, position: '0 0 -0.004', normal: '0 0 -1' },
    ],
  },
  bottle: {
    type: 'bottle',
    title: 'Water Bottle',
    modelUrl: '/models/bottle.glb',
    cameraOrbit: '0deg 75deg 0.6m',
    hotspots: [
      { stepNumber: 1, position: '0 0.12 0', normal: '0 1 0' },
      { stepNumber: 2, position: '0 0.09 0.03', normal: '0 0 1' },
      { stepNumber: 3, position: '0 0 0.035', normal: '0 0 1' },
    ],
  },
}
