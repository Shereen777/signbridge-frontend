/**
 * ASL Word-Level Sign Dictionary — Comprehensive Edition
 *
 * Contains 200+ ASL word/phrase signs covering:
 *  - Greetings, farewells, social phrases
 *  - Pronouns, question words
 *  - Common verbs, adjectives, adverbs
 *  - Nouns (people, places, things, food, animals, time, etc.)
 *  - Numbers, colors, emotions, directions
 *
 * Each entry has:
 *  - label: display name
 *  - aliases: alternate words that map to the same sign
 *  - description: how the sign is performed
 *  - display: data for rendering on canvas (hand shape + position on body)
 *
 * If a word is NOT found here, the system falls back to fingerspelling.
 */

// Helper to create a hand config
function H(side, posX, posY, fingers, thumb, palmFacing, wristAngle) {
  return { side, posX, posY, fingers, thumb, palmFacing: palmFacing || 'out', wristAngle: wristAngle || 0 };
}

// Shorthand finger states
const E = 'extended', C = 'curled', HF = 'half';

const ASL_WORD_SIGNS = {

  // ========================
  //  GREETINGS & FAREWELLS
  // ========================
  hello: {
    label: 'HELLO', aliases: ['hi', 'hey', 'greetings'],
    description: 'Open hand near forehead, move outward like a salute wave',
    display: { type:'body', bodyPart:'forehead', hands:[H('right',0.65,0.18,[E,E,E,E],E,'out',0.1)], motion:'wave-out' }
  },
  goodbye: {
    label: 'GOODBYE', aliases: ['bye', 'byebye', 'farewell', 'seeya', 'see ya', 'later', 'cya'],
    description: 'Open hand, fingers together, wave by opening and closing fingers',
    display: { type:'body', bodyPart:'shoulder', hands:[H('right',0.7,0.22,[E,E,E,E],C,'out')], motion:'wave-fingers' }
  },
  welcome: {
    label: 'WELCOME', aliases: ['youre welcome', "you're welcome"],
    description: 'Open hand sweeps inward toward body',
    display: { type:'front', hands:[H('right',0.6,0.38,[E,E,E,E],E,'up')], motion:'sweep-in' }
  },
  goodmorning: {
    label: 'GOOD MORNING', aliases: ['good morning', 'morning'],
    description: 'Sign GOOD then raise flat hand like sunrise',
    display: { type:'body', bodyPart:'chin', hands:[H('right',0.52,0.32,[E,E,E,E],E,'up',-0.1)], motion:'chin-rise' }
  },
  goodnight: {
    label: 'GOOD NIGHT', aliases: ['good night', 'night', 'goodnight'],
    description: 'Sign GOOD then curved hand descends over other hand',
    display: { type:'front', hands:[H('right',0.5,0.38,[HF,HF,HF,HF],C,'down')], motion:'descend' }
  },
  goodafternoon: {
    label: 'GOOD AFTERNOON', aliases: ['good afternoon', 'afternoon'],
    description: 'Sign GOOD then forearm tilts forward at 45 degrees',
    display: { type:'body', bodyPart:'chin', hands:[H('right',0.55,0.35,[E,E,E,E],E,'down',-0.5)], motion:'tilt-forward' }
  },

  // ========================
  //  SOCIAL / COMMON PHRASES
  // ========================
  thanks: {
    label: 'THANK YOU', aliases: ['thank', 'thankyou', 'thank you', 'thanks', 'thx'],
    description: 'Flat hand touches chin then moves forward and down',
    display: { type:'body', bodyPart:'chin', hands:[H('right',0.5,0.32,[E,E,E,E],E,'up',-0.2)], motion:'chin-forward' }
  },
  please: {
    label: 'PLEASE', aliases: ['pls', 'plz'],
    description: 'Flat hand circles on chest',
    display: { type:'body', bodyPart:'chest', hands:[H('right',0.48,0.48,[E,E,E,E],E,'self')], motion:'circle-chest' }
  },
  sorry: {
    label: 'SORRY', aliases: ['apology', 'apologize', 'my bad', 'mybad'],
    description: 'A-hand (fist with thumb) circles on chest',
    display: { type:'body', bodyPart:'chest', hands:[H('right',0.48,0.48,[C,C,C,C],E,'self')], motion:'circle-chest' }
  },
  excuse: {
    label: 'EXCUSE ME', aliases: ['excuse me', 'pardon', 'pardon me'],
    description: 'Fingertips brush across open palm',
    display: { type:'front', hands:[H('left',0.4,0.42,[E,E,E,E],E,'up'), H('right',0.48,0.38,[E,E,E,E],C,'down')], motion:'brush-across' }
  },
  nice: {
    label: 'NICE', aliases: ['pleasant', 'clean'],
    description: 'One palm slides across the other palm smoothly',
    display: { type:'front', hands:[H('left',0.4,0.42,[E,E,E,E],E,'up'), H('right',0.5,0.38,[E,E,E,E],E,'down')], motion:'slide-across' }
  },
  congratulations: {
    label: 'CONGRATULATIONS', aliases: ['congrats', 'congratulate'],
    description: 'Both hands clap then shake clasped fists',
    display: { type:'front', hands:[H('left',0.4,0.38,[C,C,C,C],C,'right'), H('right',0.55,0.38,[C,C,C,C],C,'left')], motion:'shake-clasped' }
  },

  // ========================
  //  YES / NO / RESPONSES
  // ========================
  yes: {
    label: 'YES', aliases: ['yeah', 'yep', 'yup', 'correct', 'right', 'ok', 'okay', 'sure', 'alright'],
    description: 'S-hand (fist) nods up and down like a nodding head',
    display: { type:'front', hands:[H('right',0.55,0.35,[C,C,C,C],C,'out')], motion:'nod-down' }
  },
  no: {
    label: 'NO', aliases: ['nope', 'nah', 'not'],
    description: 'Index and middle finger snap to thumb',
    display: { type:'front', hands:[H('right',0.55,0.35,[E,E,C,C],E,'out')], motion:'snap-closed' }
  },
  maybe: {
    label: 'MAYBE', aliases: ['perhaps', 'possibly', 'might'],
    description: 'Both flat hands alternate up and down (weighing)',
    display: { type:'front', hands:[H('left',0.35,0.42,[E,E,E,E],E,'up'), H('right',0.6,0.38,[E,E,E,E],E,'up')], motion:'alternate-updown' }
  },
  donknow: {
    label: "DON'T KNOW", aliases: ["don't know", 'dont know', 'dunno', 'idk', "i don't know"],
    description: 'Flat hand touches forehead then flips away, palm out',
    display: { type:'body', bodyPart:'forehead', hands:[H('right',0.55,0.2,[E,E,E,E],E,'out',0.2)], motion:'forehead-flip' }
  },

  // ========================
  //  PRONOUNS
  // ========================
  i: {
    label: 'I / ME', aliases: ['me', 'myself', 'im', "i'm"],
    description: 'Point index finger at own chest',
    display: { type:'body', bodyPart:'chest', hands:[H('right',0.5,0.48,[E,C,C,C],C,'self')], motion:'point-self' }
  },
  you: {
    label: 'YOU', aliases: ['your', 'yours', "you're", 'u', 'ur'],
    description: 'Point index finger forward at the other person',
    display: { type:'front', hands:[H('right',0.55,0.38,[E,C,C,C],C,'down')], motion:'point-forward' }
  },
  he: {
    label: 'HE / SHE / THEY', aliases: ['she', 'they', 'him', 'her', 'them', 'his', 'hers', 'their'],
    description: 'Point index finger to the side',
    display: { type:'front', hands:[H('right',0.65,0.38,[E,C,C,C],C,'out')], motion:'point-side' }
  },
  we: {
    label: 'WE / US', aliases: ['us', 'our', 'ours', 'ourselves'],
    description: 'Index finger points to self then arcs to the side',
    display: { type:'body', bodyPart:'chest', hands:[H('right',0.48,0.45,[E,C,C,C],C,'self')], motion:'arc-self-to-side' }
  },

  // ========================
  //  QUESTION WORDS
  // ========================
  what: {
    label: 'WHAT', aliases: ['huh', 'whats', "what's"],
    description: 'Both palms up, shake side to side',
    display: { type:'front', hands:[H('left',0.35,0.42,[E,E,E,E],E,'up'), H('right',0.6,0.42,[E,E,E,E],E,'up')], motion:'shake-side' }
  },
  where: {
    label: 'WHERE', aliases: ["where's", 'wheres'],
    description: 'Index finger waves side to side with raised eyebrows',
    display: { type:'front', hands:[H('right',0.55,0.35,[E,C,C,C],C,'out')], motion:'wave-side' }
  },
  when: {
    label: 'WHEN', aliases: ["when's", 'whens'],
    description: 'Index finger circles then lands on other index finger',
    display: { type:'front', hands:[H('left',0.4,0.4,[E,C,C,C],C,'right'), H('right',0.55,0.35,[E,C,C,C],C,'left')], motion:'circle-land' }
  },
  why: {
    label: 'WHY', aliases: ["why's", 'whys'],
    description: 'Touch forehead with fingertips, hand drops to Y-shape',
    display: { type:'body', bodyPart:'forehead', hands:[H('right',0.55,0.2,[C,C,C,E],E,'self')], motion:'forehead-drop-Y' }
  },
  how: {
    label: 'HOW', aliases: ["how's", 'hows'],
    description: 'Both fists knuckles together, roll outward opening up',
    display: { type:'front', hands:[H('left',0.42,0.4,[HF,HF,HF,HF],C,'down',0.3), H('right',0.55,0.4,[HF,HF,HF,HF],C,'down',-0.3)], motion:'roll-open' }
  },
  who: {
    label: 'WHO', aliases: ["who's", 'whos', 'whom'],
    description: 'Index finger circles in front of pursed lips',
    display: { type:'body', bodyPart:'mouth', hands:[H('right',0.52,0.3,[E,C,C,C],C,'left')], motion:'circle-lips' }
  },
  which: {
    label: 'WHICH', aliases: [],
    description: 'Both A-hands (thumbs up fists) alternate up and down',
    display: { type:'front', hands:[H('left',0.4,0.4,[C,C,C,C],E,'in'), H('right',0.55,0.38,[C,C,C,C],E,'in')], motion:'alternate-updown' }
  },

  // ========================
  //  COMMON VERBS
  // ========================
  want: {
    label: 'WANT', aliases: ['desire', 'wish'],
    description: 'Both claw-shaped hands pull toward body',
    display: { type:'front', hands:[H('left',0.35,0.42,[HF,HF,HF,HF],E,'up'), H('right',0.6,0.42,[HF,HF,HF,HF],E,'up')], motion:'pull-toward' }
  },
  need: {
    label: 'NEED', aliases: ['must', 'have to', 'gotta', 'should', 'ought'],
    description: 'X-hand (hooked index) bends down at wrist repeatedly',
    display: { type:'front', hands:[H('right',0.55,0.38,[HF,C,C,C],C,'out',0.3)], motion:'bend-down' }
  },
  like: {
    label: 'LIKE', aliases: ['prefer', 'enjoy'],
    description: 'Thumb and middle finger pull away from chest',
    display: { type:'body', bodyPart:'chest', hands:[H('right',0.5,0.46,[E,E,C,C],E,'self')], motion:'pull-away' }
  },
  dislike: {
    label: "DON'T LIKE", aliases: ["don't like", 'dont like', 'hate', 'dislike'],
    description: 'Like LIKE but flick fingers away at end',
    display: { type:'body', bodyPart:'chest', hands:[H('right',0.5,0.46,[E,E,C,C],E,'self')], motion:'flick-away' }
  },
  love: {
    label: 'LOVE', aliases: ['adore'],
    description: 'Cross both fists over chest (hugging)',
    display: { type:'body', bodyPart:'chest', hands:[H('left',0.55,0.45,[C,C,C,C],C,'self',0.5), H('right',0.42,0.45,[C,C,C,C],C,'self',-0.5)], motion:'hug' }
  },
  iloveyou: {
    label: 'I LOVE YOU', aliases: ['ily', 'i love you', 'i love u'],
    description: 'ILY handshape: thumb + index + pinky extended, others curled',
    display: { type:'front', hands:[H('right',0.55,0.35,[E,C,C,E],E,'out')], motion:'none' }
  },
  know: {
    label: 'KNOW', aliases: ['aware', 'knowledge'],
    description: 'Flat hand taps side of forehead',
    display: { type:'body', bodyPart:'forehead', hands:[H('right',0.58,0.18,[E,E,E,E],E,'self',-0.2)], motion:'tap' }
  },
  understand: {
    label: 'UNDERSTAND', aliases: ['understood', 'get it', 'got it', 'gotcha'],
    description: 'Index finger near forehead flicks upward (lightbulb moment)',
    display: { type:'body', bodyPart:'forehead', hands:[H('right',0.58,0.2,[E,C,C,C],C,'self')], motion:'flick-up' }
  },
  learn: {
    label: 'LEARN', aliases: ['study', 'education'],
    description: 'Flat hand picks up from open palm to forehead',
    display: { type:'body', bodyPart:'forehead', hands:[H('right',0.55,0.22,[HF,HF,HF,HF],HF,'self')], motion:'grab-to-head' }
  },
  teach: {
    label: 'TEACH', aliases: ['teacher', 'instructor', 'educate'],
    description: 'Both flat-O hands at temples, move forward',
    display: { type:'body', bodyPart:'forehead', hands:[H('left',0.38,0.2,[HF,HF,HF,HF],HF,'out'), H('right',0.58,0.2,[HF,HF,HF,HF],HF,'out')], motion:'push-forward' }
  },
  think: {
    label: 'THINK', aliases: ['thought', 'thinking', 'wonder'],
    description: 'Index finger touches forehead',
    display: { type:'body', bodyPart:'forehead', hands:[H('right',0.52,0.18,[E,C,C,C],C,'self')], motion:'touch' }
  },
  remember: {
    label: 'REMEMBER', aliases: ['recall', 'memory'],
    description: 'Thumb touches forehead then moves down to other thumb',
    display: { type:'body', bodyPart:'forehead', hands:[H('right',0.55,0.2,[C,C,C,C],E,'self')], motion:'forehead-down' }
  },
  forget: {
    label: 'FORGET', aliases: ['forgot', 'forgotten'],
    description: 'Open hand wipes across forehead and closes',
    display: { type:'body', bodyPart:'forehead', hands:[H('right',0.55,0.18,[E,E,E,E],E,'self')], motion:'wipe-close' }
  },
  help: {
    label: 'HELP', aliases: ['assist', 'aid', 'support'],
    description: 'Thumbs-up (A-hand) rests on flat palm, both rise up',
    display: { type:'front', hands:[H('left',0.4,0.48,[E,E,E,E],E,'up'), H('right',0.48,0.42,[C,C,C,C],E,'left')], motion:'lift-up' }
  },
  stop: {
    label: 'STOP', aliases: ['halt', 'cease', 'enough'],
    description: 'Flat hand chops down onto open palm',
    display: { type:'front', hands:[H('left',0.4,0.45,[E,E,E,E],E,'up'), H('right',0.48,0.35,[E,E,E,E],C,'down',-1.5)], motion:'chop-down' }
  },
  go: {
    label: 'GO', aliases: ['leave', 'depart', 'proceed'],
    description: 'Both index fingers point and arc forward',
    display: { type:'front', hands:[H('left',0.4,0.4,[E,C,C,C],C,'down',-0.3), H('right',0.55,0.4,[E,C,C,C],C,'down',-0.3)], motion:'arc-forward' }
  },
  come: {
    label: 'COME', aliases: ['come here', 'approach'],
    description: 'Index finger beckons toward self',
    display: { type:'front', hands:[H('right',0.55,0.38,[E,C,C,C],C,'up')], motion:'beckon' }
  },
  eat: {
    label: 'EAT', aliases: ['food', 'meal', 'dinner', 'lunch', 'breakfast', 'hungry', 'supper'],
    description: 'Flat-O hand taps mouth repeatedly',
    display: { type:'body', bodyPart:'mouth', hands:[H('right',0.52,0.3,[HF,HF,HF,HF],HF,'self')], motion:'tap-mouth' }
  },
  drink: {
    label: 'DRINK', aliases: ['beverage', 'thirsty', 'sip'],
    description: 'C-hand tips toward mouth like drinking from a cup',
    display: { type:'body', bodyPart:'mouth', hands:[H('right',0.52,0.28,[HF,HF,HF,HF],E,'self',-0.4)], motion:'tip-to-mouth' }
  },
  water: {
    label: 'WATER', aliases: [],
    description: 'W-hand (3 fingers up) taps chin twice',
    display: { type:'body', bodyPart:'chin', hands:[H('right',0.5,0.32,[E,E,E,C],C,'self')], motion:'tap-chin' }
  },
  sleep: {
    label: 'SLEEP', aliases: ['sleepy', 'tired', 'asleep', 'nap', 'rest'],
    description: 'Open hand draws down over face, fingers close as they descend',
    display: { type:'body', bodyPart:'face', hands:[H('right',0.5,0.25,[E,E,E,E],E,'self')], motion:'face-close-down' }
  },
  wake: {
    label: 'WAKE UP', aliases: ['wake up', 'awake', 'wakeup'],
    description: 'Pinched fingers at eyes flick open',
    display: { type:'body', bodyPart:'eyes', hands:[H('right',0.55,0.22,[C,C,C,C],C,'self')], motion:'flick-open-eyes' }
  },
  work: {
    label: 'WORK', aliases: ['job', 'career', 'employment', 'working'],
    description: 'S-hand (fist) taps on other S-hand at wrist',
    display: { type:'front', hands:[H('left',0.42,0.42,[C,C,C,C],C,'down'), H('right',0.48,0.36,[C,C,C,C],C,'down')], motion:'tap-wrist' }
  },
  play: {
    label: 'PLAY', aliases: ['fun', 'game', 'playing'],
    description: 'Both Y-hands (thumb+pinky) shake back and forth',
    display: { type:'front', hands:[H('left',0.38,0.4,[C,C,C,E],E,'in'), H('right',0.58,0.4,[C,C,C,E],E,'in')], motion:'shake-twist' }
  },
  give: {
    label: 'GIVE', aliases: ['donate', 'offer', 'present', 'gift'],
    description: 'Flat-O hands move forward from body',
    display: { type:'front', hands:[H('right',0.5,0.4,[HF,HF,HF,HF],HF,'out')], motion:'push-forward' }
  },
  take: {
    label: 'TAKE', aliases: ['grab', 'get', 'receive', 'acquire'],
    description: 'Open hand grabs toward self closing into fist',
    display: { type:'front', hands:[H('right',0.55,0.4,[E,E,E,E],E,'out')], motion:'grab-toward' }
  },
  make: {
    label: 'MAKE', aliases: ['create', 'build', 'produce'],
    description: 'Both S-hands twist on top of each other',
    display: { type:'front', hands:[H('left',0.42,0.42,[C,C,C,C],C,'right'), H('right',0.48,0.36,[C,C,C,C],C,'left')], motion:'twist-stack' }
  },
  see: {
    label: 'SEE', aliases: ['look', 'watch', 'observe', 'view', 'sight'],
    description: 'V-hand (two fingers) points from eyes forward',
    display: { type:'body', bodyPart:'eyes', hands:[H('right',0.55,0.22,[E,E,C,C],C,'self')], motion:'eyes-forward' }
  },
  hear: {
    label: 'HEAR', aliases: ['hearing', 'listen', 'sound'],
    description: 'Index finger points to ear',
    display: { type:'body', bodyPart:'ear', hands:[H('right',0.65,0.22,[E,C,C,C],C,'self')], motion:'point-ear' }
  },
  say: {
    label: 'SAY', aliases: ['speak', 'talk', 'tell', 'said', 'told', 'speech', 'communicate'],
    description: 'Index finger circles forward from chin/mouth',
    display: { type:'body', bodyPart:'mouth', hands:[H('right',0.52,0.3,[E,C,C,C],C,'left')], motion:'circle-forward-mouth' }
  },
  write: {
    label: 'WRITE', aliases: ['writing', 'written', 'note'],
    description: 'Pinched fingers write on flat palm',
    display: { type:'front', hands:[H('left',0.4,0.42,[E,E,E,E],E,'up'), H('right',0.48,0.38,[HF,C,C,C],HF,'down')], motion:'write-on-palm' }
  },
  read: {
    label: 'READ', aliases: ['reading'],
    description: 'V-hand scans down open palm like reading lines',
    display: { type:'front', hands:[H('left',0.4,0.42,[E,E,E,E],E,'up'), H('right',0.48,0.36,[E,E,C,C],C,'down')], motion:'scan-down' }
  },
  walk: {
    label: 'WALK', aliases: ['walking', 'stroll'],
    description: 'Both flat hands alternate stepping forward (like feet)',
    display: { type:'front', hands:[H('left',0.42,0.45,[E,E,E,E],E,'down'), H('right',0.52,0.42,[E,E,E,E],E,'down')], motion:'step-forward' }
  },
  run: {
    label: 'RUN', aliases: ['running', 'sprint'],
    description: 'L-hands hook together, index fingers pull and wiggle forward',
    display: { type:'front', hands:[H('left',0.42,0.42,[E,C,C,C],E,'right'), H('right',0.52,0.42,[E,C,C,C],E,'left')], motion:'hook-run' }
  },
  sit: {
    label: 'SIT', aliases: ['sitting', 'seat', 'chair'],
    description: 'Two hooked fingers sit on other two hooked fingers',
    display: { type:'front', hands:[H('left',0.42,0.42,[HF,HF,C,C],C,'down'), H('right',0.48,0.38,[HF,HF,C,C],C,'down')], motion:'sit-on' }
  },
  stand: {
    label: 'STAND', aliases: ['standing', 'stood'],
    description: 'V-hand (two fingers) stands on open palm',
    display: { type:'front', hands:[H('left',0.42,0.45,[E,E,E,E],E,'up'), H('right',0.48,0.38,[E,E,C,C],C,'down')], motion:'stand-on-palm' }
  },
  wait: {
    label: 'WAIT', aliases: ['waiting', 'hold on', 'holdon', 'patience', 'patient'],
    description: 'Both open hands palms up, wiggle fingers',
    display: { type:'front', hands:[H('left',0.35,0.42,[E,E,E,E],E,'up',0.2), H('right',0.6,0.42,[E,E,E,E],E,'up',-0.2)], motion:'wiggle' }
  },
  try: {
    label: 'TRY', aliases: ['attempt', 'effort'],
    description: 'Both S-hands push forward and down',
    display: { type:'front', hands:[H('left',0.4,0.4,[C,C,C,C],C,'out'), H('right',0.55,0.4,[C,C,C,C],C,'out')], motion:'push-down-forward' }
  },
  can: {
    label: 'CAN', aliases: ['able', 'capable', 'possible'],
    description: 'Both S-hands push down firmly together',
    display: { type:'front', hands:[H('left',0.4,0.4,[C,C,C,C],C,'down'), H('right',0.55,0.4,[C,C,C,C],C,'down')], motion:'push-down' }
  },
  cannot: {
    label: "CAN'T", aliases: ["can't", 'cant', 'cannot', 'unable', 'impossible'],
    description: 'Index finger strikes down past other index finger',
    display: { type:'front', hands:[H('left',0.42,0.42,[E,C,C,C],C,'right'), H('right',0.52,0.35,[E,C,C,C],C,'down')], motion:'strike-past' }
  },
  feel: {
    label: 'FEEL', aliases: ['feeling', 'emotion', 'feelings'],
    description: 'Middle finger brushes up chest (feeling rising in heart)',
    display: { type:'body', bodyPart:'chest', hands:[H('right',0.5,0.46,[C,E,C,C],C,'self')], motion:'brush-up-chest' }
  },
  live: {
    label: 'LIVE', aliases: ['life', 'alive', 'living', 'survive'],
    description: 'Both A-hands (fists with thumbs) slide up torso',
    display: { type:'body', bodyPart:'chest', hands:[H('left',0.42,0.5,[C,C,C,C],E,'self'), H('right',0.55,0.5,[C,C,C,C],E,'self')], motion:'slide-up' }
  },
  die: {
    label: 'DIE', aliases: ['dead', 'death', 'dying'],
    description: 'One palm up, one palm down, flip positions',
    display: { type:'front', hands:[H('left',0.4,0.42,[E,E,E,E],E,'up'), H('right',0.55,0.42,[E,E,E,E],E,'down')], motion:'flip-both' }
  },
  meet: {
    label: 'MEET', aliases: ['meeting', 'encounter'],
    description: 'Both index fingers (D-hands) come together from sides',
    display: { type:'front', hands:[H('left',0.35,0.4,[E,C,C,C],C,'right'), H('right',0.6,0.4,[E,C,C,C],C,'left')], motion:'come-together' }
  },
  call: {
    label: 'CALL', aliases: ['phone', 'telephone', 'ring'],
    description: 'Y-hand (thumb+pinky) held to ear like a phone',
    display: { type:'body', bodyPart:'ear', hands:[H('right',0.62,0.24,[C,C,C,E],E,'self')], motion:'hold-ear' }
  },
  buy: {
    label: 'BUY', aliases: ['purchase', 'shop', 'shopping', 'pay'],
    description: 'Flat hand picks up from open palm forward',
    display: { type:'front', hands:[H('left',0.4,0.42,[E,E,E,E],E,'up'), H('right',0.48,0.38,[E,E,E,E],C,'up')], motion:'pick-up-forward' }
  },
  have: {
    label: 'HAVE', aliases: ['has', 'had', 'own', 'possess'],
    description: 'Bent hands touch chest (having/possessing)',
    display: { type:'body', bodyPart:'chest', hands:[H('right',0.5,0.45,[HF,HF,HF,HF],HF,'self')], motion:'touch-chest' }
  },
  dont: {
    label: "DON'T", aliases: ["don't", 'do not'],
    description: 'Both open hands cross and separate (X motion)',
    display: { type:'front', hands:[H('left',0.4,0.4,[E,E,E,E],E,'down'), H('right',0.55,0.4,[E,E,E,E],E,'down')], motion:'cross-separate' }
  },
  start: {
    label: 'START', aliases: ['begin', 'beginning'],
    description: 'Index finger twists between other index and middle finger',
    display: { type:'front', hands:[H('left',0.42,0.4,[E,E,C,C],C,'right'), H('right',0.5,0.38,[E,C,C,C],C,'left')], motion:'twist-between' }
  },
  finish: {
    label: 'FINISH', aliases: ['done', 'finished', 'complete', 'completed', 'end', 'over'],
    description: 'Both open hands flip outward from palms-in to palms-out',
    display: { type:'front', hands:[H('left',0.35,0.38,[E,E,E,E],E,'out'), H('right',0.6,0.38,[E,E,E,E],E,'out')], motion:'flip-out' }
  },
  practice: {
    label: 'PRACTICE', aliases: ['rehearse', 'train', 'training'],
    description: 'A-hand brushes back and forth on index finger',
    display: { type:'front', hands:[H('left',0.42,0.42,[E,C,C,C],C,'up'), H('right',0.48,0.38,[C,C,C,C],E,'left')], motion:'brush-back-forth' }
  },
  ask: {
    label: 'ASK', aliases: ['question', 'request', 'inquire'],
    description: 'Index finger draws a question mark in the air',
    display: { type:'front', hands:[H('right',0.5,0.35,[E,C,C,C],C,'out')], motion:'draw-question' }
  },
  answer: {
    label: 'ANSWER', aliases: ['reply', 'respond', 'response'],
    description: 'Both index fingers at mouth point forward and down',
    display: { type:'body', bodyPart:'mouth', hands:[H('left',0.42,0.3,[E,C,C,C],C,'out'), H('right',0.52,0.3,[E,C,C,C],C,'out')], motion:'point-out-down' }
  },
  show: {
    label: 'SHOW', aliases: ['demonstrate', 'display', 'present'],
    description: 'Index finger on palm, both hands move forward',
    display: { type:'front', hands:[H('left',0.4,0.42,[E,E,E,E],E,'up'), H('right',0.48,0.4,[E,C,C,C],C,'down')], motion:'push-forward' }
  },
  change: {
    label: 'CHANGE', aliases: ['modify', 'alter', 'switch', 'convert'],
    description: 'Both A-hands twist in opposite directions',
    display: { type:'front', hands:[H('left',0.42,0.42,[C,C,C,C],E,'up'), H('right',0.52,0.42,[C,C,C,C],E,'up')], motion:'twist-opposite' }
  },
  open: {
    label: 'OPEN', aliases: ['opening'],
    description: 'Both B-hands (flat) side by side, separate apart',
    display: { type:'front', hands:[H('left',0.4,0.4,[E,E,E,E],E,'out'), H('right',0.55,0.4,[E,E,E,E],E,'out')], motion:'separate-apart' }
  },
  close: {
    label: 'CLOSE', aliases: ['shut', 'closing'],
    description: 'Both B-hands come together from sides',
    display: { type:'front', hands:[H('left',0.35,0.4,[E,E,E,E],E,'out'), H('right',0.6,0.4,[E,E,E,E],E,'out')], motion:'come-together' }
  },
  find: {
    label: 'FIND', aliases: ['found', 'discover'],
    description: 'Open hand reaches down and picks up (pinch up)',
    display: { type:'front', hands:[H('right',0.5,0.42,[E,E,E,E],E,'down')], motion:'pick-up' }
  },
  use: {
    label: 'USE', aliases: ['using', 'utilize'],
    description: 'U-hand circles',
    display: { type:'front', hands:[H('right',0.5,0.4,[E,E,C,C],C,'out')], motion:'circle' }
  },

  // ========================
  //  ADJECTIVES
  // ========================
  good: {
    label: 'GOOD', aliases: ['well', 'fine', 'great'],
    description: 'Flat hand from chin, forward and down onto open palm',
    display: { type:'body', bodyPart:'chin', hands:[H('right',0.52,0.32,[E,E,E,E],E,'up',-0.1)], motion:'chin-down' }
  },
  bad: {
    label: 'BAD', aliases: ['terrible', 'awful', 'horrible', 'worst'],
    description: 'Flat hand from chin, flip palm downward',
    display: { type:'body', bodyPart:'chin', hands:[H('right',0.52,0.35,[E,E,E,E],E,'down')], motion:'chin-flip-down' }
  },
  happy: {
    label: 'HAPPY', aliases: ['glad', 'joyful', 'cheerful', 'joy'],
    description: 'Both flat hands brush upward on chest repeatedly',
    display: { type:'body', bodyPart:'chest', hands:[H('right',0.5,0.45,[E,E,E,E],E,'self')], motion:'brush-up-chest' }
  },
  sad: {
    label: 'SAD', aliases: ['unhappy', 'depressed', 'upset', 'miserable'],
    description: 'Both open hands in front of face, drop down sadly',
    display: { type:'body', bodyPart:'face', hands:[H('right',0.55,0.28,[E,E,E,E],E,'self')], motion:'hands-drop-face' }
  },
  angry: {
    label: 'ANGRY', aliases: ['mad', 'furious', 'rage', 'frustrated', 'pissed'],
    description: 'Claw hand in front of face, pull down and clench',
    display: { type:'body', bodyPart:'face', hands:[H('right',0.5,0.26,[HF,HF,HF,HF],HF,'self')], motion:'claw-down' }
  },
  scared: {
    label: 'SCARED', aliases: ['afraid', 'fear', 'frightened', 'terrified', 'scary'],
    description: 'Both fists at sides spring open toward center',
    display: { type:'body', bodyPart:'chest', hands:[H('left',0.35,0.45,[C,C,C,C],C,'in'), H('right',0.6,0.45,[C,C,C,C],C,'in')], motion:'spring-open' }
  },
  surprised: {
    label: 'SURPRISED', aliases: ['surprise', 'shocked', 'shock', 'amazed', 'wow'],
    description: 'Both index fingers at eyes flick upward opening',
    display: { type:'body', bodyPart:'eyes', hands:[H('left',0.42,0.22,[C,C,C,C],C,'self'), H('right',0.55,0.22,[C,C,C,C],C,'self')], motion:'flick-open-eyes' }
  },
  excited: {
    label: 'EXCITED', aliases: ['exciting', 'thrill', 'thrilled', 'eager'],
    description: 'Both middle fingers alternately brush up on chest',
    display: { type:'body', bodyPart:'chest', hands:[H('left',0.42,0.48,[C,E,C,C],C,'self'), H('right',0.55,0.46,[C,E,C,C],C,'self')], motion:'alternate-brush-up' }
  },
  beautiful: {
    label: 'BEAUTIFUL', aliases: ['pretty', 'gorgeous', 'lovely', 'handsome', 'attractive'],
    description: 'Open hand circles face then closes into flat-O',
    display: { type:'body', bodyPart:'face', hands:[H('right',0.5,0.25,[E,E,E,E],E,'self')], motion:'circle-face-close' }
  },
  ugly: {
    label: 'UGLY', aliases: [],
    description: 'X-hand (hooked index) pulls across under nose',
    display: { type:'body', bodyPart:'nose', hands:[H('right',0.5,0.27,[HF,C,C,C],C,'left')], motion:'pull-across' }
  },
  big: {
    label: 'BIG', aliases: ['large', 'huge', 'enormous', 'giant'],
    description: 'Both hands spread far apart',
    display: { type:'front', hands:[H('left',0.3,0.4,[E,E,E,E],E,'in',0.3), H('right',0.65,0.4,[E,E,E,E],E,'in',-0.3)], motion:'spread-apart' }
  },
  small: {
    label: 'SMALL', aliases: ['little', 'tiny', 'mini', 'miniature'],
    description: 'Both flat hands close together, push inward',
    display: { type:'front', hands:[H('left',0.42,0.4,[E,E,E,E],E,'in',-0.2), H('right',0.55,0.4,[E,E,E,E],E,'in',0.2)], motion:'push-together' }
  },
  hot: {
    label: 'HOT', aliases: ['heat', 'warm'],
    description: 'Claw hand at mouth turns away quickly',
    display: { type:'body', bodyPart:'mouth', hands:[H('right',0.52,0.3,[HF,HF,HF,HF],HF,'self')], motion:'turn-away' }
  },
  cold: {
    label: 'COLD', aliases: ['cool', 'chilly', 'freeze', 'freezing'],
    description: 'Both S-hands near shoulders shake (shivering)',
    display: { type:'body', bodyPart:'shoulder', hands:[H('left',0.35,0.4,[C,C,C,C],C,'in'), H('right',0.6,0.4,[C,C,C,C],C,'in')], motion:'shiver' }
  },
  new: {
    label: 'NEW', aliases: ['fresh', 'novel', 'brand new'],
    description: 'Curved hand scoops across open palm',
    display: { type:'front', hands:[H('left',0.4,0.42,[E,E,E,E],E,'up'), H('right',0.5,0.38,[HF,HF,HF,HF],C,'up')], motion:'scoop' }
  },
  old: {
    label: 'OLD', aliases: ['ancient', 'elderly', 'aged'],
    description: 'S-hand (fist) at chin pulls down like a beard',
    display: { type:'body', bodyPart:'chin', hands:[H('right',0.5,0.32,[C,C,C,C],C,'self')], motion:'pull-down-beard' }
  },
  fast: {
    label: 'FAST', aliases: ['quick', 'quickly', 'rapid', 'speed', 'hurry'],
    description: 'Both L-hands (index+thumb) snap closed quickly',
    display: { type:'front', hands:[H('left',0.4,0.4,[E,C,C,C],E,'in'), H('right',0.55,0.4,[E,C,C,C],E,'in')], motion:'snap-quick' }
  },
  slow: {
    label: 'SLOW', aliases: ['slowly'],
    description: 'Hand slides slowly up back of other hand',
    display: { type:'front', hands:[H('left',0.4,0.42,[E,E,E,E],E,'down'), H('right',0.48,0.45,[E,E,E,E],E,'down')], motion:'slide-slow' }
  },
  same: {
    label: 'SAME', aliases: ['similar', 'alike', 'equal', 'identical'],
    description: 'Both index fingers side by side, tap together',
    display: { type:'front', hands:[H('left',0.42,0.4,[E,C,C,C],C,'down'), H('right',0.52,0.4,[E,C,C,C],C,'down')], motion:'tap-side' }
  },
  different: {
    label: 'DIFFERENT', aliases: ['differ', 'unlike', 'distinct', 'unique', 'other'],
    description: 'Both index fingers crossed, pull apart',
    display: { type:'front', hands:[H('left',0.38,0.4,[E,C,C,C],C,'down',0.2), H('right',0.58,0.4,[E,C,C,C],C,'down',-0.2)], motion:'pull-apart' }
  },
  important: {
    label: 'IMPORTANT', aliases: ['significant', 'critical', 'essential', 'vital'],
    description: 'Both F-hands rise from center upward',
    display: { type:'front', hands:[H('left',0.42,0.38,[HF,E,E,E],HF,'in'), H('right',0.55,0.38,[HF,E,E,E],HF,'in')], motion:'rise-center' }
  },
  wrong: {
    label: 'WRONG', aliases: ['incorrect', 'mistake', 'error'],
    description: 'Y-hand (thumb+pinky) slaps chin',
    display: { type:'body', bodyPart:'chin', hands:[H('right',0.5,0.32,[C,C,C,E],E,'self')], motion:'touch-chin' }
  },
  true: {
    label: 'TRUE', aliases: ['truth', 'real', 'really', 'genuine', 'honest'],
    description: 'Index finger from lips pushes forward',
    display: { type:'body', bodyPart:'mouth', hands:[H('right',0.5,0.3,[E,C,C,C],C,'out')], motion:'lips-forward' }
  },
  false: {
    label: 'FALSE', aliases: ['fake', 'lie', 'lying', 'liar'],
    description: 'Index finger swipes across chin sideways',
    display: { type:'body', bodyPart:'chin', hands:[H('right',0.5,0.32,[E,C,C,C],C,'left')], motion:'swipe-chin' }
  },
  easy: {
    label: 'EASY', aliases: ['simple'],
    description: 'Curved hand brushes up off other fingertips twice',
    display: { type:'front', hands:[H('left',0.42,0.42,[HF,HF,HF,HF],C,'up'), H('right',0.5,0.38,[HF,HF,HF,HF],C,'up')], motion:'brush-up-off' }
  },
  hard: {
    label: 'HARD', aliases: ['difficult', 'tough', 'challenging'],
    description: 'Both bent-V hands knock knuckles together',
    display: { type:'front', hands:[H('left',0.42,0.4,[HF,HF,C,C],C,'right'), H('right',0.52,0.4,[HF,HF,C,C],C,'left')], motion:'knock-knuckles' }
  },
  ready: {
    label: 'READY', aliases: ['prepared'],
    description: 'Both R-hands move from center outward',
    display: { type:'front', hands:[H('left',0.4,0.4,[E,E,C,C],C,'out'), H('right',0.55,0.4,[E,E,C,C],C,'out')], motion:'move-outward' }
  },
  free: {
    label: 'FREE', aliases: ['freedom'],
    description: 'Both F-hands cross at wrists then separate outward',
    display: { type:'front', hands:[H('left',0.4,0.4,[HF,E,E,E],HF,'out'), H('right',0.55,0.4,[HF,E,E,E],HF,'out')], motion:'cross-separate' }
  },

  // ========================
  //  NOUNS — People
  // ========================
  person: {
    label: 'PERSON', aliases: ['someone', 'somebody', 'individual', 'human'],
    description: 'Both P-hands move down in parallel',
    display: { type:'front', hands:[H('left',0.4,0.4,[E,E,C,C],E,'out'), H('right',0.55,0.4,[E,E,C,C],E,'out')], motion:'move-down-parallel' }
  },
  man: {
    label: 'MAN', aliases: ['boy', 'male', 'guy', 'gentleman'],
    description: 'Open hand touches forehead (hat brim) then lowers to chest',
    display: { type:'body', bodyPart:'forehead', hands:[H('right',0.52,0.2,[E,E,E,E],E,'left')], motion:'forehead-to-chest' }
  },
  woman: {
    label: 'WOMAN', aliases: ['girl', 'female', 'lady'],
    description: 'Thumb traces from chin down to chest',
    display: { type:'body', bodyPart:'chin', hands:[H('right',0.5,0.32,[C,C,C,C],E,'self')], motion:'chin-to-chest' }
  },
  baby: {
    label: 'BABY', aliases: ['infant', 'child', 'kid'],
    description: 'Arms cradle and rock like holding a baby',
    display: { type:'front', hands:[H('left',0.4,0.48,[E,E,E,E],E,'up',0.2), H('right',0.55,0.45,[E,E,E,E],E,'up',-0.2)], motion:'rock-cradle' }
  },
  friend: {
    label: 'FRIEND', aliases: ['buddy', 'pal', 'mate'],
    description: 'Hooked index fingers link together, then reverse',
    display: { type:'front', hands:[H('right',0.52,0.4,[HF,C,C,C],C,'down'), H('left',0.45,0.4,[HF,C,C,C],C,'up')], motion:'hook-link' }
  },
  family: {
    label: 'FAMILY', aliases: ['relatives'],
    description: 'Both F-hands circle outward from touching position',
    display: { type:'front', hands:[H('left',0.35,0.38,[HF,E,E,E],HF,'out'), H('right',0.6,0.38,[HF,E,E,E],HF,'out')], motion:'circle-out' }
  },
  mother: {
    label: 'MOTHER', aliases: ['mom', 'mommy', 'mama', 'mum'],
    description: 'Thumb of open hand taps chin',
    display: { type:'body', bodyPart:'chin', hands:[H('right',0.5,0.32,[E,E,E,E],E,'left')], motion:'tap-chin-thumb' }
  },
  father: {
    label: 'FATHER', aliases: ['dad', 'daddy', 'papa'],
    description: 'Thumb of open hand taps forehead',
    display: { type:'body', bodyPart:'forehead', hands:[H('right',0.52,0.2,[E,E,E,E],E,'left')], motion:'tap-forehead-thumb' }
  },
  brother: {
    label: 'BROTHER', aliases: ['bro'],
    description: 'Forehead tap (male marker) + both index fingers together',
    display: { type:'body', bodyPart:'forehead', hands:[H('right',0.52,0.2,[E,C,C,C],E,'left')], motion:'forehead-then-together' }
  },
  sister: {
    label: 'SISTER', aliases: ['sis'],
    description: 'Chin trace (female marker) + both index fingers together',
    display: { type:'body', bodyPart:'chin', hands:[H('right',0.5,0.32,[E,C,C,C],E,'left')], motion:'chin-then-together' }
  },
  doctor: {
    label: 'DOCTOR', aliases: ['physician', 'dr'],
    description: 'M-hand or D-hand taps wrist (taking pulse)',
    display: { type:'front', hands:[H('left',0.4,0.42,[E,E,E,E],E,'up'), H('right',0.48,0.42,[E,C,C,C],HF,'down')], motion:'tap-wrist' }
  },
  police: {
    label: 'POLICE', aliases: ['cop', 'officer', 'police officer'],
    description: 'C-hand taps left chest (badge location)',
    display: { type:'body', bodyPart:'chest', hands:[H('right',0.42,0.45,[HF,HF,HF,HF],HF,'self')], motion:'tap-badge' }
  },

  // ========================
  //  NOUNS — Places & Things
  // ========================
  home: {
    label: 'HOME', aliases: ['house'],
    description: 'Flat-O hand touches cheek near mouth then moves to near ear',
    display: { type:'body', bodyPart:'cheek', hands:[H('right',0.6,0.28,[HF,HF,HF,HF],HF,'self')], motion:'cheek-to-jaw' }
  },
  school: {
    label: 'SCHOOL', aliases: ['class', 'classroom', 'academy'],
    description: 'Clap hands twice',
    display: { type:'front', hands:[H('left',0.42,0.42,[E,E,E,E],E,'up'), H('right',0.5,0.36,[E,E,E,E],E,'down')], motion:'clap' }
  },
  hospital: {
    label: 'HOSPITAL', aliases: ['clinic', 'medical'],
    description: 'H-hand draws a cross on upper arm',
    display: { type:'body', bodyPart:'shoulder', hands:[H('right',0.35,0.35,[E,E,C,C],C,'down')], motion:'draw-cross' }
  },
  store: {
    label: 'STORE', aliases: ['shop', 'market', 'mall'],
    description: 'Both flat-O hands swing out from center',
    display: { type:'front', hands:[H('left',0.42,0.42,[HF,HF,HF,HF],HF,'down'), H('right',0.52,0.42,[HF,HF,HF,HF],HF,'down')], motion:'swing-out' }
  },
  car: {
    label: 'CAR', aliases: ['drive', 'driving', 'vehicle', 'automobile'],
    description: 'Both hands grip and turn imaginary steering wheel',
    display: { type:'front', hands:[H('left',0.38,0.42,[C,C,C,C],C,'in'), H('right',0.58,0.42,[C,C,C,C],C,'in')], motion:'steer' }
  },
  book: {
    label: 'BOOK', aliases: ['textbook'],
    description: 'Both palms together, open like a book',
    display: { type:'front', hands:[H('left',0.4,0.42,[E,E,E,E],E,'up',0.3), H('right',0.55,0.42,[E,E,E,E],E,'up',-0.3)], motion:'open-book' }
  },
  computer: {
    label: 'COMPUTER', aliases: ['laptop', 'pc'],
    description: 'C-hand bounces up forearm',
    display: { type:'front', hands:[H('left',0.4,0.45,[E,E,E,E],E,'down'), H('right',0.45,0.4,[HF,HF,HF,HF],HF,'left')], motion:'bounce-up-arm' }
  },
  phone: {
    label: 'PHONE', aliases: ['cellphone', 'mobile', 'cell', 'smartphone'],
    description: 'Y-hand at ear (thumb to ear, pinky to mouth)',
    display: { type:'body', bodyPart:'ear', hands:[H('right',0.62,0.24,[C,C,C,E],E,'self')], motion:'hold-ear' }
  },
  money: {
    label: 'MONEY', aliases: ['dollar', 'dollars', 'cash', 'cost', 'price', 'expensive', 'cheap'],
    description: 'Flat-O hand taps on open palm twice',
    display: { type:'front', hands:[H('left',0.4,0.42,[E,E,E,E],E,'up'), H('right',0.48,0.38,[HF,HF,HF,HF],HF,'down')], motion:'tap-palm' }
  },
  name: {
    label: 'NAME', aliases: ['called', 'named'],
    description: 'H-hand (index+middle) taps on other H-hand in cross shape',
    display: { type:'front', hands:[H('left',0.42,0.42,[E,E,C,C],C,'down'), H('right',0.5,0.36,[E,E,C,C],C,'down')], motion:'tap-on' }
  },
  world: {
    label: 'WORLD', aliases: ['earth', 'global', 'planet'],
    description: 'Both W-hands circle around each other',
    display: { type:'front', hands:[H('left',0.42,0.4,[E,E,E,C],C,'right'), H('right',0.52,0.4,[E,E,E,C],C,'left')], motion:'orbit' }
  },
  door: {
    label: 'DOOR', aliases: [],
    description: 'Both B-hands side by side, one swings open like a door',
    display: { type:'front', hands:[H('left',0.42,0.4,[E,E,E,E],E,'out'), H('right',0.52,0.4,[E,E,E,E],E,'out')], motion:'swing-open' }
  },

  // ========================
  //  NOUNS — Food & Drink
  // ========================
  coffee: {
    label: 'COFFEE', aliases: ['cafe'],
    description: 'S-hand grinds on top of other S-hand',
    display: { type:'front', hands:[H('left',0.42,0.42,[C,C,C,C],C,'in'), H('right',0.48,0.38,[C,C,C,C],C,'in')], motion:'grind' }
  },
  milk: {
    label: 'MILK', aliases: [],
    description: 'C-hand squeezes shut repeatedly (milking)',
    display: { type:'front', hands:[H('right',0.5,0.4,[HF,HF,HF,HF],HF,'in')], motion:'squeeze' }
  },
  pizza: {
    label: 'PIZZA', aliases: [],
    description: 'P-hand draws a Z shape in air (P+izza)',
    display: { type:'front', hands:[H('right',0.5,0.38,[E,E,C,C],E,'out')], motion:'draw-Z' }
  },
  apple: {
    label: 'APPLE', aliases: [],
    description: 'X-hand (knuckle of hooked index) twists on cheek',
    display: { type:'body', bodyPart:'cheek', hands:[H('right',0.58,0.28,[HF,C,C,C],C,'self')], motion:'twist-cheek' }
  },

  // ========================
  //  NOUNS — Animals
  // ========================
  cat: {
    label: 'CAT', aliases: ['kitty', 'kitten'],
    description: 'F-hand (pinch) pulls out from side of lip (whiskers)',
    display: { type:'body', bodyPart:'mouth', hands:[H('right',0.58,0.3,[HF,E,E,E],HF,'out')], motion:'pull-whisker' }
  },
  dog: {
    label: 'DOG', aliases: ['puppy', 'doggy'],
    description: 'Snap fingers + pat thigh (calling a dog)',
    display: { type:'front', hands:[H('right',0.55,0.42,[E,E,C,C],E,'down')], motion:'snap-pat' }
  },
  bird: {
    label: 'BIRD', aliases: ['chicken'],
    description: 'Index+thumb open and close at mouth (beak)',
    display: { type:'body', bodyPart:'mouth', hands:[H('right',0.52,0.3,[E,C,C,C],E,'out')], motion:'beak' }
  },
  fish: {
    label: 'FISH', aliases: [],
    description: 'Flat hand wriggles forward like swimming fish',
    display: { type:'front', hands:[H('right',0.5,0.4,[E,E,E,E],C,'left')], motion:'wriggle-forward' }
  },

  // ========================
  //  TIME
  // ========================
  now: {
    label: 'NOW', aliases: ['current', 'present', 'currently', 'today'],
    description: 'Both Y-hands drop down together sharply',
    display: { type:'front', hands:[H('left',0.38,0.4,[C,C,C,E],E,'up'), H('right',0.58,0.4,[C,C,C,E],E,'up')], motion:'drop-down' }
  },
  tomorrow: {
    label: 'TOMORROW', aliases: [],
    description: 'A-hand thumb on cheek, pivots forward',
    display: { type:'body', bodyPart:'cheek', hands:[H('right',0.58,0.28,[C,C,C,C],E,'self')], motion:'pivot-forward' }
  },
  yesterday: {
    label: 'YESTERDAY', aliases: [],
    description: 'A-hand thumb touches chin then moves back to cheek',
    display: { type:'body', bodyPart:'chin', hands:[H('right',0.52,0.32,[C,C,C,C],E,'self')], motion:'chin-back-cheek' }
  },
  before: {
    label: 'BEFORE', aliases: ['earlier', 'previously', 'ago', 'prior'],
    description: 'Flat hand moves backward from other palm',
    display: { type:'front', hands:[H('right',0.5,0.4,[E,E,E,E],E,'self')], motion:'move-back' }
  },
  after: {
    label: 'AFTER', aliases: ['later', 'afterwards', 'next', 'then', 'soon'],
    description: 'Flat hand moves forward past other palm',
    display: { type:'front', hands:[H('right',0.55,0.4,[E,E,E,E],E,'left')], motion:'move-forward' }
  },
  always: {
    label: 'ALWAYS', aliases: ['forever', 'eternal', 'constantly'],
    description: 'Index finger draws a continuous circle in air',
    display: { type:'front', hands:[H('right',0.5,0.38,[E,C,C,C],C,'up')], motion:'continuous-circle' }
  },
  never: {
    label: 'NEVER', aliases: [],
    description: 'Flat hand makes a swooping S-curve downward',
    display: { type:'front', hands:[H('right',0.5,0.35,[E,E,E,E],E,'out')], motion:'swoop-S-down' }
  },
  sometimes: {
    label: 'SOMETIMES', aliases: ['occasional', 'once in a while'],
    description: 'Index finger taps open palm slowly, twice',
    display: { type:'front', hands:[H('left',0.4,0.42,[E,E,E,E],E,'up'), H('right',0.48,0.36,[E,C,C,C],C,'down')], motion:'slow-tap-twice' }
  },
  time: {
    label: 'TIME', aliases: ['clock', 'oclock'],
    description: 'Index finger taps back of wrist (watch location)',
    display: { type:'front', hands:[H('left',0.42,0.42,[C,C,C,C],C,'down'), H('right',0.48,0.4,[E,C,C,C],C,'down')], motion:'tap-wrist-watch' }
  },

  // ========================
  //  COLORS
  // ========================
  red: {
    label: 'RED', aliases: [],
    description: 'Index finger strokes down from lips',
    display: { type:'body', bodyPart:'mouth', hands:[H('right',0.5,0.3,[E,C,C,C],C,'self')], motion:'stroke-down-lips' }
  },
  blue: {
    label: 'BLUE', aliases: [],
    description: 'B-hand twists/shakes at side',
    display: { type:'front', hands:[H('right',0.55,0.38,[E,E,E,E],C,'out')], motion:'twist-shake' }
  },
  green: {
    label: 'GREEN', aliases: [],
    description: 'G-hand shakes at side',
    display: { type:'front', hands:[H('right',0.55,0.38,[E,C,C,C],E,'out')], motion:'twist-shake' }
  },
  yellow: {
    label: 'YELLOW', aliases: [],
    description: 'Y-hand (thumb+pinky) twists at side',
    display: { type:'front', hands:[H('right',0.55,0.38,[C,C,C,E],E,'out')], motion:'twist-shake' }
  },
  black: {
    label: 'BLACK', aliases: [],
    description: 'Index finger draws across forehead',
    display: { type:'body', bodyPart:'forehead', hands:[H('right',0.5,0.2,[E,C,C,C],C,'self')], motion:'draw-across-forehead' }
  },
  white: {
    label: 'WHITE', aliases: [],
    description: 'Open hand on chest pulls out and closes to flat-O',
    display: { type:'body', bodyPart:'chest', hands:[H('right',0.5,0.45,[E,E,E,E],E,'self')], motion:'pull-out-close' }
  },

  // ========================
  //  MORE COMMON WORDS
  // ========================
  more: {
    label: 'MORE', aliases: ['additional'],
    description: 'Both flat-O hands tap fingertips together',
    display: { type:'front', hands:[H('left',0.4,0.4,[HF,HF,HF,HF],HF,'right'), H('right',0.55,0.4,[HF,HF,HF,HF],HF,'left')], motion:'tap-together' }
  },
  less: {
    label: 'LESS', aliases: ['fewer', 'reduce', 'decrease'],
    description: 'Flat hand lowers above other flat hand',
    display: { type:'front', hands:[H('left',0.42,0.45,[E,E,E,E],E,'down'), H('right',0.48,0.38,[E,E,E,E],E,'down')], motion:'lower-above' }
  },
  again: {
    label: 'AGAIN', aliases: ['repeat', 'redo'],
    description: 'Bent hand flips into flat open palm',
    display: { type:'front', hands:[H('left',0.4,0.42,[E,E,E,E],E,'up'), H('right',0.5,0.36,[HF,HF,HF,HF],C,'down')], motion:'flip-into' }
  },
  also: {
    label: 'ALSO', aliases: ['too', 'as well'],
    description: 'Index fingers tap together side by side',
    display: { type:'front', hands:[H('left',0.42,0.4,[E,C,C,C],C,'right'), H('right',0.52,0.4,[E,C,C,C],C,'left')], motion:'tap-side' }
  },
  every: {
    label: 'EVERY', aliases: ['each', 'all', 'everything', 'everyone', 'everybody'],
    description: 'A-hand thumb brushes down other A-hand knuckles',
    display: { type:'front', hands:[H('left',0.42,0.4,[C,C,C,C],E,'in'), H('right',0.5,0.38,[C,C,C,C],E,'down')], motion:'brush-down-knuckles' }
  },
  many: {
    label: 'MANY', aliases: ['lots', 'much', 'a lot', 'plenty'],
    description: 'Both S-hands spring open into 5-hands',
    display: { type:'front', hands:[H('left',0.38,0.4,[E,E,E,E],E,'up'), H('right',0.58,0.4,[E,E,E,E],E,'up')], motion:'spring-open' }
  },
  nothing: {
    label: 'NOTHING', aliases: ['none', 'zero', 'empty', 'null'],
    description: 'O-hands spring open under chin and separate',
    display: { type:'body', bodyPart:'chin', hands:[H('left',0.42,0.34,[HF,HF,HF,HF],HF,'out'), H('right',0.55,0.34,[HF,HF,HF,HF],HF,'out')], motion:'spring-open-separate' }
  },
  with: {
    label: 'WITH', aliases: ['together'],
    description: 'Both A-hands come together (fists join)',
    display: { type:'front', hands:[H('left',0.4,0.4,[C,C,C,C],C,'in'), H('right',0.55,0.4,[C,C,C,C],C,'in')], motion:'come-together' }
  },
  without: {
    label: 'WITHOUT', aliases: [],
    description: 'Both A-hands together then spring open and apart',
    display: { type:'front', hands:[H('left',0.38,0.4,[E,E,E,E],E,'out'), H('right',0.58,0.4,[E,E,E,E],E,'out')], motion:'spring-apart' }
  },
  because: {
    label: 'BECAUSE', aliases: ['since', 'reason'],
    description: 'Index finger touches forehead then moves out, closing to A-hand',
    display: { type:'body', bodyPart:'forehead', hands:[H('right',0.55,0.2,[E,C,C,C],C,'self')], motion:'forehead-out-close' }
  },
  about: {
    label: 'ABOUT', aliases: ['approximately', 'around'],
    description: 'Index finger circles around other pointed index',
    display: { type:'front', hands:[H('left',0.42,0.4,[E,C,C,C],C,'up'), H('right',0.52,0.38,[E,C,C,C],C,'left')], motion:'circle-around' }
  },
  very: {
    label: 'VERY', aliases: ['really', 'extremely', 'super', 'so'],
    description: 'Both V-hands (fingertips touching) pull apart',
    display: { type:'front', hands:[H('left',0.42,0.4,[E,E,C,C],C,'in'), H('right',0.52,0.4,[E,E,C,C],C,'in')], motion:'pull-apart' }
  },
  deaf: {
    label: 'DEAF', aliases: ['deafness'],
    description: 'Index finger touches ear then touches corner of mouth',
    display: { type:'body', bodyPart:'ear', hands:[H('right',0.65,0.25,[E,C,C,C],C,'self')], motion:'ear-to-chin' }
  },
  sign: {
    label: 'SIGN LANGUAGE', aliases: ['sign language', 'signing', 'asl'],
    description: 'Both index fingers alternate circular motions',
    display: { type:'front', hands:[H('left',0.4,0.38,[E,C,C,C],C,'in'), H('right',0.55,0.38,[E,C,C,C],C,'in')], motion:'alternate-circle' }
  },
  internet: {
    label: 'INTERNET', aliases: ['online', 'web', 'website'],
    description: 'Both 5-hands (open) with middle fingers touching, rotate toward each other',
    display: { type:'front', hands:[H('left',0.42,0.4,[E,E,E,E],E,'in'), H('right',0.52,0.4,[E,E,E,E],E,'in')], motion:'rotate-toward' }
  },
  sick: {
    label: 'SICK', aliases: ['ill', 'illness', 'disease', 'unwell'],
    description: 'Middle finger touches forehead, other middle finger touches stomach',
    display: { type:'body', bodyPart:'forehead', hands:[H('right',0.52,0.2,[C,E,C,C],C,'self')], motion:'touch-head-stomach' }
  },
  pain: {
    label: 'PAIN', aliases: ['hurt', 'ache', 'ouch', 'sore'],
    description: 'Both index fingers point at each other, twist in opposite directions',
    display: { type:'front', hands:[H('left',0.42,0.4,[E,C,C,C],C,'right'), H('right',0.52,0.4,[E,C,C,C],C,'left')], motion:'twist-opposite' }
  },
  problem: {
    label: 'PROBLEM', aliases: ['trouble', 'issue', 'conflict'],
    description: 'Both bent-V hands knuckles bump and twist',
    display: { type:'front', hands:[H('left',0.42,0.4,[HF,HF,C,C],C,'right'), H('right',0.52,0.4,[HF,HF,C,C],C,'left')], motion:'bump-twist' }
  },
  idea: {
    label: 'IDEA', aliases: ['concept', 'imagination', 'imagine'],
    description: 'I-hand (pinky up) rises from forehead',
    display: { type:'body', bodyPart:'forehead', hands:[H('right',0.52,0.18,[C,C,C,E],C,'self')], motion:'rise-from-head' }
  },
  language: {
    label: 'LANGUAGE', aliases: [],
    description: 'Both L-hands pull apart from center',
    display: { type:'front', hands:[H('left',0.42,0.4,[E,C,C,C],E,'in'), H('right',0.52,0.4,[E,C,C,C],E,'in')], motion:'pull-apart' }
  },
  country: {
    label: 'COUNTRY', aliases: ['nation'],
    description: 'Y-hand rubs in circle on outer elbow',
    display: { type:'front', hands:[H('right',0.4,0.45,[C,C,C,E],E,'self')], motion:'rub-circle' }
  },
  city: {
    label: 'CITY', aliases: ['town', 'village'],
    description: 'Both open hands tap rooftops together (house shapes)',
    display: { type:'front', hands:[H('left',0.4,0.38,[E,E,E,E],E,'in',0.3), H('right',0.55,0.38,[E,E,E,E],E,'in',-0.3)], motion:'tap-rooftops' }
  },
  bathroom: {
    label: 'BATHROOM', aliases: ['restroom', 'toilet', 'washroom'],
    description: 'T-hand shakes side to side',
    display: { type:'front', hands:[H('right',0.5,0.38,[C,C,C,C],E,'out')], motion:'shake-side' }
  }
};

/**
 * Lookup a word in the ASL dictionary.
 * Checks direct key match, then aliases of all entries.
 * Returns the sign entry or null if not found.
 */
// User's custom words loaded from Firestore (populated at login)
let userCustomWords = {};

function setUserCustomWords(words) {
  userCustomWords = {};
  for (const w of words) {
    userCustomWords[w.word] = {
      label: w.word.toUpperCase(),
      aliases: [],
      description: w.description,
      display: { type: 'front', hands: [H('right', 0.5, 0.4, [E,E,E,E], E, 'out')], motion: 'none' },
      isCustom: true
    };
  }
}

function lookupASLWord(word) {
  const w = word.toLowerCase().trim().replace(/[^a-z' ]/g, '');

  // Check user's custom words first
  if (userCustomWords[w]) return userCustomWords[w];

  // Check built-in dictionary
  if (ASL_WORD_SIGNS[w]) return ASL_WORD_SIGNS[w];

  // Check aliases
  for (const [key, entry] of Object.entries(ASL_WORD_SIGNS)) {
    if (entry.aliases && entry.aliases.includes(w)) return entry;
  }
  return null;
}

/**
 * Split text into tokens: words that have ASL signs and words that need fingerspelling.
 * Also tries multi-word phrases (e.g., "thank you", "i love you", "good morning").
 * Returns array of { type: 'word'|'fingerspell', text, sign? }
 */
function tokenizeForASL(text) {
  const words = text.trim().split(/\s+/);
  const tokens = [];
  let i = 0;

  while (i < words.length) {
    const clean = (w) => w.replace(/[^a-zA-Z']/g, '').toLowerCase();

    // Try 3-word phrase
    if (i + 2 < words.length) {
      const phrase3 = clean(words[i]) + ' ' + clean(words[i+1]) + ' ' + clean(words[i+2]);
      const sign3 = lookupASLWord(phrase3);
      if (sign3) { tokens.push({ type: 'word', text: phrase3, sign: sign3 }); i += 3; continue; }
    }

    // Try 2-word phrase
    if (i + 1 < words.length) {
      const phrase2 = clean(words[i]) + ' ' + clean(words[i+1]);
      const sign2 = lookupASLWord(phrase2);
      if (sign2) { tokens.push({ type: 'word', text: phrase2, sign: sign2 }); i += 2; continue; }
    }

    // Try single word
    const w = clean(words[i]);
    if (!w) { i++; continue; }
    const sign = lookupASLWord(w);
    if (sign) {
      tokens.push({ type: 'word', text: w, sign });
    } else {
      tokens.push({ type: 'fingerspell', text: w });
    }
    i++;
  }
  return tokens;
}

window.ASL_WORD_SIGNS = ASL_WORD_SIGNS;
window.lookupASLWord = lookupASLWord;
window.tokenizeForASL = tokenizeForASL;
window.setUserCustomWords = setUserCustomWords;
