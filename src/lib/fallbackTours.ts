// Hand-written canned tours: instant demo safety net when vision is skipped or fails. Owner: Shehryar
import type { AnalyzeResponse, PropType } from './types'

type CannedTour = Omit<AnalyzeResponse, 'source'>

export const FALLBACK_TOURS: Record<PropType, CannedTour> = {
  charger: {
    detectedPropType: 'charger',
    objectTitle: 'USB-C Wall Charger',
    causeAndEffectChainForTeen:
      'AC Wall Current (120V) -> GaN FET Switching -> High-Frequency Transformer -> 5V/20V USB-C PD Output',
    steps: [
      {
        stepNumber: 1,
        partName: 'USB-C Port',
        isHazardForChild: false,
        scripts: {
          child: 'Hoot! This little oval door is where the cable snuggles in.',
          teen: 'The USB-C port has 24 pins. Before sending power, the charger and phone "talk" over the CC pin to agree on a safe voltage.',
          adult:
            'USB-C receptacle supporting USB Power Delivery 3.0 with PPS. Negotiation over the CC line selects 5V, 9V, 15V or 20V profiles up to 3A (5A with e-marked cables), typically 20-65W.',
          plainWords: 'Plug the cable into this small oval hole.',
        },
      },
      {
        stepNumber: 2,
        partName: 'Power Indicator Light',
        isHazardForChild: false,
        scripts: {
          child: 'See the tiny glowing light? It winks when power is flowing!',
          teen: 'The LED is driven from the low-voltage side. When current flows through the diode, electrons drop energy levels and release photons, so light means power is on.',
          adult:
            'Status LED on the secondary (SELV) side, typically driven through a current-limiting resistor at 1-5 mA. Some models signal fault or overtemperature states by blinking.',
          plainWords: 'A light on means it is working.',
        },
      },
      {
        stepNumber: 3,
        partName: 'AC Wall Prongs',
        isHazardForChild: true,
        scripts: {
          child: 'These metal legs touch wall power. Only grown-ups plug them in!',
          teen: 'The prongs carry 120V alternating current. Your body conducts electricity, so touching them while plugged in lets current flow through you, which is why only the plastic is safe to hold.',
          adult:
            'Type A/B mains prongs at 100-240V AC, 50/60Hz. Primary side is isolated from the output by reinforced insulation and a safety-rated transformer; creepage distances follow IEC 62368-1.',
          plainWords: 'Hold the plastic, never the metal, when plugging in.',
        },
      },
    ],
    childSpatialTapQuestion: {
      prompt: 'Can you tap the part where the charging cable plugs in?',
      correctStepNumber: 1,
    },
  },

  phone: {
    detectedPropType: 'phone',
    objectTitle: 'Smartphone',
    causeAndEffectChainForTeen:
      'Finger Touch -> Capacitance Change in Screen Grid -> Processor Reads X/Y Position -> App Responds',
    steps: [
      {
        stepNumber: 1,
        partName: 'Touchscreen',
        isHazardForChild: false,
        scripts: {
          child: 'This shiny window feels your finger. Tap it gently, like a raindrop!',
          teen: 'Your finger holds a tiny electric charge. Touching the glass changes the capacitance of a hidden grid of wires, and the phone calculates exactly where you pressed.',
          adult:
            'Projected-capacitive touch layer under chemically strengthened cover glass, laminated to an OLED or LCD panel. Touch controller samples at 120-240Hz and supports multi-touch.',
          plainWords: 'Touch the screen gently with one finger.',
        },
      },
      {
        stepNumber: 2,
        partName: 'Camera Lens',
        isHazardForChild: false,
        scripts: {
          child: 'This round eye takes pictures. Keep it clean so it sees clearly!',
          teen: 'The lens bends light rays so they focus on a sensor. Millions of photodiodes turn photons into electric signals, building the picture pixel by pixel.',
          adult:
            'Multi-element lens stack focusing onto a CMOS image sensor (typically 12-50MP, 1/1.3"-1/2.5"). Features may include optical image stabilisation, phase-detection autofocus and multi-frame HDR processing.',
          plainWords: 'This is the camera. Wipe it with a soft cloth.',
        },
      },
      {
        stepNumber: 3,
        partName: 'Lithium-Ion Battery',
        isHazardForChild: true,
        scripts: {
          child: 'A strong battery hides inside. Never bend or open it. Ask a grown-up!',
          teen: 'Lithium ions move between two layers to store energy. If the battery is punctured or crushed, the layers can touch, short-circuit and heat up very fast, so it stays sealed.',
          adult:
            'Lithium-ion polymer pouch cell, ~3.85V nominal, 3,000-5,000mAh. Protected by a battery management IC handling overcharge, overdischarge and thermal limits. Swelling indicates degradation; do not puncture.',
          plainWords: 'If the phone swells or gets hot, stop using it.',
        },
      },
    ],
    childSpatialTapQuestion: {
      prompt: 'Can you tap the part that takes pictures?',
      correctStepNumber: 2,
    },
  },

  bottle: {
    detectedPropType: 'bottle',
    objectTitle: 'Water Bottle',
    causeAndEffectChainForTeen:
      'Twist Cap -> Threads Convert Rotation to Downward Force -> Gasket Compresses -> Watertight Seal',
    steps: [
      {
        stepNumber: 1,
        partName: 'Screw Cap',
        isHazardForChild: false,
        scripts: {
          child: 'Twist the cap like a tiny steering wheel to open it!',
          teen: 'The threads are a spiral ramp. Turning the cap converts a small twisting force into strong downward pressure that squeezes the rubber seal shut.',
          adult:
            'Threaded closure with a silicone or TPE gasket. Thread pitch trades turns-to-seal against clamping force; a well-fitted cap holds pressure without leaking when inverted.',
          plainWords: 'Turn the cap to the left to open.',
        },
      },
      {
        stepNumber: 2,
        partName: 'Filter or Straw',
        isHazardForChild: false,
        scripts: {
          child: 'This little tube helps water travel up to your mouth. Slurp!',
          teen: 'When you sip, you lower the air pressure in your mouth. Higher air pressure outside pushes water up the straw, and a filter traps particles as it flows.',
          adult:
            'Drinking straw or inline filter cartridge (often activated carbon, sometimes hollow-fibre membrane). Replace filters per manufacturer schedule, typically every 2-3 months.',
          plainWords: 'Drink slowly from the top.',
        },
      },
      {
        stepNumber: 3,
        partName: 'Bottle Body',
        isHazardForChild: true,
        scripts: {
          child: 'If a bottle cracks, sharp bits can hide. Tell a grown-up right away!',
          teen: 'Glass is strong but brittle: it cannot bend, so a hard knock makes cracks spread instantly into sharp shards. Plastic or steel bends instead, which is why it is safer to drop.',
          adult:
            'Body material is typically borosilicate glass, Tritan copolyester, or 18/8 stainless steel. Glass fractures into sharp shards on impact; inspect for chips or cracks before use and avoid thermal shock.',
          plainWords: 'If it is cracked, do not use it.',
        },
      },
    ],
    childSpatialTapQuestion: {
      prompt: 'Can you tap the part you twist to open?',
      correctStepNumber: 1,
    },
  },

  wildcard: {
    detectedPropType: 'wildcard',
    objectTitle: 'Mystery Object',
    causeAndEffectChainForTeen: 'Your Action -> Mechanism Inside -> Visible Result',
    steps: [
      {
        stepNumber: 1,
        partName: 'Main Surface',
        isHazardForChild: false,
        scripts: {
          child: 'Hoot! This is the side you can safely hold and look at.',
          teen: 'Most objects have a "user surface" designed for touch. Its shape and material are chosen to spread force from your hand so it is comfortable and safe.',
          adult:
            'Primary user-facing surface. Designers select materials for grip, durability and heat resistance, and place controls where hands naturally rest.',
          plainWords: 'Hold it here.',
        },
      },
      {
        stepNumber: 2,
        partName: 'Control or Opening',
        isHazardForChild: false,
        scripts: {
          child: 'Look for a button, lid, or hole. That is how it works!',
          teen: 'A control turns your small input, like a press or twist, into a bigger change inside the object, using levers, switches or seals.',
          adult:
            'Secondary interface: a button, switch, lid or port that changes the object\'s state. Check for labels or symbols indicating function and ratings.',
          plainWords: 'Find the button or lid.',
        },
      },
      {
        stepNumber: 3,
        partName: 'Inside Parts',
        isHazardForChild: true,
        scripts: {
          child: 'The inside might be sharp or hot. Let a grown-up check it!',
          teen: 'Inside parts can store energy, like heat, pressure or electric charge. Opening a case can release that energy suddenly, so leave it sealed.',
          adult:
            'Internal components may include stored energy (batteries, capacitors, springs, pressure) or sharp edges. Consult the manufacturer before disassembly.',
          plainWords: 'Do not open it.',
        },
      },
    ],
    childSpatialTapQuestion: {
      prompt: 'Can you tap the part you would hold?',
      correctStepNumber: 1,
    },
  },
}

/** Fresh copy of a canned tour (callers may mutate it). */
export function getFallbackTour(prop: PropType): AnalyzeResponse {
  const tour = FALLBACK_TOURS[prop] ?? FALLBACK_TOURS.wildcard
  return { ...structuredClone(tour), source: 'fallback' }
}
