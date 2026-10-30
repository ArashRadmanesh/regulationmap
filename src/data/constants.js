// Ids used across the app. The words for each id live in the language files (vocab.*).
// Keep ids stable: they are stored in people's data.

export const ENERGY_LEVELS = [0, 1, 2, 3, 4]; // very slow .. very fast
export const energyBand = (e) => (e == null ? null : e <= 1 ? 'low' : e === 2 ? 'mid' : 'high');

export const VALENCE = ['pleasant', 'unpleasant', 'neither', 'unsure'];
export const BODY = ['tight', 'heavy', 'buzzing', 'shaky', 'hot', 'cold', 'empty', 'numb', 'nothing'];
export const URGES = ['withdraw', 'hide', 'pushback', 'close', 'play', 'fix', 'brace', 'slow'];
export const CONTEXTS = ['ok', 'stressed', 'numb', 'exhausted', 'worst'];
export const EFFECTS = ['calm', 'energise', 'connect', 'focus', 'express', 'joy', 'meaning', 'safe', 'start', 'rest'];
export const STATES = ['numb', 'overwhelmed', 'anxious', 'angry', 'lonely', 'scattered', 'stuck', 'sad', 'ashamed', 'drained', 'disconnected'];
export const NOURISH = ['always', 'sometimes', 'stuck', 'avoid'];
export const COMPARE = ['better', 'same', 'worse', 'unsure'];
export const COLORS = [
  { id: 'red', hex: '#C8463D' },
  { id: 'orange', hex: '#E08A3C' },
  { id: 'yellow', hex: '#E8C547' },
  { id: 'green', hex: '#5E9E6E' },
  { id: 'blue', hex: '#4A7BB7' },
  { id: 'purple', hex: '#7D5BA6' },
  { id: 'grey', hex: '#8A8F8C' },
];
export const TEXTURES = ['spiky', 'heavy', 'fuzzy', 'knotted', 'hollow', 'smooth'];
// Offered when "Naming feelings is hard for me" is off.
export const COMMON_FEELINGS = ['anxious', 'sad', 'angry', 'lonely', 'ashamed', 'overwhelm', 'calm', 'happy', 'hopeful', 'frustrated'];

// What a check-in suggests the person may need. Used to rank their own tools.
export function inferNeeds(c) {
  const band = energyBand(c.energy);
  const v = c.valence;
  const u = new Set(c.urges || []);
  const effects = new Set();
  const states = new Set();
  const contexts = new Set();
  if (v === 'unpleasant') {
    if (band === 'high') { effects.add('calm'); effects.add('safe'); ['overwhelmed', 'anxious', 'scattered'].forEach((s) => states.add(s)); contexts.add('stressed'); }
    if (band === 'low') { effects.add('energise'); effects.add('connect'); ['numb', 'drained', 'sad', 'disconnected', 'stuck'].forEach((s) => states.add(s)); contexts.add('numb'); contexts.add('exhausted'); }
    if (band === 'mid') { effects.add('safe'); contexts.add('stressed'); }
  }
  if (band === 'low' && v !== 'unpleasant') effects.add('rest');
  if (u.has('hide') || u.has('brace')) { states.add('anxious'); effects.add('safe'); }
  if (u.has('pushback')) { states.add('angry'); effects.add('express'); effects.add('calm'); }
  if (u.has('withdraw')) { states.add('drained'); states.add('sad'); effects.add('rest'); }
  if (u.has('close')) { states.add('lonely'); effects.add('connect'); }
  if (u.has('play')) effects.add('joy');
  if (u.has('fix')) states.add('ashamed');
  if (u.has('slow')) { states.add('overwhelmed'); effects.add('rest'); }
  if (c.energy === 0 || c.energy === 4) contexts.add('worst');
  return { effects, states, contexts };
}

// Layer three: feeling-word suggestions (ids from vocab.feelings) from layers one and two.
// Offered as ideas only ("Could it be something like...?"), never as answers.
// CLINICAL REVIEW: this mapping is a first draft and should be reviewed by a clinician.
export function suggestLabels(c) {
  const band = energyBand(c.energy);
  const v = c.valence;
  const u = new Set(c.urges || []);
  if (band == null || v === 'unsure' || v == null) return [];
  if (v === 'unpleasant') {
    if (band === 'high') {
      if (u.has('pushback')) return ['anger', 'frustration', 'irritation'];
      if (u.has('hide') || u.has('brace')) return ['fear', 'worry', 'unsafe'];
      return ['stress', 'overwhelm', 'restlessness'];
    }
    if (band === 'low') {
      if (u.has('hide')) return ['shame', 'embarrassment', 'low'];
      if (u.has('withdraw')) return ['sadness', 'tiredness', 'grief'];
      return ['flat', 'boredom', 'drained'];
    }
    if (u.has('pushback')) return ['irritation', 'annoyance'];
    return ['uneasy', 'low', 'tense'];
  }
  if (v === 'pleasant') {
    if (band === 'high') {
      if (u.has('close')) return ['love', 'warmth', 'joy'];
      if (u.has('play')) return ['excitement', 'playfulness', 'joy'];
      return ['excitement', 'enthusiasm', 'joy'];
    }
    return ['calm', 'content', 'relaxed'];
  }
  if (band === 'low') return ['tired', 'flat'];
  return [];
}

// "Engine fast · Unpleasant · Want to get away", in the current language.
export function describeCheckin(c, i18n) {
  const { t, raw } = i18n;
  const parts = [];
  if (c.energy != null) parts.push(t('checkin.engine', { level: raw('vocab.energyLower')[c.energy] }));
  if (c.valence && c.valence !== 'unsure') parts.push(t(`vocab.valence.${c.valence}`));
  for (const id of c.urges || []) parts.push(t(`vocab.urgeWant.${id}`));
  return parts.join(' · ');
}
