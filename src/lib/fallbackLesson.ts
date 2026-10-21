// Generic "Mystery object" photo lesson: served by /api/analyze when Gemini is unavailable. Owner: Shehryar (backend agent)
import type { ByMode, ObjectLesson } from './types'

const m = (child: string, teen: string, adult: string, plainWords: string): ByMode => ({ child, teen, adult, plainWords })

/** Returns a fresh fallback lesson (new id each call). `name` personalizes the intro. */
export function getFallbackLesson(name?: string): ObjectLesson {
  const hi = name ? `${name}, ` : ''
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `fallback-${Date.now()}`,
    kind: 'photo',
    title: m('Mystery Thing', 'Mystery Object', 'Unidentified Object', 'Your object'),
    emoji: '🔍',
    intro: m(
      `${hi}ooh, a mystery thing! Let's look at its top, middle and bottom!`,
      `${hi}I couldn't quite tell what this is, so let's investigate it like a scientist: top, middle, bottom.`,
      `${hi}I couldn't identify this object, so here is a general structural walkthrough: top, middle and base.`,
      `${hi}let's look at this object one part at a time.`,
    ),
    causeAndEffect: 'Shape -> Job it does -> How we use it',
    parts: [
      {
        id: 'p1',
        name: m('Top', 'Top section', 'Upper section', 'The top'),
        short: m('The very top part', 'Where you grab or open', 'Upper interface area', 'The top part'),
        learn: m(
          'This is the top! It is often where you hold, open or press things.',
          'The top is usually where we interact with an object, so its shape is designed around fingers and hands.',
          'Upper surfaces typically carry the primary user interface: openings, controls or grip features, shaped by ergonomics.',
          'This is the top of the object.',
        ),
        anchor: [0, 0.7, 0.8],
      },
      {
        id: 'p2',
        name: m('Middle', 'Middle section', 'Main body', 'The middle'),
        short: m('The big middle part', 'Holds the main stuff and load', 'Primary structural body', 'The middle part'),
        learn: m(
          'The middle is the biggest part. It holds the object together!',
          'The middle carries most of the load, so it needs to be strong; material choice decides how heavy and tough it is.',
          'The main body provides structural integrity and usually houses the functional volume or components; wall thickness and material set strength-to-weight.',
          'This is the middle, the main part.',
        ),
        anchor: [0, 0, 0.8],
      },
      {
        id: 'p3',
        name: m('Bottom', 'Base', 'Base / footprint', 'The bottom'),
        short: m('Where it sits down', 'Wide base keeps it from tipping', 'Load-bearing base', 'The bottom part'),
        learn: m(
          'The bottom helps it sit still without falling over. Wobble, wobble, stop!',
          'A wide, heavy base lowers the centre of mass, which makes the object harder to tip over.',
          'The base defines the footprint and centre-of-mass relationship that governs stability; many bases add friction pads or reinforcement.',
          'This is the bottom, where it rests.',
        ),
        anchor: [0, -0.7, 0.8],
      },
    ],
    quiz: [
      {
        id: 'q1',
        answerPartId: 'p1',
        prompt: m('Can you tap the top?', "You can't open or switch it on. Which part should you check first?", 'Select the upper interface section.', "Let's try it together: tap the top."),
        hint: m('Look up high!', 'It is the highest part.', 'Highest point of the object.', 'It is at the top.'),
        praise: m('Yay! You found the top!', 'Correct, that is the top section.', 'Correct.', 'Well done.'),
      },
      {
        id: 'q2',
        answerPartId: 'p2',
        prompt: m('Can you tap the middle?', 'It bends when you squeeze it. Which part is carrying the load?', 'Select the main structural body.', "Let's try it together: tap the middle."),
        hint: m("It's the biggest part!", 'It is between the top and the base.', 'Largest central volume.', 'It is in the middle.'),
        praise: m('Woohoo! That is the middle!', 'Right, the middle does the heavy lifting.', 'Correct.', 'Nicely done.'),
      },
      {
        id: 'q3',
        answerPartId: 'p3',
        prompt: m('Can you tap the bottom?', 'It keeps tipping over. Which part sets its stability?', 'Select the part that determines stability.', "Let's try it together: tap the bottom."),
        hint: m('Look down low!', 'Think about the centre of mass.', 'Defines the footprint.', 'It is at the bottom.'),
        praise: m('Hooray! You found the bottom!', 'Yes, the base keeps it stable.', 'Correct.', 'Good job.'),
      },
    ],
    source: 'fallback',
  }
}
