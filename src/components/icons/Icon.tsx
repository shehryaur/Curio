// Minimal outline icon set for Curio (black & white, stroke-only, no emoji). Original drawings.
// Usage: <Icon name="camera" size={20} />  — inherits color via currentColor.
import type { ReactElement, SVGProps } from 'react'

export type IconName =
  | 'home' | 'cards' | 'camera' | 'mic' | 'send' | 'settings' | 'learn' | 'quiz' | 'explore' | 'sparkle'
  | 'back' | 'next' | 'play' | 'pause' | 'repeat' | 'close' | 'check' | 'xp' | 'streak' | 'shield'
  | 'user' | 'safety' | 'speaker' | 'image' | 'search' | 'chat' | 'cube' | 'plus' | 'upload' | 'layers'
  | 'leaf' | 'moon' | 'bee' | 'bottle' | 'book' | 'phone' | 'plug' | 'mug' | 'pencil' | 'family' | 'lock'

const P: Record<IconName, ReactElement> = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></>,
  cards: <><rect x="3" y="6" width="13" height="15" rx="2" /><path d="M8 3h11a2 2 0 0 1 2 2v13" /></>,
  camera: <><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13.5" r="3.5" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></>,
  send: <><path d="M4 12 20 4l-6 16-3-7-7-1Z" /><path d="m11 13 9-9" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></>,
  learn: <><path d="M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3Z" /><path d="M21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7Z" /></>,
  quiz: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  explore: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>,
  sparkle: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m12 8 1.5 2.5L16 12l-2.5 1.5L12 16l-1.5-2.5L8 12l2.5-1.5Z" /></>,
  back: <><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></>,
  next: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  play: <><path d="M7 4.5v15l12-7.5Z" /></>,
  pause: <><path d="M8 5v14M16 5v14" /></>,
  repeat: <><path d="M4 12a8 8 0 0 1 14-5.3L20 9" /><path d="M20 4v5h-5" /><path d="M20 12a8 8 0 0 1-14 5.3L4 15" /><path d="M4 20v-5h5" /></>,
  close: <><path d="M6 6l12 12M18 6 6 18" /></>,
  check: <><path d="m5 12.5 4.5 4.5L19 7" /></>,
  xp: <><path d="m12 3 2.6 5.5 6 .8-4.4 4.1 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.3l6-.8Z" /></>,
  streak: <><path d="M12 21c-4 0-7-2.7-7-6.5 0-3.3 2.5-5.5 4-8 1 2 2 3 3 3 0-2.5 1-4.5 3-6.5.5 3 4 6 4 11 0 4-3 7-7 7Z" /></>,
  shield: <><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6Z" /><path d="m9 12 2 2 4-4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  safety: <><path d="M12 4 2.5 20h19Z" /><path d="M12 10v4.5M12 17.5v.5" /></>,
  speaker: <><path d="M4 9h4l5-4v14l-5-4H4Z" /><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m4 18 5-5 4 4 3-3 4 4" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  chat: <><path d="M4 5h16v11H9l-5 4Z" /></>,
  cube: <><path d="M12 3 3.5 7.5v9L12 21l8.5-4.5v-9Z" /><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 16v4h16v-4" /></>,
  leaf: <><path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15" /><path d="M5 19 13 11" /></>,
  moon: <><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /></>,
  bee: <><ellipse cx="12" cy="14" rx="5" ry="6" /><path d="M7.5 12h9M7.5 16h9" /><path d="M10 8a3 3 0 0 1-3-4M14 8a3 3 0 0 0 3-4" /></>,
  bottle: <><path d="M10 2h4v3l2 3v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8l2-3Z" /><path d="M8 12h8" /></>,
  book: <><path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2Z" /><path d="M5 18a2 2 0 0 1 2-2h11" /></>,
  phone: <><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></>,
  plug: <><path d="M9 2v5M15 2v5" /><path d="M6 7h12v4a6 6 0 0 1-12 0Z" /><path d="M12 17v5" /></>,
  mug: <><path d="M4 7h12v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Z" /><path d="M16 9h2a2 2 0 0 1 0 6h-2" /></>,
  pencil: <><path d="M4 20l1-5L16 4l4 4L9 19Z" /><path d="M14 6l4 4" /></>,
  family: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><circle cx="17" cy="9" r="2.5" /><path d="M17 14a4.5 4.5 0 0 1 4.5 4.5" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5Z" /><path d="m3 13 9 5 9-5" /></>,
}

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
  strokeWidth?: number
  /** Accessible label; omit for decorative icons. */
  label?: string
}

export default function Icon({ name, size = 20, strokeWidth = 2, label, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      {P[name]}
    </svg>
  )
}
