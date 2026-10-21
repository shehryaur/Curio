// DEMO ONLY (NEXT_PUBLIC_DEMO_MODE=true): any photo is recognised as a soda can, and the "Meshy build"
// is simulated with a pre-generated model at /models/sodacan.glb. Real users never hit this path.
import type { AnalyzeResponse, ByMode, ObjectLesson } from './types'

export const DEMO_ON = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
export const DEMO_TASK_ID = 'demo-sodacan'
export const DEMO_GLB = '/models/sodacan.glb'
const BUILD_MS = 14_000 // how long the fake 3D build takes

const m = (child: string, teen: string, adult: string, plainWords: string): ByMode => ({ child, teen, adult, plainWords })

export function sodaCanLesson(name?: string): ObjectLesson {
  const hi = name ? `Hi ${name}! ` : ''
  return {
    id: `photo-sodacan-${Date.now().toString(36)}`,
    kind: 'photo',
    title: m('Soda can', 'Soda can', 'Aluminium beverage can', 'Soda can'),
    emoji: '🥤',
    intro: m(
      `${hi}It's a soda can! Let's see how it keeps the fizz inside.`,
      `${hi}This is a soda can — a pressure vessel thinner than a sheet of paper. Let's see how it works.`,
      `${hi}This is a two-piece aluminium beverage can. Let's walk through its engineering.`,
      `${hi}This is a soda can. Let's look at it one part at a time.`,
    ),
    causeAndEffect: 'CO2 dissolved under pressure -> thin aluminium wall holds ~2-3 bar -> pull tab levers the scored lid open -> pressure drops and the drink fizzes',
    parts: [
      {
        id: 'p1',
        name: m('Pull tab', 'Pull tab (lever)', 'Stay-on tab', 'Pull tab'),
        short: m('Lift it to open', 'A lever that cracks the lid', 'Riveted stay-on tab, class-2 lever on scored panel', 'Lift to open'),
        learn: m(
          'Lift the little tab and — psst! — the can opens!',
          'The tab is a lever: lifting it pushes down on a weakened score line until the lid breaks open and gas escapes.',
          'The stay-on tab, riveted to the lid, acts as a lever that fractures the pre-scored panel and folds it inward, so no loose litter.',
          'Step 1: Lift this small tab on top with your finger to open the can.',
        ),
        safetyTip: m('Open it slowly, the edge can be sharp.', 'Opened lids have sharp edges.', 'Scored edges are sharp after opening.', 'Open it slowly; the edge can be sharp.'),
        anchor: [0.15, 0.95, 0.4],
      },
      {
        id: 'p2',
        name: m('Lid', 'Lid (end)', 'Can end', 'Top'),
        short: m('The can’s hat', 'Thicker metal holds the pressure', 'Stiffer alloy end, double-seamed to the body', 'The top of the can'),
        learn: m(
          'The lid is a strong little hat that keeps the bubbles in.',
          'The lid uses thicker, stiffer aluminium so the pressure inside can’t bulge it.',
          'The end is a stiffer 5182 alloy, double-seamed onto the necked body to form an airtight seal.',
          'Step 2: This flat top keeps the drink sealed until you open it.',
        ),
        anchor: [0, 0.85, 0.6],
      },
      {
        id: 'p3',
        name: m('Body', 'Body (wall)', 'Drawn-and-ironed body', 'Side'),
        short: m('Holds the drink', 'Thin wall stays tight under pressure', 'DWI 3004 alloy, ~0.1 mm wall, lined inside', 'Holds the drink'),
        learn: m(
          'The body holds all the drink, and it’s super thin!',
          'The wall is thinner than paper, but the gas pushing out keeps it stiff — like a balloon.',
          'The body is drawn and wall-ironed from one aluminium disc to about 0.1 mm, with a polymer liner so the drink never touches metal.',
          'Step 3: This round side holds the drink.',
        ),
        anchor: [0, 0.1, 0.9],
      },
      {
        id: 'p4',
        name: m('Bottom', 'Domed bottom', 'Domed base', 'Bottom'),
        short: m('Curvy feet', 'A dome spreads the push', 'Inward dome resists pressure, enables stacking', 'The bottom'),
        learn: m(
          'The bottom curves in like a bowl so the can stands strong.',
          'The bottom is domed inward, like an arch, so pressure spreads out instead of popping it.',
          'The inward dome resists internal pressure and lets cans stack and nest on production lines.',
          'Step 4: The bottom is curved so the can stands steady.',
        ),
        anchor: [0, -0.95, 0.5],
      },
    ],
    quiz: [
      {
        id: 'q1',
        answerPartId: 'p1',
        prompt: m('Can you tap the part you lift to open it?', 'The can won’t open — which part works as a lever?', 'Which component fractures the scored panel?', 'Let’s try it together: tap the tab you lift to open it.'),
        hint: m('It’s a tiny tab on the very top!', 'Look for the small lever on the lid.', 'It’s riveted to the end.', 'It is on the top.'),
        praise: m('Yay! You found the pull tab!', 'Correct — it’s a lever that cracks the score line.', 'Correct: the stay-on tab.', 'Well done, that’s the tab.'),
      },
      {
        id: 'q2',
        answerPartId: 'p3',
        prompt: m('Where does the drink live? Tap it!', 'Why doesn’t a full can crush easily? Tap the part that stays stiff from gas pressure.', 'Identify the drawn-and-ironed component.', 'Let’s try it together: tap the side that holds the drink.'),
        hint: m('It’s the big middle part!', 'It’s the thinnest part.', 'It’s formed from a single disc.', 'It is the big round side.'),
        praise: m('Yes! That’s where the fizzy drink lives!', 'Right — internal pressure stiffens the thin wall.', 'Correct: the DWI body.', 'Well done, that’s the side.'),
      },
      {
        id: 'q3',
        answerPartId: 'p4',
        prompt: m('Can you find the can’s curvy bottom?', 'Which part uses an arch shape to resist pressure?', 'Which feature enables stacking and resists bulging?', 'Let’s try it together: tap the bottom.'),
        hint: m('Look at the very bottom!', 'Think of a dome or arch.', 'It’s at the base.', 'It is at the bottom.'),
        praise: m('Hooray! The bottom is like a bowl!', 'Exactly — the dome spreads the force.', 'Correct: the domed base.', 'Well done, that’s the bottom.'),
      },
    ],
    source: 'gemini',
  }
}

export function demoAnalyze(name?: string): AnalyzeResponse {
  return { lesson: sodaCanLesson(name), matchedTemplate: null, needsModel: true }
}

// Simulated Meshy build: progress is driven by wall-clock time since the fake task started.
let startedAt = 0
export function startDemoBuild(): string {
  startedAt = Date.now()
  return DEMO_TASK_ID
}
export function demoStatus() {
  const p = startedAt ? Math.min(100, Math.round(((Date.now() - startedAt) / BUILD_MS) * 100)) : 100
  const done = p >= 100
  return {
    taskId: DEMO_TASK_ID,
    status: done ? 'SUCCEEDED' : p < 8 ? 'PENDING' : 'IN_PROGRESS',
    progress: p,
    ...(done ? { glbUrl: DEMO_GLB, proxyUrl: DEMO_GLB } : {}),
  }
}
