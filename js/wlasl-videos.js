/**
 * ASL Sign Video Mapping
 * Maps words to real ASL sign video clips from public educational CDNs.
 * Preloads the most common videos on page load for instant playback.
 */

const VIDEO_SOURCES = {
  main: 'https://media.signbsl.com/videos/asl/startasl/mp4/',
  alt: 'https://media.signbsl.com/videos/asl/elementalaslconcepts/mp4/'
};

const VIDEO_MAP = {
  hello: 'hello', goodbye: 'goodbye', morning: 'morning', night: 'night',
  please: 'please', sorry: 'sorry',
  'thank you': 'thank-you', thanks: 'thank-you', thankyou: 'thank-you',
  yes: 'yes', no: 'no',
  help: 'help', go: 'go', wait: 'wait*', eat: 'eat', drink: 'drink',
  want: 'want', need: 'need*', like: 'like', know: 'know', learn: 'learn',
  see: 'see*', walk: 'walk', run: 'run', sit: 'sit',
  work: 'work*', love: 'love', more: 'more',
  good: 'good', bad: 'bad', happy: 'happy', sad: 'sad',
  beautiful: 'beautiful', old: 'old', big: 'big*', small: 'small',
  fast: 'fast', slow: 'slow', same: 'same*', different: 'different',
  what: 'what', where: 'where', when: 'when', why: 'why', how: 'how', who: 'who',
  friend: 'friend', family: 'family', water: 'water',
  school: 'school', home: 'home',
  // Aliases
  hi: 'hello', hey: 'hello', bye: 'goodbye', farewell: 'goodbye',
  thx: 'thank-you', food: 'eat', hungry: 'eat', thirsty: 'drink',
  look: 'see*', watch: 'see*',
  great: 'good', fine: 'good', terrible: 'bad',
  large: 'big*', huge: 'big*', little: 'small', tiny: 'small',
  quick: 'fast', quickly: 'fast',
};

function buildUrl(mapping) {
  const isAlt = mapping.endsWith('*');
  const filename = isAlt ? mapping.slice(0, -1) : mapping;
  const base = isAlt ? VIDEO_SOURCES.alt : VIDEO_SOURCES.main;
  return base + filename + '.mp4';
}

function getSignVideoUrl(word) {
  const key = word.toLowerCase().trim().replace(/[^a-z ]/g, '');
  const mapping = VIDEO_MAP[key];
  if (!mapping) return null;
  return buildUrl(mapping);
}

function hasSignVideo(word) {
  return !!VIDEO_MAP[word.toLowerCase().trim().replace(/[^a-z ]/g, '')];
}

// ===== Preload Cache =====
const videoCache = {};

function preloadVideo(word) {
  const url = getSignVideoUrl(word);
  if (!url || videoCache[url]) return;

  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.src = url;
  video.load();
  videoCache[url] = video;
}

function getPreloadedVideo(url) {
  return videoCache[url] || null;
}

// Preload the top 15 most common words on page load
document.addEventListener('DOMContentLoaded', () => {
  const commonWords = ['hello','yes','no','good','help','please','sorry','thank-you','goodbye','love','happy','sad','what','how','why'];
  // Stagger preloads to avoid overwhelming the network
  commonWords.forEach((word, i) => {
    setTimeout(() => preloadVideo(word), i * 300);
  });
});

window.getSignVideoUrl = getSignVideoUrl;
window.hasSignVideo = hasSignVideo;
window.getPreloadedVideo = getPreloadedVideo;
