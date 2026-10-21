// Lesson content for the 7 built-in template objects. Plain data: safe on client and server.
// Mode rules (docs/AGE_TIERS.md): child learn = 1 playful sentence (<= 15 words); teen = cause and effect;
// adult = technical spec; plainWords learn = "Step N: ..." one calm sentence.
// short: child/plainWords 3-5 words, teen 5-8 words, adult <= 12 words.
import type { ByMode, ObjectLesson, PartInfo, QuizQuestion, TemplateId } from './types'

/** child, teen, adult, plainWords */
const m = (child: string, teen: string, adult: string, plainWords: string): ByMode => ({ child, teen, adult, plainWords })

const part = (id: string, name: ByMode, short: ByMode, learn: ByMode, safetyTip?: ByMode): PartInfo =>
  safetyTip ? { id, name, short, learn, safetyTip } : { id, name, short, learn }

const q = (id: string, answerPartId: string, prompt: ByMode, hint: ByMode, praise: ByMode): QuizQuestion => ({
  id,
  prompt,
  answerPartId,
  hint,
  praise,
})

const wiki = (title: string, slug: string) => ({ title: `${title} (Wikipedia)`, url: `https://en.wikipedia.org/wiki/${slug}` })

export const TEMPLATE_ORDER: TemplateId[] = ['bottle', 'camera', 'book', 'phone', 'charger', 'mug', 'pencil']

// ---------------------------------------------------------------- bottle
const bottle: ObjectLesson = {
  id: 'bottle',
  kind: 'template',
  templateId: 'bottle',
  source: 'template',
  emoji: '🍶',
  title: m('Water Bottle', 'Plastic Bottle', 'PET Beverage Bottle', 'Water bottle'),
  intro: m(
    "Ooh, a water bottle! Let's peek at its lid, neck, body and bottom!",
    "A plastic bottle looks simple, but it is shaped by heat, air pressure and clever geometry. Let's see how.",
    'This is a stretch-blow-molded PET bottle. We will look at the closure, neck finish, body wall and base.',
    "This is a water bottle. Let's look at it one part at a time.",
  ),
  causeAndEffect: 'Twist the cap -> threads clamp the liner onto the neck -> airtight seal keeps liquid and fizz inside',
  sources: [
    wiki('Polyethylene terephthalate', 'Polyethylene_terephthalate'),
    wiki('Plastic bottle', 'Plastic_bottle'),
    wiki('Bottle cap', 'Bottle_cap'),
  ],
  parts: [
    part(
      'cap',
      m('Lid', 'Cap', 'Screw cap (closure)', 'Cap'),
      m('Twist it to open', 'Threads turn a twist into clamping', 'PP #5 closure, 28 mm thread, tamper-evident band', 'Turn it to open'),
      m(
        'Twist the lid to open, and twist it back to keep drinks in!',
        "The cap's threads are a spiral ramp: a small twist turns into a strong downward clamp. That squeezes a seal against the neck so no liquid or fizz can escape.",
        'Usually polypropylene (PP, resin code #5) with a 28 mm thread finish and a tamper-evident band that breaks on first opening. An internal liner or sealing lip compresses against the neck to hold carbonation pressure.',
        'Step 1: This round cap on top twists off to open the bottle.',
      ),
    ),
    part(
      'neck',
      m('Neck', 'Neck', 'Neck finish', 'Neck'),
      m('Skinny part for sipping', 'Narrow opening slows and controls flow', 'Unstretched neck finish with threads and support ring', 'The top you drink from'),
      m(
        'The skinny neck helps your drink pour out without big splashes!',
        'A narrow opening limits how fast liquid can leave, so air and water take turns going through it. That is why a full bottle glugs, and why the pour stays controlled.',
        'The neck finish is molded into the preform and is not stretched during blow molding, so its threads stay thick and dimensionally precise. The support ring below the threads lets filling machines grip and carry the bottle.',
        'Step 2: Below the cap is the narrow neck you drink from.',
      ),
    ),
    part(
      'body',
      m('Body', 'Body', 'Body wall', 'Bottle'),
      m('Holds all your water', 'Stretched plastic chains make the wall strong', 'Stretch-blow molded PET #1, biaxially oriented, ribbed wall', 'Holds the drink'),
      m(
        "The body holds your water, and it's light as a feather!",
        'Factories heat a small plastic tube and blow air into it, stretching it into a thin wall. Stretching lines up the long plastic molecules, which makes the wall tougher, and the ribs add stiffness the way folds stiffen cardboard.',
        'The body is PET (polyethylene terephthalate, resin code #1), stretch-blow molded from a test-tube-shaped preform so the polymer chains orient in two directions. Ribs and panels add hoop strength and absorb pressure or vacuum changes.',
        'Step 3: The big middle part holds your drink.',
      ),
      m(
        'Thin bottles are for one use, then recycle!',
        "Single-use bottles are hard to clean inside and scratches can hide germs, so don't refill them forever. Recycle them and use a proper reusable bottle.",
        "Single-use PET bottles aren't designed for repeated washing or heat, and their narrow necks and scratches trap bacteria. Recycle them and use a washable reusable bottle for refills.",
        'Use a throwaway bottle only once or twice, then recycle it.',
      ),
    ),
    part(
      'base',
      m('Bottom', 'Base', 'Petaloid base', 'Bottom'),
      m('Little feet for standing', 'Rounded feet spread out fizzy pressure', 'Petaloid base; resists roughly 3-4 bar carbonation pressure', 'Lets it stand up'),
      m(
        'Little bumpy feet on the bottom help the bottle stand tall!',
        'Fizzy drinks push outward on every surface. A flat bottom would bulge and wobble, so the base is shaped into rounded feet that spread the stress evenly and still sit level.',
        'Carbonated bottles use a petaloid (usually five-foot) base that spreads internal pressure of roughly 3 to 4 bar while staying stable; still-water bottles often have a flatter base with a central push-up. The small dot in the center is the injection gate from the preform.',
        'Step 4: The flat bottom lets the bottle stand up on a table.',
      ),
    ),
  ],
  quiz: [
    q(
      'bottle-q1',
      'cap',
      m(
        'Can you tap the lid?',
        'Your fizzy drink went flat overnight. Which part would you check first?',
        'The tamper-evident band on a new bottle is already broken. Which part should you inspect before drinking?',
        "Let's try it together: tap the cap on top.",
      ),
      m("It's at the very top!", 'Gas escapes wherever the seal is not tight.', 'The band sits just below it.', 'It is at the very top.'),
      m(
        'Yay! You found the lid! 🎉',
        "Right: the cap's threads clamp a seal onto the neck, and a loose cap lets the dissolved CO2 escape.",
        "Correct: a broken band on the closure means it may have been opened, so don't drink it.",
        'Well done, that is the cap.',
      ),
    ),
    q(
      'bottle-q2',
      'body',
      m(
        'Where does the water live? Tap it!',
        'A bottle left in a hot car went soft and warped. Which part would you inspect?',
        'Someone keeps refilling a single-use bottle. Which part can hide bacteria in its scratches?',
        "Let's try it together: tap the big middle part that holds the drink.",
      ),
      m("It's the big middle part!", 'It is the largest, thinnest-walled section.', 'It is the main wall between neck and base.', 'It is the big middle part.'),
      m(
        'You did it! That is the body! 💧',
        'Yes: PET softens around 70-80 °C (its glass transition), so the thin body wall loses its shape.',
        'Correct: scratches in the thin PET body are hard to clean, so recycle single-use bottles.',
        'Well done, that part holds the drink.',
      ),
    ),
    q(
      'bottle-q3',
      'base',
      m(
        "Can you find the bottle's feet?",
        "Your fizzy bottle won't stand level. Which part would you check for bulging?",
        'A carbonated bottle rocks on a flat table. Which part would you check for pressure deformation?',
        "Let's try it together: tap the bottom of the bottle.",
      ),
      m('Look way down low!', 'A flat surface would bulge here under pressure.', 'It contains the preform injection gate.', 'It is at the very bottom.'),
      m(
        'Great job! Those are the feet! 👣',
        'Right: the rounded feet spread the gas pressure, and if the plastic is weakened the base bulges and rocks.',
        'Correct: a deformed petaloid base points to over-pressure or heat damage, so discard the bottle.',
        'Well done, that is the bottom.',
      ),
    ),
  ],
}

// ---------------------------------------------------------------- camera (antique wooden bellows view camera)
const camera: ObjectLesson = {
  id: 'camera',
  kind: 'template',
  templateId: 'camera',
  source: 'template',
  emoji: '📷',
  title: m('Old Camera', 'Bellows Camera', 'Large-Format View Camera', 'Old camera'),
  intro: m(
    "Wow, an old camera made of wood and shiny brass! Let's explore!",
    'This antique bellows camera is pure optics: a lens bends light, a stretchy bellows focuses it, and the image appears upside down on glass.',
    'An antique large-format view camera: brass lens on a lens board, leather bellows, wooden bed and standards, a ground-glass back, on a wooden tripod.',
    "This is an old camera. Let's look at it one part at a time.",
  ),
  causeAndEffect:
    'Light from the scene -> Lens refracts and focuses it -> Bellows set focus distance -> Image lands upside-down on the ground glass / film',
  sources: [wiki('View camera', 'View_camera'), wiki('Large format', 'Large_format'), wiki('Camera lens', 'Camera_lens')],
  parts: [
    part(
      'lens',
      m("Camera's eye", 'Lens', 'Brass lens and shutter', 'Lens'),
      m("The camera's shiny eye", 'Refracts light to focus an image', 'Brass-barrel lens on lens board; leaf shutter and iris in f-stops', 'Lets the light in'),
      m(
        "The shiny lens is the camera's eye, peeking at the world!",
        'Curved glass bends (refracts) light so rays from each point of the scene meet again at one point behind the lens, forming an image; its focal length sets how far behind. The aperture (hole size) and shutter (open time) together control how much light reaches the film, the exposure.',
        'A brass-barrel lens mounted on a removable lens board, on many cameras with a leaf shutter of interlocking blades and an iris diaphragm marked in f-stops (f-number = focal length / aperture diameter). Each full stop halves or doubles the light reaching the film.',
        'Step 1: This round glass at the front is the lens; it lets light into the camera.',
      ),
    ),
    part(
      'bellows',
      m('Stretchy bellows', 'Bellows', 'Bellows', 'Folding part'),
      m('Stretches like an accordion', 'Sets lens-to-film distance for sharp focus', 'Light-tight pleated leather bellows; extension sets focus and magnification', 'Slides to sharpen picture'),
      m(
        'The bellows squish and stretch like an accordion to make pictures sharp!',
        'Close objects focus farther behind the lens than distant ones, so you stretch or squeeze the bellows to change the lens-to-film distance until the image is sharp. The folds keep the tunnel light-tight while its length changes.',
        'Pleated leather or cloth bellows form a flexible light-tight chamber between the front and rear standards. Bellows draw (maximum extension) limits close focusing: at 1:1 magnification the lens sits at twice its focal length from the film, costing two stops of light.',
        'Step 2: This folding part slides in and out to make the picture sharp.',
      ),
    ),
    part(
      'body',
      m('Wooden body', 'Wooden frame', 'Bed and standards', 'Wooden body'),
      m('Wooden frame holds everything', 'Rigid frame keeps lens and back aligned', 'Wooden bed and standards; rack-and-pinion focus, often rise, tilt, swing', 'The wooden main part'),
      m(
        "The wooden body holds all the camera's parts, like a little house!",
        'The rigid wooden frame keeps the lens and the back exactly lined up; if they wobbled even a millimeter the image would blur. Wood is light, stiff and easy to shape, which is why early cameras used it.',
        'A folding wooden bed (often mahogany with brass fittings) carries the front standard on a rack-and-pinion or sliding rail. Many view cameras offer movements such as rise, shift, tilt and swing to control perspective and the plane of focus (the Scheimpflug principle).',
        'Step 3: This wooden box is the main body that holds everything together.',
      ),
    ),
    part(
      'back',
      m('Picture window', 'Ground-glass back', 'Ground-glass back', 'Back glass'),
      m('Shows an upside-down picture', 'Ground glass shows the inverted focused image', 'Ground-glass focusing screen; spring back accepts sheet-film holders', 'Where the picture shows'),
      m(
        'At the back, the picture shows up upside down on frosty glass, silly!',
        'Light rays cross as they pass through the lens, so the image lands upside down and flipped left to right on the frosted ground glass. Its rough surface scatters the light so you can see the image; you focus there, then put film in the exact same spot.',
        'The rear standard holds a ground-glass focusing screen, viewed under a dark cloth, often with a loupe. A spring back lets a film holder slide in at the same plane as the ground glass; you pull the dark slide, expose, then reinsert it.',
        'Step 4: Look at the glass at the back to see the picture before you take it.',
      ),
    ),
    part(
      'tripod',
      m('Three legs', 'Tripod', 'Wooden tripod', 'Legs'),
      m('Three legs hold steady', 'Three points make a stable, still stand', 'Wooden folding tripod; 3/8-inch or 1/4-inch mounting screw', 'Holds the camera still'),
      m(
        'The tripod has three tall legs so the camera stands super still!',
        'Three points always define a plane, so a tripod does not wobble even on uneven ground. Old film needed long exposures, sometimes seconds, and any movement during that time smears the image.',
        'A wooden tripod with adjustable folding legs supports the camera for exposures from fractions of a second to many seconds. The camera attaches through a threaded mount on the tripod head (3/8-inch on most large-format gear, 1/4-inch on smaller cameras).',
        'Step 5: The three legs hold the camera still, so your photo is not blurry.',
      ),
      m(
        'Keep fingers away when the legs fold up. Snap!',
        "Folding legs and leg clamps can pinch fingers. Hold the legs from the outside when you open or close them, and spread them fully so the heavy camera can't tip.",
        'Leg joints and locks are pinch points: keep fingers clear when collapsing, extend the legs fully on stable ground, and keep a hand on a heavy camera until the head is locked.',
        'Keep your fingers clear when you fold the legs.',
      ),
    ),
  ],
  quiz: [
    q(
      'camera-q1',
      'lens',
      m(
        "Can you tap the camera's eye?",
        'Your photo is in focus but far too dark. Which part would you open up to let in more light?',
        'Before you pull the dark slide, which part must have its shutter closed and its aperture set?',
        "Let's try it together: tap the round glass at the front.",
      ),
      m("It's the shiny round part at the front!", 'Look for the part with the adjustable hole (the aperture).', 'It is mounted on the front lens board.', 'It is at the front of the camera.'),
      m(
        "Yay! You found the camera's eye! 🎉",
        'Right: a wider aperture lets more light through the lens, so the exposure gets brighter.',
        'Correct: close the shutter and set the f-stop on the lens before exposing the film.',
        'Well done, that is the lens.',
      ),
    ),
    q(
      'camera-q2',
      'bellows',
      m(
        'Can you tap the stretchy accordion part?',
        'Your photo is blurry. Which part do you adjust to change the focus distance?',
        'A 1:1 close-up needs about twice the focal length of extension. Which part must have enough draw?',
        "Let's try it together: tap the folding part in the middle.",
      ),
      m("It's the bumpy part between the front and back!", 'It changes the distance between lens and film.', 'It joins the front and rear standards.', 'It is in the middle.'),
      m(
        'Great job! Those are the bellows! 🪗',
        'Yes: changing the bellows length moves the lens until the focused image lands exactly on the film.',
        'Correct: bellows draw sets the lens-to-film distance, and longer draw needs more exposure.',
        'Well done, that is the folding part.',
      ),
    ),
    q(
      'camera-q3',
      'tripod',
      m(
        "Can you tap the camera's three legs?",
        'Your long-exposure photo came out smeared even though it was focused. Which part would you check first?',
        'Before stepping away from the camera, which part should be fully spread and locked on stable ground?',
        "Let's try it together: tap the legs that hold the camera.",
      ),
      m('Look way down at the bottom!', 'Something moved while the shutter was open.', 'It is the support under the camera.', 'They are at the bottom.'),
      m(
        'You did it! Those are the legs! 🎉',
        'Right: a steady tripod stops the camera moving while the shutter is open, so light from each point stays in one spot.',
        'Correct: a locked, fully spread tripod prevents tipping and camera shake.',
        'Well done, those are the legs.',
      ),
    ),
  ],
}

// ---------------------------------------------------------------- book
const book: ObjectLesson = {
  id: 'book',
  kind: 'template',
  templateId: 'book',
  source: 'template',
  emoji: '📖',
  title: m('Story Book', 'Book', 'Hardcover Book', 'Book'),
  intro: m(
    "A book! Books hold whole worlds inside. Let's find its parts!",
    'A book is a piece of engineering: a hinge, a protective shell and hundreds of paper sheets that must open flat without falling apart.',
    'A bound book: case or cover, spine and binding, text block of paper, and a ribbon marker.',
    "This is a book. Let's look at it one part at a time.",
  ),
  causeAndEffect: 'Open the cover -> the spine flexes like a hinge -> glued or sewn pages fan out without tearing loose',
  sources: [wiki('Bookbinding', 'Bookbinding'), wiki('Book', 'Book'), wiki('Paper', 'Paper')],
  parts: [
    part(
      'cover',
      m('Cover', 'Cover', 'Case cover', 'Cover'),
      m("The book's cozy coat", 'Stiff board spreads out impact forces', 'Binder board, 2-3 mm, wrapped in cloth or laminated paper', 'The front of the book'),
      m(
        "The cover is the book's cozy coat that keeps pages safe!",
        'Stiff board resists bending, so knocks and drops are spread out instead of creasing the pages. A shiny laminate coating repels water and scuffs.',
        'Hardcovers use binder board (dense recycled paperboard about 2 to 3 mm thick) wrapped in cloth or printed paper; paperbacks use heavy cover stock, often laminated. The cover protects the text block and carries the title and author.',
        'Step 1: The front cover shows the name of the book.',
      ),
    ),
    part(
      'spine',
      m('Spine', 'Spine', 'Spine and binding', 'Spine'),
      m("The book's strong backbone", 'Flexible hinge that anchors every page', 'Sewn signatures or perfect binding with hot-melt or PUR adhesive', 'The edge on the shelf'),
      m(
        "The spine is the book's backbone, holding every page together!",
        'The spine works as a hinge. Glue or stitching anchors every page to it, so when you open the book it flexes and the pages fan out instead of ripping out.',
        'The text block is attached at the spine by sewing folded signatures (commonly 16 or 32 pages each) or by perfect binding with hot-melt or PUR adhesive. The printed spine identifies the book when it is shelved.',
        'Step 2: The spine is the edge with the title that faces out on a shelf.',
      ),
    ),
    part(
      'pages',
      m('Pages', 'Pages', 'Text block', 'Pages'),
      m('Where the story lives', 'Mats of cellulose fibers that soak up ink', 'Uncoated wood-pulp paper, 50-90 gsm; acid-free resists yellowing', 'The pages you read'),
      m(
        'The pages are where the story lives, so turn them gently!',
        'Paper is a mat of tangled cellulose fibers from wood, and ink soaks into the gaps between them and dries. Acid in cheap paper slowly breaks those fibers, which is why old books turn yellow and brittle.',
        'Book pages are usually uncoated wood-pulp paper around 50 to 90 gsm; acid-free paper resists yellowing for decades. Pages are printed on large sheets that are folded, gathered and trimmed into signatures.',
        'Step 3: Open the book and turn the pages from the corner.',
      ),
    ),
    part(
      'bookmark',
      m('Bookmark', 'Ribbon bookmark', 'Ribbon marker', 'Bookmark'),
      m('Saves your reading spot', 'Friction from closed pages holds it', 'Satin or grosgrain ribbon glued into the spine head', 'Keeps your place'),
      m(
        'The bookmark saves your spot for next time, like magic!',
        'The ribbon is glued to the top of the spine, and the closed pages press on it from both sides. That friction pinches it in place, so it cannot slip out.',
        'A ribbon marker is a narrow satin or grosgrain ribbon glued into the head of the spine during binding, common on hardcovers, dictionaries and planners. Loose bookmarks are usually card stock.',
        'Step 4: Lay the ribbon in your page so you can find your place later.',
      ),
    ),
  ],
  quiz: [
    q(
      'book-q1',
      'spine',
      m(
        "Can you tap the book's backbone?",
        'Pages keep falling out of your book. Which part would you check first?',
        'You need an old hardcover to lie fully flat for scanning. Which part risks cracking?',
        "Let's try it together: tap the edge with the title on it.",
      ),
      m("It's the edge where the pages join!", 'Find where all the pages are anchored together.', 'Look for the bound edge.', 'It is the side edge with the title.'),
      m(
        'Yay! You found the spine! 🎉',
        "Right: the spine's glue or stitching anchors every page, and when it cracks the pages come loose.",
        'Correct: forcing the spine flat can crack old adhesive, so support it at a gentler angle.',
        'Well done, that is the spine.',
      ),
    ),
    q(
      'book-q2',
      'pages',
      m(
        'Where does the story live? Tap it!',
        'The pages of an old book turned yellow and brittle. Which part is breaking down?',
        'A book got soaked. Which part must you dry first to prevent mold and cockling?',
        "Let's try it together: tap the pages you read.",
      ),
      m('There are lots and lots of them!', 'There are hundreds of thin sheets of it.', 'It is the stack of printed signatures.', 'They are the thin sheets inside.'),
      m(
        'Hooray! Those are the pages! 📚',
        'Yes: acids in the paper slowly break the cellulose fibers, so the pages yellow and weaken.',
        'Correct: the paper text block absorbs water, so interleave it and air-dry it promptly.',
        'Well done, those are the pages.',
      ),
    ),
    q(
      'book-q3',
      'bookmark',
      m(
        'Which part saves your spot?',
        'You keep losing your page when the book is shut. Which part should stay put by friction?',
        'To avoid dog-earing pages, which built-in feature should you use?',
        "Let's try it together: tap the ribbon that keeps your place.",
      ),
      m('It looks like a little ribbon!', 'It is thin and sticks out of the pages.', 'It is attached at the head of the spine.', 'It is the ribbon.'),
      m(
        'You did it! That is the bookmark! 🔖',
        'Right: the closed pages pinch the ribbon, and friction holds it in place.',
        'Correct: the ribbon marker saves your place without damaging the paper.',
        'Well done, that is the bookmark.',
      ),
    ),
  ],
}

// ---------------------------------------------------------------- phone
const phone: ObjectLesson = {
  id: 'phone',
  kind: 'template',
  templateId: 'phone',
  source: 'template',
  emoji: '📱',
  title: m('Phone', 'Smartphone', 'Smartphone', 'Phone'),
  intro: m(
    "Wow, a phone! It's like a tiny computer in your hand. Let's explore!",
    "A smartphone packs a touch sensor, a camera, switches and a lithium-ion battery into a few millimeters. Let's see how each works.",
    'A smartphone: display and touch layer, camera module, side keys, USB-C port and a lithium-ion battery.',
    "This is a phone. Let's look at it one part at a time.",
  ),
  causeAndEffect: 'Your finger touches the glass -> it changes a tiny electric field -> sensors find the spot -> the phone responds',
  sources: [wiki('Smartphone', 'Smartphone'), wiki('Touchscreen', 'Touchscreen'), wiki('Lithium-ion battery', 'Lithium-ion_battery')],
  parts: [
    part(
      'screen',
      m('Screen', 'Touchscreen', 'Display and touch panel', 'Screen'),
      m('Shows pictures, feels taps', "Senses your finger's electric field change", 'OLED/LCD under capacitive touch and ion-exchanged aluminosilicate glass', 'The glass you tap'),
      m(
        'The screen lights up and can feel your finger tap, tap, tap!',
        'Your finger conducts electricity. When it touches the glass, it disturbs a tiny electric field in a grid of sensors underneath, and the phone works out where you tapped from which sensors changed.',
        'An OLED or LCD panel under a projected-capacitive touch layer. The cover is chemically strengthened aluminosilicate glass: ion exchange puts its surface in compression so it resists scratches and cracks.',
        'Step 1: The big glass on the front is the screen; tap it gently.',
      ),
    ),
    part(
      'camera',
      m('Camera', 'Camera', 'Camera module', 'Camera'),
      m("The phone's little eye", 'Lens focuses light onto a pixel sensor', 'Multi-element lens, CMOS sensor, computational HDR processing', 'Takes your pictures'),
      m(
        "The camera is the phone's little eye that snaps photos!",
        'The lens bends incoming light to focus it onto an image sensor. Millions of tiny pixels each turn the light hitting them into an electric signal, and the processor builds a photo from those signals.',
        'A multi-element lens focuses light onto a CMOS image sensor with a color filter array. Phones combine modules (wide, ultra-wide, telephoto) and use computational photography such as multi-frame HDR and noise reduction.',
        'Step 2: The small round window on the back takes pictures.',
      ),
    ),
    part(
      'side-button',
      m('Side button', 'Side button', 'Side key (power/volume)', 'Side button'),
      m('Wakes the phone up', 'Pressing a metal dome closes a circuit', 'Tactile dome switch on a flex circuit, gasket-sealed', 'Turns the screen on'),
      m(
        'Press the side button to wake the phone up or let it nap!',
        'Pressing the button pushes a tiny metal dome down onto a circuit, closing a switch. That signal tells the processor to wake, sleep or change the volume.',
        'Side keys are typically tactile metal-dome switches on a flex circuit, sealed with gaskets for water resistance. Long-press combinations trigger power-off, screenshots or emergency SOS.',
        'Step 3: Press the button on the side to turn the screen on or off.',
      ),
    ),
    part(
      'charging-port',
      m('Charging hole', 'Charging port', 'USB-C port', 'Charging hole'),
      m('Where the cable goes', 'Negotiates a safe voltage, then current flows', '24-pin USB-C; Power Delivery starts at 5V, negotiates higher', 'Plug the cable here'),
      m(
        'The charging cable goes in this little hole to feed the phone!',
        'When you plug in, the phone and charger first "talk" over extra pins to agree on a safe voltage. Then electric current flows through the port into the battery.',
        'Most current phones use a 24-pin reversible USB-C receptacle carrying power and data. With USB Power Delivery the supply starts at 5V and only steps up (for example to 9V) after the phone and charger negotiate it.',
        'Step 4: Plug your charging cable into the hole at the bottom.',
      ),
    ),
    part(
      'battery',
      m('Battery', 'Battery', 'Lithium-ion battery', 'Battery'),
      m('Stores energy for later', 'Lithium ions shuttle between electrodes storing energy', 'Li-ion polymer pouch, 3.7V nominal, about 3,000-5,000 mAh', 'Keeps the phone running'),
      m(
        'The battery is a lunchbox full of power for the phone!',
        'Charging pushes lithium ions from the positive electrode through an electrolyte into the graphite negative electrode. When you use the phone they flow back, and that pushes electrons through the circuits as current.',
        'A lithium-ion polymer pouch cell, 3.7V nominal (about 4.2 to 4.4V full), typically 3,000 to 5,000 mAh. A protection circuit prevents overcharge, over-discharge and short circuits, and capacity slowly fades over hundreds of cycles.',
        'Step 5: The battery inside keeps the phone running; charge it when it runs low.',
      ),
      m(
        'Never bend or poke a phone. If it looks puffy, tell a grown-up!',
        'Lithium-ion cells store a lot of energy. Bending, puncturing or overheating them (like charging under a pillow) can start a fire. If the phone bulges, stop using it and tell an adult.',
        "Damaged Li-ion cells can go into thermal runaway. Don't puncture or bend the device or charge it under bedding; if the battery swells, power off, stop charging and have it replaced professionally.",
        "Don't charge your phone under a pillow, and get help if it looks swollen.",
      ),
    ),
  ],
  quiz: [
    q(
      'phone-q1',
      'screen',
      m(
        'Can you tap the screen?',
        'Your phone ignores your taps while you wear wool gloves. Which part cannot sense you?',
        'The cover glass has a crack across it. Which part should you stop pressing on and get replaced?',
        "Let's try it together: tap the big glass on the front.",
      ),
      m("It's the big shiny glass part!", 'It is the part you touch most often.', 'It covers most of the front face.', 'It is the big glass on the front.'),
      m(
        'Yay! You found the screen! 🎉',
        'Right: the capacitive screen senses the electric field change from conductive skin, and wool insulates your finger.',
        'Correct: cracked glass can cut fingers and lets moisture into the display, so have it replaced.',
        'Well done, that is the screen.',
      ),
    ),
    q(
      'phone-q2',
      'charging-port',
      m(
        'Where does the cable go? Tap it!',
        "Your phone won't charge. Which part would you check first?",
        'The phone only charges slowly on a fast charger. Which interface may be failing to negotiate Power Delivery?',
        "Let's try it together: tap the hole where the cable goes.",
      ),
      m("It's a tiny hole at the bottom!", 'Pocket lint often collects inside it.', 'It is on the bottom edge.', 'It is the small hole at the bottom.'),
      m(
        'Great job! That is the charging hole! 🔌',
        "Right: if lint blocks the port, the pins can't connect, so no current can reach the battery.",
        'Correct: the USB-C port and cable must negotiate PD before the charger raises the voltage.',
        'Well done, that is the charging hole.',
      ),
    ),
    q(
      'phone-q3',
      'battery',
      m(
        'Which part holds the energy?',
        'The back of your phone is bulging and it feels hot. Which part is the likely cause?',
        'The phone case is bulging. Which component should you stop charging and have replaced?',
        "Let's try it together: tap the battery inside.",
      ),
      m("It's hiding inside the phone!", 'It is the biggest part inside the case.', 'It is the large flat pouch inside.', 'It is inside the phone.'),
      m(
        'You did it! That is the battery! 🔋',
        'Yes: a damaged lithium-ion cell can build up gas and swell, and it can overheat, so stop using it.',
        'Correct: a swollen Li-ion cell risks thermal runaway, so power off and get it serviced.',
        'Well done, that is the battery.',
      ),
    ),
  ],
}

// ---------------------------------------------------------------- charger
const charger: ObjectLesson = {
  id: 'charger',
  kind: 'template',
  templateId: 'charger',
  source: 'template',
  emoji: '🔌',
  title: m('Charger', 'Wall Charger', 'USB-C Power Adapter', 'Charger'),
  intro: m(
    "A charger! It gives phones their energy. Let's look closely!",
    'Your wall socket gives high-voltage AC, but your phone needs low-voltage DC. This little box does the conversion.',
    'A USB-C wall adapter: mains prongs, a switch-mode power supply in the casing, a Power Delivery port and an indicator LED.',
    "This is a charger. Let's look at it one part at a time.",
  ),
  causeAndEffect: 'Wall AC enters the prongs -> circuits in the casing convert it to low-voltage DC -> USB-C sends it to the phone battery',
  sources: [wiki('USB-C', 'USB-C'), wiki('Switched-mode power supply', 'Switched-mode_power_supply'), wiki('AC adapter', 'AC_adapter')],
  parts: [
    part(
      'prongs',
      m('Metal prongs', 'Prongs', 'Mains plug pins', 'Plug'),
      m('Goes into the wall', 'Conduct alternating current from the wall socket', 'Plated brass pins; 100-240V AC, 50/60 Hz input', 'Goes into the wall'),
      m(
        'The metal prongs plug into the wall to grab electricity!',
        "The prongs connect to the socket's alternating current, where the voltage swings back and forth many times a second (60 in North America, 50 in many other places). That is the raw energy the charger converts.",
        'Plated brass pins sized to the regional plug standard (for example Type A in North America) carrying mains AC. Most modern adapters accept 100 to 240V at 50/60 Hz, so they work worldwide with only a plug adapter.',
        'Step 1: Push the metal prongs into the wall socket, holding the plastic part.',
      ),
      m(
        'Only grown-ups plug it in. Never touch the metal prongs!',
        'Hold the charger by its plastic body when plugging in or unplugging, and never touch the metal while it is partly in the socket.',
        'Grip the insulated housing, not the pins, when inserting or removing it; replace any charger with bent pins or a cracked case.',
        'Hold the plastic part, not the metal, when you plug it in.',
      ),
    ),
    part(
      'casing',
      m('Plastic box', 'Casing', 'Housing and power supply', 'Charger box'),
      m('Changes electricity inside it', 'Converts high-voltage AC into low-voltage DC', 'Flame-retardant polycarbonate housing; switch-mode supply, often GaN transistors', 'The main charger box'),
      m(
        'Inside this plastic box, electricity gets changed just right for your phone!',
        'Inside, the charger turns wall AC into DC: it straightens the current, chops it very fast through a tiny transformer to lower the voltage, then smooths it into steady DC. Faster chopping allows a smaller transformer, which is why chargers keep shrinking.',
        'The flame-retardant polycarbonate housing (often UL 94 V-0) encloses a switch-mode power supply: AC is rectified, switched at high frequency through a small transformer, then rectified and regulated to DC. Gallium nitride (GaN) transistors let modern chargers run smaller and cooler.',
        'Step 2: The plastic box is the main part of the charger.',
      ),
    ),
    part(
      'usbc-port',
      m('Cable hole', 'USB-C port', 'USB-C PD port', 'Cable hole'),
      m('Your cable plugs here', 'Negotiates higher voltage for faster charging', 'USB-C PD: 5V default, up to 20V/5A (100W); EPR to 48V', 'Plug the cable here'),
      m(
        'Your cable plugs in here, and it fits either way up!',
        'The charger and phone talk through a special pin: the phone says what it can handle, and only then does the charger raise the voltage. Power equals voltage times current (P = V x I), so more voltage means faster charging.',
        'A USB-C receptacle supporting USB Power Delivery: it starts at 5V and, after negotiation over the CC line, can supply fixed levels such as 9V, 15V or 20V (up to 100W at 20V/5A with an e-marked cable; EPR extends to 48V and 240W).',
        'Step 3: Plug the charging cable into the hole on the charger.',
      ),
    ),
    part(
      'led',
      m('Little light', 'LED', 'Indicator LED', 'Light'),
      m('Glows when it works', 'Semiconductor turns electric current into light', 'Low-current indicator LED on the DC side', 'Shows it is on'),
      m(
        'The tiny light glows to say the charger is working!',
        'An LED is a semiconductor. When current flows through it, electrons drop to a lower energy level and release that energy as light, and the color depends on the material.',
        "A low-current indicator LED driven from the DC side, often showing power or charge state. Light is emitted when electrons recombine with holes across the diode's semiconductor junction; the band gap sets the color.",
        'Step 4: If the small light is on, the charger has power.',
      ),
    ),
  ],
  quiz: [
    q(
      'charger-q1',
      'prongs',
      m(
        'Can you tap the metal prongs?',
        'Your charger crackles and feels loose in the socket. Which part would you check first?',
        "Before plugging in, which part should you check for bending and never touch while it's half inserted?",
        "Let's try it together: tap the metal prongs.",
      ),
      m('They are shiny metal sticks!', 'It is the only part that touches the socket.', 'They are the plug pins.', 'They are the metal pieces.'),
      m(
        'Yay! You found the prongs! 🎉',
        'Right: bent or loose prongs make poor contact, so current arcs across the gap and heats up.',
        'Correct: inspect the pins and grip the insulated housing when inserting.',
        'Well done, that is the plug.',
      ),
    ),
    q(
      'charger-q2',
      'casing',
      m(
        'Where does the magic happen inside?',
        'Your charger gets very hot. Which part holds the AC-to-DC circuits that might be failing?',
        'You can see components through a crack. Which damaged part means the charger must be retired?',
        "Let's try it together: tap the main plastic box.",
      ),
      m("It's the big plastic box!", 'The conversion circuits are hidden inside it.', 'It contains the transformer and rectifiers.', 'It is the biggest part.'),
      m(
        'Hooray! That box changes the electricity! ⚡',
        'Yes: the circuits in the casing convert AC to DC, and energy wasted in that conversion becomes heat.',
        'Correct: a damaged housing can expose mains voltage, so replace the charger.',
        'Well done, that is the charger box.',
      ),
    ),
    q(
      'charger-q3',
      'usbc-port',
      m(
        'Where does the cable plug in?',
        'Your phone charges slowly on this charger. Which part negotiates the voltage?',
        'To deliver more than 60W at 20V, which output needs a 5A e-marked cable?',
        "Let's try it together: tap the hole where the cable goes.",
      ),
      m("It's a small oval hole!", 'Look for the oval opening.', 'It is the oval receptacle.', 'It is the small hole.'),
      m(
        'You did it! That is the cable hole! 🔌',
        'Right: the USB-C port negotiates voltage with the phone, and more voltage at the same current means more power (P = V x I).',
        'Correct: USB-C PD is limited to 3A (60W at 20V) unless a 5A e-marked cable is detected.',
        'Well done, that is the cable hole.',
      ),
    ),
  ],
}

// ---------------------------------------------------------------- mug
const mug: ObjectLesson = {
  id: 'mug',
  kind: 'template',
  templateId: 'mug',
  source: 'template',
  emoji: '☕',
  title: m('Mug', 'Ceramic Mug', 'Stoneware Mug', 'Mug'),
  intro: m(
    "A mug! It holds warm cocoa and tea. Let's find its parts!",
    'A mug is a lesson in heat: how it is stored, how it travels, and how a handle keeps it away from your hand.',
    'A fired ceramic mug: handle, glazed rim, vitrified body and unglazed foot ring.',
    "This is a mug. Let's look at it one part at a time.",
  ),
  causeAndEffect: 'Hot drink heats the thick wall -> ceramic conducts heat slowly -> the handle stays cool enough to hold',
  sources: [wiki('Mug', 'Mug'), wiki('Stoneware', 'Stoneware'), wiki('Ceramic glaze', 'Ceramic_glaze')],
  parts: [
    part(
      'handle',
      m('Handle', 'Handle', 'Handle', 'Handle'),
      m('Hold it right here', 'Long ceramic path slows the heat flow', 'Slip-joined handle; ceramic conducts about 1-1.5 W/m·K', 'Hold it here'),
      m(
        'Hold the handle, it stays cool so your hand stays happy!',
        'Ceramic conducts heat poorly, and the handle sticks out away from the hot liquid. Heat has to travel a long, thin path and most of it escapes into the air before reaching your fingers.',
        "The handle is cast or pulled separately and joined to the body with slip before firing. Its offset from the wall and ceramic's low thermal conductivity (roughly 1 to 1.5 W/m·K) keep it cool enough to hold.",
        'Step 1: Hold the mug by the handle on its side.',
      ),
    ),
    part(
      'rim',
      m('Rim', 'Rim', 'Glazed rim', 'Top edge'),
      m('Where you take sips', 'Rounded glazed edge guides the liquid', 'Smoothed rim with lead-free, food-safe glaze', 'Where you sip'),
      m(
        'The round rim is where your lips take a sip!',
        'A rounded rim spreads pressure gently on your lips and guides the drink in a smooth stream. Glaze makes it glassy and non-porous, so germs have nowhere to hide.',
        'The rim is sponged or rolled smooth before glazing; once fired, the glaze forms a non-porous glassy layer. Glazes for food contact should be lead-free and rated food-safe.',
        'Step 2: Sip slowly from the smooth top edge.',
      ),
      m(
        'Hot drinks can be very hot. Blow and sip slowly!',
        'Drinks just off the boil can scald skin. Test with a tiny sip first.',
        'Freshly poured drinks can be 80 to 90 °C, hot enough to scald in seconds; let them cool before sipping.',
        'Take a small sip first; it may be very hot.',
      ),
    ),
    part(
      'body',
      m('Cup part', 'Body', 'Vitrified body', 'Cup'),
      m('Holds your warm drink', 'Thick wall stores heat and releases it slowly', 'Vitrified stoneware or porcelain, fired about 1,200-1,300 °C', 'Holds the drink'),
      m(
        'The body holds your warm cocoa like a cozy hug!',
        'The thick ceramic wall soaks up heat and gives it back slowly, so your drink cools gradually. Most heat actually escapes from the open top as steam evaporates.',
        'Stoneware or porcelain fired at roughly 1,200 to 1,300 °C vitrifies into a dense, low-porosity body, and glaze seals the surface. Most ceramic mugs are microwave-safe unless they have metallic decoration.',
        'Step 3: Pour your drink into the cup part, not too full.',
      ),
      m(
        'Carry hot mugs slowly, with two hands!',
        'A full mug of hot liquid can spill and burn, so carry it slowly and keep it away from table edges.',
        'Mug walls can reach scald temperatures with a fresh pour; avoid freezer-to-microwave shocks that can crack the ceramic.',
        'Carry it slowly; the mug can be hot.',
      ),
    ),
    part(
      'base',
      m('Bottom', 'Base', 'Foot ring', 'Bottom'),
      m('Keeps it from tipping', 'Wide base lowers the center of gravity', 'Unglazed foot ring; base-to-height ratio sets tip resistance', 'Keeps it steady'),
      m(
        'The flat bottom keeps the mug from tipping, wobble-free!',
        'A wide, flat base lowers the center of gravity and widens the footprint, so the mug resists tipping. The bare ring underneath stops the glaze from sticking to the kiln during firing.',
        'The unglazed foot ring prevents glaze from fusing to the kiln shelf and gives a slightly raised, stable contact surface. The ratio of base diameter to height largely sets how easily it tips.',
        'Step 4: Set the mug down on its flat bottom, on a flat table.',
      ),
    ),
  ],
  quiz: [
    q(
      'mug-q1',
      'handle',
      m(
        'Can you tap the handle?',
        'You burned your fingers grabbing the mug. Which part should you have held instead?',
        'There is a hairline crack where one part joins the body. Which part makes this mug unsafe for hot drinks?',
        "Let's try it together: tap the handle.",
      ),
      m("It's the loop on the side!", 'It sticks out from the side.', 'It is the loop on the side.', 'It is the loop on the side.'),
      m(
        'Yay! You found the handle! 🎉',
        "Right: ceramic conducts heat slowly, and the handle's long path lets heat escape before it reaches you.",
        'Correct: a cracked handle can snap under load and spill hot liquid, so retire the mug.',
        'Well done, that is the handle.',
      ),
    ),
    q(
      'mug-q2',
      'rim',
      m(
        'Where do you sip? Tap it!',
        'Your lip got scratched while drinking. Which part would you check for a chip?',
        'Which part should you inspect for chips before serving a hot drink?',
        "Let's try it together: tap the top edge where you sip.",
      ),
      m("It's the round top edge!", 'It is the edge your lips touch.', 'It is the uppermost edge.', 'It is at the very top.'),
      m(
        'Great job! That is the rim! ☕',
        'Right: a chip breaks the smooth glaze on the rim, leaving a sharp edge and a porous spot for germs.',
        'Correct: chipped rims cut lips and expose porous ceramic, so retire chipped mugs.',
        'Well done, that is the top edge.',
      ),
    ),
    q(
      'mug-q3',
      'base',
      m(
        'Which part keeps the mug from falling over?',
        'Your full mug keeps tipping over on the desk. Which part decides how stable it is?',
        'A mug rocks on the table. Which part should you check before filling it with a hot drink?',
        "Let's try it together: tap the bottom of the mug.",
      ),
      m('Look way down low!', 'Look underneath.', 'It is the contact surface underneath.', 'It is at the very bottom.'),
      m(
        'You did it! That is the bottom! 🎉',
        'Yes: a wider base lowers the center of gravity and widens the footprint, so it tips less easily.',
        "Correct: an uneven foot ring makes the mug unstable, so don't use it for hot liquids.",
        'Well done, that is the bottom.',
      ),
    ),
  ],
}

// ---------------------------------------------------------------- pencil
const pencil: ObjectLesson = {
  id: 'pencil',
  kind: 'template',
  templateId: 'pencil',
  source: 'template',
  emoji: '✏️',
  title: m('Pencil', 'Pencil', 'Graphite Pencil', 'Pencil'),
  intro: m(
    "A pencil! Let's draw a happy face, then look at all its parts!",
    'A pencil is a tiny materials-science kit: sliding carbon layers, friction, and a metal clamp.',
    'A wood-cased graphite pencil: eraser, crimped ferrule, cedar barrel and a graphite-clay core.',
    "This is a pencil. Let's look at it one part at a time.",
  ),
  causeAndEffect: 'Press the tip on paper -> graphite layers slide off -> a gray line is left behind',
  sources: [wiki('Pencil', 'Pencil'), wiki('Graphite', 'Graphite'), wiki('Eraser', 'Eraser')],
  parts: [
    part(
      'eraser',
      m('Eraser', 'Eraser', 'Eraser plug', 'Eraser'),
      m('Rubs away mistakes', 'Friction lifts graphite flakes off paper', 'Synthetic rubber or vinyl plug, crimped into the ferrule', 'Removes pencil marks'),
      m(
        'The eraser rubs away mistakes, wiggle, wiggle!',
        'Rubbing makes friction that helps the rubber grab loose graphite flakes and pull them off the paper fibers. The crumbs carry the graphite away.',
        'Typically synthetic rubber or a vinyl compound, sometimes with a mild abrasive. Friction lifts graphite particles sitting loosely on the paper surface, and the plug is crimped into the ferrule.',
        'Step 1: Rub the eraser on the paper to remove pencil marks.',
      ),
    ),
    part(
      'ferrule',
      m('Metal ring', 'Ferrule', 'Ferrule', 'Metal band'),
      m('Holds the eraser on', 'Crimped metal locks eraser to wood', 'Crimped aluminum or brass band with gripping ridges', 'Holds the eraser'),
      m(
        'The shiny metal ring hugs the eraser tight!',
        'The metal band is squeezed (crimped) around both the wood and the eraser, so grooves and friction lock them together. Metal works because it bends once and then stays put.',
        'A crimped aluminum (sometimes brass) band that clamps the eraser to the wooden barrel, often with ridges that bite into both. It is usually painted or anodized.',
        'Step 2: The metal ring holds the eraser in place.',
      ),
    ),
    part(
      'wood',
      m('Wood', 'Wooden barrel', 'Cedar barrel', 'Wooden part'),
      m("The pencil's wooden jacket", 'Hexagon shape stops rolling and adds grip', 'Incense-cedar slats glued around the core, hexagonal, lacquered', 'The part you hold'),
      m(
        "The wooden jacket has flat sides, so it won't roll away!",
        'Two grooved wooden slats sandwich the core and are glued together. The six-sided shape stops the pencil from rolling and gives your fingers grip.',
        'Usually incense-cedar, chosen because it sharpens cleanly without splintering. Grooved slats sandwich the cores, are glued, then cut into hexagonal or round barrels and lacquered.',
        'Step 3: Hold the wooden part a little above the tip.',
      ),
    ),
    part(
      'tip',
      m('Tip', 'Graphite tip', 'Graphite-clay core', 'Point'),
      m('Draws lines on paper', 'Carbon layers slide off to leave marks', 'Graphite-clay core; H harder and lighter, B softer and darker', 'Writes on paper'),
      m(
        'The tip draws lines with graphite, not lead!',
        'Graphite is stacked sheets of carbon atoms that slide easily over each other. Pressing on paper shears flakes off to leave a mark, and adding clay makes the core harder and the line lighter.',
        'The core is a fired mix of graphite and clay: more clay makes it harder and lighter (H grades), more graphite softer and darker (B grades), with HB in the middle. Despite the name, pencil "lead" contains no lead.',
        'Step 4: Press the tip gently on the paper to write.',
      ),
      m(
        'The tip is pointy. Walk, never run, with a pencil!',
        'A sharpened tip can poke skin, so carry pencils point-down and never run with them.',
        'A sharp point can puncture skin; graphite is non-toxic and contains no lead, but clean any puncture wound well.',
        'The tip is sharp, so hold it carefully.',
      ),
    ),
  ],
  quiz: [
    q(
      'pencil-q1',
      'eraser',
      m(
        'Can you tap the eraser?',
        'Rubbing out a mistake just leaves a gray smear. Which part has worn out?',
        'Before erasing on thin paper, which part should you check is not hard or cracked?',
        "Let's try it together: tap the eraser.",
      ),
      m("It's at the other end from the tip!", 'It is at the end opposite the point.', 'It sits inside the ferrule.', 'It is at the top end.'),
      m(
        'Yay! You found the eraser! 🎉',
        'Right: a fresh eraser grips graphite flakes by friction, but a hardened one just smears them around.',
        'Correct: an aged, hardened eraser raises friction and can tear the paper.',
        'Well done, that is the eraser.',
      ),
    ),
    q(
      'pencil-q2',
      'ferrule',
      m(
        'Where is the shiny metal ring?',
        'Your eraser keeps falling off. Which part is no longer gripping it?',
        'The eraser wobbles in use. Which part needs re-crimping or the pencil replacing?',
        "Let's try it together: tap the metal ring.",
      ),
      m('It hugs the eraser!', 'It sits between two different materials.', 'It joins eraser and barrel.', 'It is next to the eraser.'),
      m(
        'Great job! That is the metal ring! ✨',
        'Yes: the crimped ferrule locks eraser and wood together with grooves and friction, so if it loosens the eraser slips out.',
        'Correct: a loose ferrule no longer clamps the eraser.',
        'Well done, that is the metal band.',
      ),
    ),
    q(
      'pencil-q3',
      'tip',
      m(
        'Which part draws the lines?',
        'Your lines look too faint. Which part would you swap for a softer B grade?',
        'When handing a sharpened pencil to someone, which part should point away from them?',
        "Let's try it together: tap the pointy tip.",
      ),
      m("It's the pointy end!", 'It is the dark, sharpened end.', 'It is exposed at the sharpened end.', 'It is the pointy end.'),
      m(
        'You did it! That is the tip! ✏️',
        'Right: a softer core has more graphite and less clay, so more carbon layers slide off and the line is darker.',
        'Correct: pass a pencil with the point toward yourself or downward to avoid punctures.',
        'Well done, that is the point.',
      ),
    ),
  ],
}

export const TEMPLATES: Record<TemplateId, ObjectLesson> = { bottle, camera, book, phone, charger, mug, pencil }

export function getTemplateLesson(id: TemplateId): ObjectLesson {
  return structuredClone(TEMPLATES[id])
}
