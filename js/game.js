/**
 * Index-page mini game: climb the page to the crown.
 *
 * Nothing in the level is invented; every platform is something on the page,
 * measured when the game starts:
 *   - each visual line of text (paragraphs, art caption, nav links, card
 *     captions, footer), the two shelf buttons and the top edge of each shelf
 *     card are one-way platforms: jump up through them, land on top
 *   - the blob drops in over the empty left margin, so at first there is
 *     nothing to land on; the player has to scroll the card shelf under it
 *   - a held jump climbs one line of text; a tap is a small hop. The gaps
 *     between paragraphs, and from the cards up to the text, need the red gel
 *     drop, which makes the slime bouncy for a while
 *   - smudges patrol some of the lines: touching one is fatal, landing on one
 *     bounces. The blue gel puts a bubble round the slime that shields it
 *     from them for a few seconds
 *   - the crown rests on the name in the first line; touching it wins
 * Pressing play never scrolls the page: the slime drops in wherever you are.
 * Everything stands directly on the thing it is on, and arrives through a
 * small portal: the creatures when the game starts, the blob at every drop.
 * Small synthesised sound effects mark pickups, deaths and the win; M mutes.
 * Desktop only: there is no play button on touch or narrow screens.
 */

const STEP = 1 / 120;
const GRAVITY = 1800;
const MAX_FALL = 900;
const SPEED = 140;
const HOP = .75; // height of a tapped jump, in lines of text
const COYOTE = .08;
const JUMP_BUFFER = .1;
const LAND_SPEED = 110; // slower than this is standing, not landing
const UNIT = 2; // screen pixels per sprite pixel
const SPRING_TIME = 8;
const SHIELD_TIME = 5;
const REGROW_TIME = 6;
const STOMP_TIME = .7;
const DEATH_TIME = .55;
const POP = .6; // seconds from a portal opening to its creature standing there
const VANISH = .68; // how far through its exit a creature is when it finally vanishes
const POP_STAGGER = .085; // between one creature arriving and the next: slow enough to hear the scale
const WIN_LINGER = 3.6;
const CROWN_FLY = .7; // the crown's flight from the name to above the slime
const CROWN_DROP = .25; // and its drop onto the slime's head
const FADE_MS = 300;
const HUD_SWAP_MS = 180;
const NOTE_MS = 1500; // how long "sound off" stays up
const MIN_WIDTH = 760;
const MAX_SMUDGES = 8; // on the text, counted from the top down
const HINT = '← → move · space jump · m mute · esc quit';
// Shown after a drop that ends with nothing to land on.
const NUDGE = 'what if the floor came to you?';
// For landing on the small print under the cards, where nothing leads back up.
const EGG = 'you found the footnotes. the only way out is down.';
const BEST_KEY = 'game-best-tower';
const MUTE_KEY = 'game-muted';
const VOLUME = .11;
const GEL_SHINE = '#f7cfcb';
const SHIELD_BLUE = '#3f9be6'; // the shield gel, and the bubble it puts round the slime
const SHIELD_SHINE = '#d3e9fb';
const GOLD = '#e3b341';
const ICON_PATREON = '<svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.957 7.21c-.004-3.064-2.391-5.576-5.191-6.482-3.478-1.125-8.064-.962-11.384.604C2.357 3.231 1.093 7.391 1.046 11.54c-.039 3.411.302 12.396 5.369 12.46 3.765.047 4.326-4.804 6.068-7.141 1.24-1.662 2.836-2.132 4.801-2.618 3.376-.836 5.678-3.501 5.673-7.031Z" fill="currentColor"/></svg>';
const CREDIT = `sprite assets by <a class="icon-link is-lined" href="https://www.patreon.com/krishna_palacio" target="_blank" rel="noopener">${ICON_PATREON}Krishna Palacio</a>`;

/* ---------- pixel art ---------- */

// The player is the slime from Minifantasy Creatures by Krishna Palacio,
// recoloured red. One sheet of 32px frames: row 0 idle, row 1 jump, row 2 dying.
const SLIME_SRC = '/assets/game/slime.png';
const FRAME = 32;
const SLIME_SCALE = 3;
// the body's size, its centre line and the row under its feet, in sprite pixels
const SLIME = { w: 8, h: 5, cx: 16, foot: 19 };
const ROW = { idle: 0, jump: 1, die: 2 };
const IDLE_FRAMES = 8;
const IDLE_FRAME_TIME = .2;
const DIE_FRAMES = 9;
const DIE_FRAME_TIME = .1;

// What a slime gets stronger on. a = gel, o = shine.
const GEL = [
	'....a....',
	'....a....',
	'...aaa...',
	'..aaaaa..',
	'.aaoaaaa.',
	'.aoaaaaa.',
	'.aaaaaaa.',
	'..aaaaa..'
];

// The shield: a round bead of a different gel. a = gel, o = shine.
const BUBBLE = [
	'...aaa...',
	'..aaaaa..',
	'.aaoaaaa.',
	'.aoaaaaa.',
	'.aaaaaaa.',
	'.aaaaaaa.',
	'..aaaaa..',
	'...aaa...'
];

// e = eye
const SMUDGE = {
	walkA: ['#..#.#..#', '.#######.', '#########', '##e###e##', '#########', '.#######.', '.#..#..#.'],
	walkB: ['.#.#.#.#.', '.#######.', '#########', '##e###e##', '#########', '.#######.', '#..#.#..#'],
	flat: ['.........', '.........', '.........', '#.#.#.#.#', '#########', '#e#####e#', '#########']
};

// a = the crown itself, # = jewels
const CROWN = [
	'#...#...#',
	'a...a...a',
	'aa.aaa.aa',
	'aaaaaaaaa',
	'a#aa#aa#a',
	'aaaaaaaaa'
];

const KEYS = {
	ArrowLeft: 'left', KeyA: 'left',
	ArrowRight: 'right', KeyD: 'right',
	ArrowUp: 'jump', KeyW: 'jump', Space: 'jump'
};

const ICON_PLAY = '<svg class="game-icon-play" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.6 1.5v9a.6.6 0 0 0 .9.52l7.6-4.5a.6.6 0 0 0 0-1.04l-7.6-4.5a.6.6 0 0 0-.9.52Z" fill="currentColor"/></svg>';
const ICON_STOP = '<svg class="game-icon-stop" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="2" width="8" height="8" rx="1.4" fill="currentColor"/></svg>';

const root = document.documentElement;
const art = document.querySelector('[data-art]');
const paragraphs = [...document.querySelectorAll('.prose p')];
const track = document.querySelector('.shelf-track');
const game = art && paragraphs.length && track ? init() : null;

/** A read-only look at the running game, for tests and debugging. */
export function snapshot() {
	return game ? game.snapshot() : null;
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const clock = seconds => {
	const tenths = Math.floor(seconds * 10);
	return `${Math.floor(tenths / 600)}:${String(Math.floor(tenths / 10) % 60).padStart(2, '0')}.${tenths % 10}`;
};

// 0 → 1 with a little overshoot at the end
const backOut = t => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);

// How big something is, `age` seconds after its portal opened: nothing while the
// portal opens, then it pops out to full size.
const popScale = age => (age >= POP ? 1 : age <= 0 ? 0 : backOut(clamp((age / POP - .25) / .45, 0, 1)));

function element(tag, className, html = '') {
	const node = document.createElement(tag);
	node.className = className;
	node.innerHTML = html;
	return node;
}

/* ---------- sound ---------- */

// Tiny chiptune effects, synthesised on the spot: nothing to download.
function createSound() {
	let audio = null;
	let master = null;
	let muted = false;
	try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch {}

	// Browsers only allow sound after a click, so this is called from the play button.
	function wake() {
		const Context = window.AudioContext || window.webkitAudioContext;
		if (!Context) return;
		if (!audio) {
			audio = new Context();
			master = audio.createGain();
			master.gain.value = muted ? 0 : VOLUME;
			master.connect(audio.destination);
		}
		if (audio.state === 'suspended') audio.resume().catch(() => {});
	}

	// One note: `from` Hz sliding to `to`, starting `at` seconds from now.
	function note(from, { to = from, at = 0, length = .12, type = 'square', level = 1 } = {}) {
		const start = audio.currentTime + at;
		const osc = audio.createOscillator();
		const gain = audio.createGain();
		osc.type = type;
		osc.frequency.setValueAtTime(from, start);
		if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, start + length);
		gain.gain.setValueAtTime(0, start);
		gain.gain.linearRampToValueAtTime(level, start + .008);
		gain.gain.exponentialRampToValueAtTime(.001, start + length);
		osc.connect(gain).connect(master);
		osc.start(start);
		osc.stop(start + length + .02);
	}

	// A short burst of static, for the crunchy ones. With a `cutoff` only its
	// low rumble gets through, which is what makes a sound muffled.
	function hiss(length, level, cutoff = 0) {
		const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * length), audio.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
		const source = audio.createBufferSource();
		const gain = audio.createGain();
		source.buffer = buffer;
		gain.gain.value = level;
		if (cutoff) {
			const filter = audio.createBiquadFilter();
			filter.type = 'lowpass';
			filter.frequency.value = cutoff;
			source.connect(filter).connect(gain).connect(master);
		} else {
			source.connect(gain).connect(master);
		}
		source.start();
	}

	const effects = {
		// One note of an Egyptian (double harmonic) scale, `degree` steps above the
		// tonic. The game plays these as creatures arrive (going up) and leave
		// (coming down), at the moment each one actually appears or vanishes, so
		// the tune stays with the picture however fast the page is drawing.
		scale(degree) {
			const steps = [0, 1, 4, 5, 7, 8, 11];
			const semitones = 12 * Math.floor(degree / steps.length) + steps[degree % steps.length];
			note(262 * Math.pow(2, semitones / 12), { length: .22, type: 'triangle', level: .6 });
		},
		// The slime's first appearance tops the scale off: the tonic above the
		// last of the `count` notes the creatures played, held a little longer.
		crest(count) {
			note(262 * Math.pow(2, Math.ceil(count / 7)), { length: .55, type: 'triangle', level: .8 });
		},
		// The slime leaving last: the bottom tonic, held and doubled an octave up
		// so it carries on small speakers.
		floor() {
			note(262, { length: .6, type: 'triangle', level: .9 });
			note(524, { length: .5, type: 'triangle', level: .35 });
		},
		// the slime popping out of its portal
		spawn() {
			note(196, { to: 587, at: .16, length: .16 });
			note(880, { at: .3, length: .07, type: 'triangle', level: .5 });
		},
		// spring gel: a quick climb that ends on a boing
		spring() {
			[523, 659, 784].forEach((hz, i) => note(hz, { at: i * .055, length: .09 }));
			note(784, { to: 1568, at: .165, length: .16 });
		},
		// shield gel: two soft notes ringing together
		shield() {
			note(440, { length: .34, type: 'triangle' });
			note(660, { at: .07, length: .38, type: 'triangle' });
			note(1320, { at: .14, length: .3, type: 'sine', level: .4 });
		},
		// landing on a platform: a dull, muffled thud. `weight` (0 to 1) is how
		// far it fell: a hop up one line barely taps, a long drop lands heavily.
		land(weight = .5) {
			const level = .22 + 1.25 * weight;
			note(88 - 22 * weight, { to: 38, length: .08 + .06 * weight, type: 'sine', level });
			hiss(.05 + .04 * weight, level * .9, 130 + 90 * weight);
		},
		// landing on a smudge
		stomp() {
			note(220, { to: 660, length: .1 });
		},
		// falling off the page: a long slide down
		fall() {
			note(520, { to: 70, length: .5, type: 'triangle' });
			note(260, { to: 50, at: .05, length: .5, level: .5 });
		},
		// walked into a smudge: a short crunch
		hit() {
			hiss(.16, .7);
			note(190, { to: 80, length: .18, type: 'sawtooth', level: .8 });
			note(140, { to: 60, at: .09, length: .16, type: 'sawtooth', level: .6 });
		},
		// touching the crown
		crown() {
			note(1047, { length: .08 });
			note(1568, { at: .07, length: .16, type: 'triangle' });
		},
		// the crown landing on the slime's head: a little fanfare
		win() {
			[523, 659, 784].forEach((hz, i) => note(hz, { at: i * .1, length: .12 }));
			note(1047, { at: .3, length: .5 });
			note(784, { at: .3, length: .5, type: 'triangle', level: .7 });
			note(1319, { at: .42, length: .45, type: 'triangle', level: .6 });
		}
	};

	return {
		wake,
		play(name, ...details) {
			if (!audio || muted) return;
			try { effects[name]?.(...details); } catch {}
		},
		toggle() {
			muted = !muted;
			try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch {}
			if (master) master.gain.value = muted ? 0 : VOLUME;
			return muted;
		}
	};
}

/* ---------- reading the level off the page ---------- */

// The visual lines of text inside one element. Links and emphasis split a line
// into several rects, so rects are merged by their vertical middle.
function textLines(node, scrollX, scrollY) {
	const lines = [];
	const range = document.createRange();
	const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
	while (walker.nextNode()) {
		range.selectNodeContents(walker.currentNode);
		for (const rect of range.getClientRects()) {
			if (rect.width < 1 || rect.height < 1) continue;
			const mid = (rect.top + rect.bottom) / 2 + scrollY;
			let line = lines.find(other => Math.abs(other.mid - mid) < rect.height * .4);
			if (!line) lines.push(line = { x1: Infinity, x2: -Infinity, top: Infinity, bottom: -Infinity, mid });
			line.x1 = Math.min(line.x1, rect.left + scrollX);
			line.x2 = Math.max(line.x2, rect.right + scrollX);
			line.top = Math.min(line.top, rect.top + scrollY);
			line.bottom = Math.max(line.bottom, rect.bottom + scrollY);
		}
	}
	return lines.sort((a, b) => a.top - b.top);
}

// How far below the top of a line's box the top of a letter sits. With 'x' it
// is the tops of the lowercase letters: that is where feet go, so things stand
// on the words rather than above them.
const glyphTops = new Map();
function glyphTop(node, boxHeight, letter = 'x') {
	const style = getComputedStyle(node);
	const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
	const key = `${font}|${Math.round(boxHeight)}|${letter}`;
	if (!glyphTops.has(key)) {
		const ctx = document.createElement('canvas').getContext('2d');
		ctx.font = font;
		const metrics = ctx.measureText(letter);
		const ascent = metrics.fontBoundingBoxAscent;
		const descent = metrics.fontBoundingBoxDescent;
		const baseline = ascent > 0 ? boxHeight * ascent / (ascent + descent) : boxHeight * .78;
		glyphTops.set(key, baseline - (metrics.actualBoundingBoxAscent || parseFloat(style.fontSize) * .5));
	}
	return glyphTops.get(key);
}

function measure() {
	const scrollX = window.scrollX;
	const scrollY = window.scrollY;
	const platforms = [];

	const add = (key, x1, x2, y, moving = false) => {
		const platform = { key, x1, x2, y, moving };
		platforms.push(platform);
		return platform;
	};
	const addText = (node, key, moving) => textLines(node, scrollX, scrollY).map((line, i) => {
		const platform = add(`${key}-${i}`, line.x1, line.x2, Math.round(line.top + glyphTop(node, line.bottom - line.top)), moving);
		platform.top = line.top;
		platform.height = line.bottom - line.top;
		return platform;
	});
	const box = node => {
		const rect = node.getBoundingClientRect();
		return { x1: rect.left + scrollX, x2: rect.right + scrollX, y1: rect.top + scrollY, y2: rect.bottom + scrollY };
	};

	const paras = paragraphs.map((node, i) => addText(node, `p${i}`, false)).filter(lines => lines.length);
	const lines = paras.flat();
	if (lines.length < 3) return null;

	const caption = art.parentElement.querySelector('.art-caption');
	if (caption) addText(caption, 'caption', false);
	document.querySelectorAll('.site-nav a').forEach((node, i) => addText(node, `nav${i}`, false));
	document.querySelectorAll('.site-foot > *').forEach((node, i) => addText(node, `foot${i}`, false));
	document.querySelectorAll('.shelf-btn').forEach((node, i) => {
		const rect = box(node);
		if (rect.x2 <= rect.x1) return; // hidden when the whole shelf fits on screen
		add(`btn${i}`, rect.x1, rect.x2, Math.round(rect.y1));
	});

	// The shelf scrolls sideways, so its platforms are marked as moving and
	// shifted every frame by how far the track has scrolled since now.
	const cards = [...track.querySelectorAll('.card-face')].map((node, i) => {
		const rect = box(node);
		// the corners are rounded; only the flat part of the top edge holds weight,
		// which leaves a crack between two cards wide enough to fall into
		const corner = Math.min(parseFloat(getComputedStyle(node).borderTopLeftRadius) || 0, 24) * .4;
		return add(`card${i}`, rect.x1 + corner, rect.x2 - corner, Math.round(rect.y1), true);
	});
	if (!cards.length) return null;
	track.querySelectorAll('.card-cap > *').forEach((node, i) => addText(node, `cap${i}`, true));

	// Jump heights come from the page's own spacing: a plain jump climbs one
	// line and no more; the spring clears a paragraph gap and the cards-to-text gap.
	const steps = paras.flatMap(para => para.slice(1).map((line, i) => line.y - para[i].y));
	const pitch = steps.length ? steps.sort((a, b) => a - b)[Math.floor(steps.length / 2)] : (lines[0].y - lines[0].top) * 2.4;
	const paraGap = Math.max(pitch, ...paras.slice(1).map((para, i) => para[0].y - paras[i][paras[i].length - 1].y));
	const cardGap = cards[0].y - lines[lines.length - 1].y;
	const hardGap = Math.min(cardGap, paras.length > 1 ? paraGap : Infinity);
	const baseApex = Math.max(pitch * 1.08, Math.min(pitch * 1.3, hardGap - 4));
	const springApex = Math.max(baseApex + pitch * 2.5, cardGap * 1.18, paraGap * 1.25);

	const name = paragraphs[0].querySelector('.name');
	const nameBox = name ? box(name) : { x1: lines[0].x1 + 24, x2: lines[0].x1 + 64 };
	const column = box(paragraphs[0].parentElement);
	const width = root.clientWidth;
	const blob = { w: SLIME.w * SLIME_SCALE, h: SLIME.h * SLIME_SCALE };

	return {
		width,
		height: root.scrollHeight,
		blob,
		platforms,
		paras,
		cards,
		pitch,
		baseApex,
		springApex,
		paraGap,
		cardGap,
		scrollLeft: track.scrollLeft,
		// the drop is over the empty margin, clear of the text column
		spawnX: Math.round(clamp(width * .12, 24, Math.max(24, column.x1 - blob.w - 40))),
		// the drop starts in the air, well clear of the cards it has to land on
		spawnCeiling: cards[0].y - 120,
		crown: {
			w: CROWN[0].length * UNIT,
			h: CROWN.length * UNIT,
			x: Math.round((nameBox.x1 + nameBox.x2) / 2 - CROWN[0].length * UNIT / 2),
			// it sits on the name: its base on the tops of the tall letters
			y: Math.round(lines[0].top + glyphTop(paragraphs[0], lines[0].height, 'd'))
		}
	};
}

// Gels and smudges, placed by rule so the climb works for any text, and
// sparingly: a spring on every second card (the cards are a short hop apart)
// and one on the first line of the middle paragraph, a single shield on the
// lowest long paragraph, smudges on every second line. A spring lasts
// long enough to get from one to the next, and everything grows back.
function populate(level) {
	const size = grid => ({ w: grid[0].length * UNIT, h: grid.length * UNIT });
	const gel = (type, host, at) => ({
		type, host, ...size(GEL), away: 0, born: -POP,
		offset: at * (host.x2 - host.x1 - GEL[0].length * UNIT)
	});
	const smudge = (host, index) => {
		const body = size(SMUDGE.walkA);
		return {
			host, ...body,
			x: host.x1 + [.2, .7, .45, .85][index % 4] * (host.x2 - host.x1 - body.w),
			dir: index % 2 ? -1 : 1,
			speed: 38 + 9 * (index % 3),
			flat: 0,
			step: 0,
			born: -POP
		};
	};

	const gels = level.cards.filter((card, i) => i % 2 === 1).map(card => gel('spring', card, .5));
	const middle = Math.floor(level.paras.length / 2);
	const smudges = [];
	let shielded = null;
	level.paras.forEach((para, p) => {
		if (p === middle && p > 0) gels.push(gel('spring', para[0], .3));
		// every second line of a paragraph, never its first or last
		for (let line = 1; line < para.length - 1 && smudges.length < MAX_SMUDGES; line += 2) smudges.push(smudge(para[line], smudges.length));
		if (para.length >= 5 || (p === 0 && para.length >= 3)) shielded = para;
	});
	if (shielded) gels.push(gel('shield', shielded[2], .25));
	// one more on the bottom paragraph's first line, the first text the climb reaches
	const lowest = level.paras[level.paras.length - 1];
	if (level.paras.length > 1 && !smudges.some(other => other.host === lowest[0])) smudges.push(smudge(lowest[0], smudges.length));
	// and one smudge pacing the top of a card that has no gel on it
	if (level.cards[2]) smudges.push(smudge(level.cards[2], smudges.length));
	return { gels, smudges };
}

/* ---------- the game ---------- */

function init() {
	const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
	const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

	const input = { left: false, right: false, jump: false };
	const sound = createSound();
	const sheet = new Image();
	sheet.src = SLIME_SRC;
	let button = null;
	let hud = null;
	let credit = null;
	let toast = null;
	let hudText = null;
	let pips = null;
	let state = 'idle'; // idle → wait → drop → play ⇄ dead, and finally won
	let level = null;
	let sprite = null;
	let gels = [];
	let smudges = [];
	let particles = [];
	let crownBorn = -POP;
	// When the game ends the creatures file back out through their portals, top
	// to bottom: these are the moments each one starts to go (null = staying).
	let crownGone = null;
	let slimeGone = null;
	let leaving = null; // { won, until } while that is happening
	let arrivalCount = 0; // how many notes of the scale the creatures played coming in
	// Sounds waiting for their moment in the game's own clock: [{ at, play }], soonest first.
	let cues = [];
	let corpse = null; // the slime's last moments, after an enemy got it
	let canvas = null;
	let ctx = null;
	let observer = null;
	let dpr = 1;
	let frameId = 0;
	let last = 0;
	let backlog = 0;
	let elapsed = 0; // the world's clock; the run itself is timed from the first drop
	let runStart = null;
	let wait = 0;
	let wonFor = 0;
	let deaths = 0;
	let message = null;
	let result = '';
	let relayoutQueued = false;

	/* ----- sprite ----- */

	// The blob comes out of a portal in the air near the top of the screen, hangs
	// there while it pops out (hatch counts up to POP), then drops.
	function spawn() {
		sprite = {
			x: level.spawnX, y: Math.min(window.scrollY + 110, level.spawnCeiling), vx: 0, vy: 0,
			w: level.blob.w, h: level.blob.h, face: 1, on: null, landed: false,
			coyote: 0, buffer: 0, rising: false, cut: 0, squash: 0, walk: 0, idle: 0,
			spring: 0, shield: 0, fizz: 0, crowned: false, hatch: reduceMotion.matches ? POP : 0
		};
		// its first appearance finishes the scale the creatures started; after that, a bloop
		if (runStart === null) {
			const count = arrivalCount;
			cues.push({ at: elapsed + POP * .3, play: () => sound.play('crest', count) });
		} else {
			sound.play('spawn');
		}
		if (runStart === null) runStart = elapsed;
		state = 'drop';
	}

	const runTime = () => (runStart === null ? 0 : elapsed - runStart);

	// When the game starts the creatures arrive one after another, from the
	// cards at the bottom up to the crown.
	function hatchAll(from) {
		const still = reduceMotion.matches;
		const order = [...gels, ...smudges].sort((a, b) => b.host.y - a.host.y);
		order.forEach((creature, i) => { creature.born = still ? -POP : from + i * POP_STAGGER; });
		crownBorn = still ? -POP : from + order.length * POP_STAGGER + .15;
		// when the last portal has closed
		return still ? from : crownBorn + POP;
	}

	const arrived = creature => elapsed >= creature.born + POP;

	// How far through its portal something is, for drawing: it counts up from its
	// arrival, and once it has been told to go, back down to nothing.
	const presence = (born, gone) => (gone != null && elapsed >= gone ? POP - (elapsed - gone) : elapsed - born);


	function burst(x, y, count, { accent = false, speed = 120, lift = 0 } = {}) {
		for (let i = 0; i < count; i++) {
			const angle = Math.random() * Math.PI * 2;
			const push = speed * (.4 + Math.random() * .6);
			particles.push({
				x, y, vx: Math.cos(angle) * push, vy: Math.sin(angle) * push - lift,
				life: .35 + Math.random() * .4, tone: accent ? i % 3 : 1
			});
		}
	}

	function die(fell) {
		const s = sprite;
		if (fell) {
			// a fall ends below the screen; the poof is drawn where it left
			const edge = window.scrollY + window.innerHeight;
			burst(s.x + s.w / 2, Math.min(s.y - s.h / 2, edge - 6), reduceMotion.matches ? 0 : 12, { lift: 160 });
			if (!s.landed) message = { text: NUDGE, until: elapsed + 6, nudge: true };
		} else {
			// an enemy got it: it melts where it stood
			corpse = { x: s.x + s.w / 2, y: s.y, face: s.face, age: 0 };
		}
		sound.play(fell ? 'fall' : 'hit');
		deaths++;
		state = 'dead';
		wait = fell ? DEATH_TIME : DIE_FRAMES * DIE_FRAME_TIME + .25;
		sprite = null;
	}

	// Touching the crown wins. The crown then flies over and lands on the
	// slime's head, and that is when the fanfare and confetti go off.
	function win() {
		state = 'won';
		wonFor = 0;
		sprite.vx = 0;
		let best = null;
		try { best = Number(localStorage.getItem(BEST_KEY)) || null; } catch {}
		const time = runTime();
		const record = !best || time < best;
		if (record) {
			try { localStorage.setItem(BEST_KEY, String(Math.floor(time * 10) / 10)); } catch {}
		}
		result = record ? `${clock(time)} · new best` : `${clock(time)} · best ${clock(best)}`;
		if (reduceMotion.matches) crownLands();
		else sound.play('crown');
	}

	function crownLands() {
		const s = sprite;
		s.crowned = true;
		s.squash = 1; // it dips under the weight
		sound.play('win');
		if (!reduceMotion.matches) burst(s.x + s.w / 2, s.y - s.h, 34, { accent: true, speed: 230, lift: 150 });
	}

	/* ----- physics ----- */

	// The shelf may have been scrolled since the last frame: move its platforms,
	// and whoever is standing on one goes with it.
	function carryShelf() {
		const shift = level.scrollLeft - track.scrollLeft;
		if (!shift) return;
		level.scrollLeft = track.scrollLeft;
		for (const platform of level.platforms) {
			if (!platform.moving) continue;
			platform.x1 += shift;
			platform.x2 += shift;
		}
		for (const smudge of smudges) if (smudge.host.moving) smudge.x += shift;
		if (sprite?.on?.moving) sprite.x += shift;
	}

	// How much of the slime may hang over an edge: it stands only while most of
	// its body is over the platform, and slips off once its middle passes the edge.
	const footing = s => s.w * .42;

	function supportBelow(s) {
		const foot = footing(s);
		return level.platforms.some(p => p.y >= s.y - .01 && s.x + s.w - foot >= p.x1 && s.x + foot <= p.x2);
	}

	function moveY(dt) {
		const s = sprite;
		const y = s.y + s.vy * dt;
		s.on = null;
		if (s.vy < 0) {
			s.y = y;
			return;
		}

		// Land on the highest platform the feet cross on the way down.
		const foot = footing(s);
		let landing = null;
		for (const platform of level.platforms) {
			if (platform.y < s.y - .01 || platform.y > y) continue;
			if (s.x + s.w - foot < platform.x1 || s.x + foot > platform.x2) continue;
			if (!landing || platform.y < landing.y) landing = platform;
		}
		if (!landing) {
			s.y = y;
			return;
		}
		// a real landing, not just standing there: the further it fell, the heavier the thud
		const landed = s.vy > LAND_SPEED;
		if (s.vy > 200) s.squash = 1;
		if (landed) sound.play('land', clamp((s.vy - LAND_SPEED) / (MAX_FALL - LAND_SPEED), 0, 1));
		s.y = landing.y;
		s.vy = 0;
		s.on = landing;
		s.landed = true;
		// under the shelf, on a card's caption: an easter egg for actually landing there
		if (landed && /^cap\d/.test(landing.key)) message = { text: EGG, until: elapsed + 6 };
		// landed after being teased about it: the puzzle is solved
		if (message?.nudge) message = { text: 'nice!', until: elapsed + 1.8 };
	}

	const overlaps = (s, x, y, w, h, inset = 0) =>
		s.x + inset < x + w && s.x + s.w - inset > x && s.y > y - h && s.y - s.h + inset < y;

	function meetSmudges(fromY) {
		const s = sprite;
		for (const smudge of smudges) {
			if (smudge.flat > 0 || !arrived(smudge)) continue;
			const top = smudge.host.y - smudge.h;
			// hit boxes are a little smaller than the art: lines are packed tighter than a blob is tall
			if (!overlaps(s, smudge.x + 2, smudge.host.y, smudge.w - 4, smudge.h - 2, 3)) continue;
			if (s.vy > 0 && fromY <= top + 6) {
				// landed on its back: it flattens for a moment and throws the blob upward
				smudge.flat = STOMP_TIME;
				sound.play('stomp');
				s.y = top;
				s.vy = -Math.sqrt(2 * GRAVITY * level.springApex);
				s.rising = false;
				s.on = null;
				if (!reduceMotion.matches) burst(smudge.x + smudge.w / 2, smudge.host.y - 2, 6, { speed: 70 });
			} else if (s.shield <= 0) {
				die(false);
				return;
			}
		}
	}

	function meetGels() {
		const s = sprite;
		for (const m of gels) {
			if (m.away > 0 || !arrived(m)) continue;
			if (!overlaps(s, m.host.x1 + m.offset, m.host.y, m.w, m.h)) continue;
			m.away = REGROW_TIME;
			if (m.type === 'spring') s.spring = SPRING_TIME;
			else s.shield = SHIELD_TIME;
			sound.play(m.type);
			if (!reduceMotion.matches) burst(m.host.x1 + m.offset + m.w / 2, m.host.y - m.h / 2, 8, { accent: m.type === 'spring', speed: 80 });
		}
	}

	function stepSprite(dt) {
		const s = sprite;
		if (s.hatch < POP) {
			s.hatch += dt;
			return;
		}
		const playing = state === 'play';
		const dir = playing ? Number(input.right) - Number(input.left) : 0;

		s.vx = dir * SPEED;
		if (dir) {
			s.face = dir;
			s.walk += dt;
		} else {
			s.walk = 0;
		}
		s.idle = dir || !s.on ? 0 : s.idle + dt;
		s.spring = Math.max(0, s.spring - dt);
		s.shield = Math.max(0, s.shield - dt);
		// while the gel lasts, little beads of it fizz off the slime
		s.fizz -= dt;
		if (s.spring > 0 && s.fizz <= 0 && !reduceMotion.matches) {
			s.fizz = .11;
			particles.push({ x: s.x + Math.random() * s.w, y: s.y - s.h * .5, vx: (Math.random() - .5) * 24, vy: -70 - Math.random() * 50, life: .4, tone: 0 });
		}

		s.coyote = s.on ? COYOTE : s.coyote - dt;
		s.buffer -= dt;
		if (playing && s.buffer > 0 && s.coyote > 0) {
			const apex = s.spring > 0 ? level.springApex : level.baseApex;
			s.vy = -Math.sqrt(2 * GRAVITY * apex);
			// Letting go early cuts the jump down to a hop of under one line: enough to
			// come down on a smudge's back, not enough to climb. Holding climbs.
			s.cut = Math.max(s.vy * .92, -Math.sqrt(2 * GRAVITY * level.pitch * HOP));
			s.coyote = 0;
			s.buffer = 0;
			s.rising = true;
		}
		if (s.rising && !input.jump && s.vy < s.cut) s.vy = s.cut;
		if (s.vy >= 0) s.rising = false;
		s.vy = Math.min(s.vy + GRAVITY * dt, MAX_FALL);

		const fromY = s.y;
		s.x = clamp(s.x + s.vx * dt, 0, level.width - s.w);
		moveY(dt);
		s.squash = Math.max(0, s.squash - dt / .14);

		if (state === 'drop' && s.on) state = 'play';
		if (state === 'won') return;

		meetSmudges(fromY);
		if (!sprite) return;
		meetGels();

		const crown = level.crown;
		if (playing && elapsed >= crownBorn + POP && overlaps(s, crown.x, crown.y, crown.w, crown.h)) {
			win();
			return;
		}

		// Off the bottom of the screen with nothing underneath, or off the page.
		const edge = Math.min(level.height, window.scrollY + window.innerHeight);
		if (s.y - s.h > level.height || (s.y - s.h > edge && !supportBelow(s))) die(true);
	}

	function stepWorld(dt) {
		const frozen = state === 'out';
		for (const smudge of smudges) {
			if (frozen) break;
			if (smudge.flat > 0) {
				smudge.flat -= dt;
				continue;
			}
			if (!arrived(smudge)) continue;
			const max = smudge.host.x2 - smudge.w;
			smudge.x += smudge.dir * smudge.speed * dt;
			smudge.step += dt;
			if (smudge.x <= smudge.host.x1) {
				smudge.x = smudge.host.x1;
				smudge.dir = 1;
			} else if (smudge.x >= max) {
				smudge.x = max;
				smudge.dir = -1;
			}
		}
		for (const m of gels) {
			// nothing grows back once the crown is taken or the game is ending
			if (m.away <= 0 || state === 'won' || frozen) continue;
			m.away -= dt;
			// a regrown gel comes back the way it first arrived
			if (m.away <= 0) {
				m.away = 0;
				m.born = reduceMotion.matches ? -POP : elapsed;
			}
		}
		for (const p of particles) {
			p.vy += GRAVITY * .3 * dt;
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			p.life -= dt;
		}
		particles = particles.filter(p => p.life > 0);
	}

	function step(dt) {
		if (state !== 'won') elapsed += dt;
		else wonFor += dt;
		stepWorld(dt);
		while (cues.length && cues[0].at <= elapsed) cues.shift().play();
		if (corpse && (corpse.age += dt) > DIE_FRAMES * DIE_FRAME_TIME) corpse = null;
		if (state === 'out') return;
		if (state === 'won' && !sprite.crowned && wonFor >= CROWN_FLY + CROWN_DROP) crownLands();
		if (state === 'wait' || state === 'dead') {
			wait -= dt;
			if (wait <= 0) spawn();
			return;
		}
		stepSprite(dt);
	}

	/* ----- drawing ----- */

	const snap = value => Math.round(value * dpr) / dpr;

	function paint(rows, x, y, px, py, colours) {
		rows.forEach((row, r) => {
			const top = snap(y + r * py);
			const height = snap(y + (r + 1) * py) - top;
			for (let c = 0; c < row.length; c++) {
				const colour = colours[row[c]];
				if (!colour) continue;
				let end = c;
				while (row[end + 1] === row[c]) end++;
				const left = snap(x + c * px);
				ctx.fillStyle = colour;
				ctx.fillRect(left, top, snap(x + (end + 1) * px) - left, height);
				c = end;
			}
		});
	}

	// A filled ellipse built from pixel rows.
	function disc(cx, cy, radius, colour) {
		const rows = Math.round((radius * .9) / UNIT);
		ctx.fillStyle = colour;
		for (let row = -rows; row < rows; row++) {
			const half = Math.round((radius * Math.sqrt(1 - Math.pow((row + .5) / rows, 2))) / UNIT) * UNIT;
			if (half > 0) ctx.fillRect(cx - half, cy + row * UNIT, half * 2, UNIT);
		}
	}

	// A hole that opens in the page, lets its creature out, and closes again:
	// an ink rim round a blank middle, with a few sparks circling it.
	function drawPortal(cx, cy, size, age, colours) {
		if (age < 0 || age > POP) return;
		const t = age / POP;
		const open = t < .3 ? 1 - Math.pow(1 - t / .3, 3) : t > .6 ? 1 - Math.pow((t - .6) / .4, 2) : 1;
		const radius = (size * .7 + 5) * open;
		if (radius < UNIT * 2) return;
		const x = Math.round(cx);
		const y = Math.round(cy);
		disc(x, y, radius, colours.ink);
		disc(x, y, radius - UNIT, colours.bg);
		ctx.fillStyle = colours.accent;
		for (let i = 0; i < 6; i++) {
			const angle = (i / 6) * Math.PI * 2 + t * 6;
			ctx.fillRect(snap(x + Math.cos(angle) * (radius + 4) - UNIT / 2), snap(y + Math.sin(angle) * (radius + 4) * .9 - UNIT / 2), UNIT, UNIT);
		}
	}

	// A soft halo behind a power-up, breathing slowly. Each colour's halo is
	// painted once and then stamped, which is far cheaper than a gradient a frame.
	const GLOW_RADIUS = 13;
	const halos = new Map();
	function halo(colour) {
		if (!halos.has(colour)) {
			const stamp = document.createElement('canvas');
			stamp.width = stamp.height = GLOW_RADIUS * 2;
			const painting = stamp.getContext('2d');
			const glow = painting.createRadialGradient(GLOW_RADIUS, GLOW_RADIUS, 2, GLOW_RADIUS, GLOW_RADIUS, GLOW_RADIUS);
			glow.addColorStop(0, colour);
			glow.addColorStop(1, 'transparent');
			painting.fillStyle = glow;
			painting.fillRect(0, 0, GLOW_RADIUS * 2, GLOW_RADIUS * 2);
			halos.set(colour, stamp);
		}
		return halos.get(colour);
	}

	function drawGlow(cx, cy, colour, strength, now) {
		const pulse = reduceMotion.matches ? .85 : .75 + .25 * Math.sin(now / 520 + cx);
		ctx.globalAlpha = strength * pulse;
		ctx.drawImage(halo(colour), Math.round(cx) - GLOW_RADIUS, Math.round(cy) - GLOW_RADIUS);
		ctx.globalAlpha = 1;
	}

	// One creature's sprite, popping out of its portal if it has only just arrived.
	function drawArrival(rows, x, y, w, h, age, colours, tones) {
		const cx = x + w / 2;
		const cy = y - h / 2;
		drawPortal(cx, cy, Math.max(w, h), age, colours);
		const k = popScale(age);
		if (k > 0) paint(rows, cx - (w * k) / 2, cy - (h * k) / 2, UNIT * k, UNIT * k, tones);
	}

	// A buff about to run out flickers.
	const lit = (left, now) => left > 1.2 || Math.floor(now / 110) % 2 === 0;

	// gold, with red jewels
	const crownTones = colours => ({ a: GOLD, '#': colours.accent });

	// Which frame of the sheet the slime is in: [row, column].
	function pose(s) {
		const still = reduceMotion.matches;
		if (!s.on) return [ROW.jump, 2];
		if (s.squash > 0 && !still) return [ROW.jump, 3];
		// it gets about by leaning, squashing and springing back
		if (s.vx) return still ? [ROW.idle, 0] : [[ROW.idle, 0], [ROW.jump, 1], [ROW.idle, 1]][Math.floor(s.walk * 9) % 3];
		return [ROW.idle, still ? 0 : Math.floor(s.idle / IDLE_FRAME_TIME) % IDLE_FRAMES];
	}

	// Where the body sits inside a frame, read off the sheet once: the crown and
	// the bubble follow the slime as it is drawn, whatever shape it is in.
	const boxes = new Map();
	function frameBox(row, col) {
		const key = row * 16 + col;
		if (boxes.has(key)) return boxes.get(key);
		const box = { left: SLIME.cx - SLIME.w / 2, right: SLIME.cx + SLIME.w / 2, top: SLIME.foot - SLIME.h, bottom: SLIME.foot };
		if (!sheet.complete || !sheet.naturalWidth) return box;
		const probe = document.createElement('canvas');
		probe.width = probe.height = FRAME;
		const probing = probe.getContext('2d');
		probing.drawImage(sheet, col * FRAME, row * FRAME, FRAME, FRAME, 0, 0, FRAME, FRAME);
		const data = probing.getImageData(0, 0, FRAME, FRAME).data;
		let [left, right, top, bottom] = [FRAME, 0, FRAME, 0];
		for (let i = 3; i < data.length; i += 4) {
			if (!data[i]) continue;
			const x = ((i - 3) / 4) % FRAME;
			const y = Math.floor((i - 3) / 4 / FRAME);
			left = Math.min(left, x);
			right = Math.max(right, x + 1);
			top = Math.min(top, y);
			bottom = Math.max(bottom, y + 1);
		}
		if (right > left) Object.assign(box, { left, right, top, bottom });
		boxes.set(key, box);
		return box;
	}

	// The sheet's mid-air frame is drawn hovering above the ground; here the
	// physics does the moving, so that frame is brought down to sit on the feet.
	const drop = (row, col) => (row === ROW.jump && col === 2 ? (SLIME.foot - frameBox(row, col).bottom) * SLIME_SCALE : 0);

	// Where the base of a worn crown goes: on top of the slime, sunk in a touch.
	const headY = (s, row, col) => s.y + drop(row, col) - (SLIME.foot - frameBox(row, col).top) * SLIME_SCALE + UNIT;

	// One frame of the sheet, its feet at (cx, footY), mirrored when facing left.
	function drawFrame(row, col, cx, footY, face, k = 1) {
		if (!sheet.complete || !sheet.naturalWidth) return;
		const unit = SLIME_SCALE * k;
		ctx.save();
		ctx.imageSmoothingEnabled = false;
		ctx.translate(snap(cx), snap(footY));
		ctx.scale(face < 0 ? -1 : 1, 1);
		ctx.drawImage(sheet, col * FRAME, row * FRAME, FRAME, FRAME, -SLIME.cx * unit, -SLIME.foot * unit, FRAME * unit, FRAME * unit);
		ctx.restore();
	}

	function drawSprite(colours, now) {
		const s = sprite;
		const cx = s.x + s.w / 2;
		// in or out through a portal: arriving (hatch counts up) or leaving at the end
		const age = slimeGone != null && elapsed >= slimeGone ? POP - (elapsed - slimeGone) : s.hatch;
		const hatching = age < POP;
		const k = popScale(age);
		if (hatching) drawPortal(cx, s.y - s.h / 2, s.w, age, colours);
		if (k <= 0) return;
		const [row, col] = hatching ? [ROW.idle, 0] : pose(s);
		// feet stay planted, except while it grows out of the middle of its portal
		drawFrame(row, col, cx, hatching ? s.y - (s.h / 2) * (1 - k) : s.y + drop(row, col), s.face, k);

		if (s.shield > 0 && lit(s.shield, now)) drawShield(s, row, col);
		if (s.crowned && k >= 1) {
			const crown = level.crown;
			paint(CROWN, Math.round(cx - crown.w / 2), headY(s, row, col) - crown.h, UNIT, UNIT, crownTones(colours));
		}
	}

	// The bubble the slime is wearing: a thin film all the way round the body
	// exactly where this frame draws it, so it never trails behind.
	function drawShield(s, row, col) {
		const box = frameBox(row, col);
		const cx = s.x + s.w / 2 + s.face * ((box.left + box.right) / 2 - SLIME.cx) * SLIME_SCALE;
		const cy = s.y + drop(row, col) - (SLIME.foot - (box.top + box.bottom) / 2) * SLIME_SCALE;
		const rx = s.w / 2 + 6;
		const ry = s.w / 2 + 3;
		const dots = Math.ceil((Math.PI * (rx + ry)) / UNIT);
		ctx.fillStyle = SHIELD_BLUE;
		for (let i = 0; i < dots; i++) {
			const angle = (i / dots) * Math.PI * 2;
			ctx.fillRect(snap(cx + Math.cos(angle) * rx - UNIT / 2), snap(cy + Math.sin(angle) * ry - UNIT / 2), UNIT, UNIT);
		}
		ctx.fillStyle = SHIELD_SHINE;
		ctx.fillRect(snap(cx - rx * .55), snap(cy - ry * .6), UNIT * 2, UNIT);
	}

	// The crown on its way from the name to the slime: up and over in an arc,
	// a pause above its head, then down.
	function drawCrowning(colours) {
		const crown = level.crown;
		const s = sprite;
		const [row, col] = pose(s);
		const overX = s.x + s.w / 2 - crown.w / 2;
		const worn = headY(s, row, col);
		const hover = worn - 16;
		let x = overX;
		let y;
		if (wonFor < CROWN_FLY) {
			const t = wonFor / CROWN_FLY;
			const eased = t * t * (3 - 2 * t);
			x = crown.x + (overX - crown.x) * eased;
			y = crown.y + (hover - crown.y) * eased - Math.sin(Math.PI * eased) * 22;
		} else {
			const t = clamp((wonFor - CROWN_FLY) / CROWN_DROP, 0, 1);
			y = hover + (worn - hover) * t * t;
		}
		paint(CROWN, Math.round(x), Math.round(y) - crown.h, UNIT, UNIT, crownTones(colours));
	}

	function drawCrown(colours, now) {
		const crown = level.crown;
		const still = reduceMotion.matches;
		const age = presence(crownBorn, crownGone);
		drawArrival(CROWN, crown.x, crown.y, crown.w, crown.h, age, colours, crownTones(colours));
		if (age < POP) return;
		const top = crown.y - crown.h;
		// the glint: a bright column that sweeps across it now and then
		const sweep = still ? -1 : Math.floor((now % 2400) / 70);
		if (sweep < 0 || sweep >= CROWN[0].length) return;
		ctx.fillStyle = colours.bg;
		ctx.globalAlpha = .7;
		ctx.fillRect(snap(crown.x + sweep * UNIT), snap(top + 2 * UNIT), UNIT, 4 * UNIT);
		ctx.globalAlpha = 1;
	}

	function draw(now) {
		const style = getComputedStyle(root);
		const colour = name => style.getPropertyValue(name).trim();
		const colours = { ink: colour('--ink'), mute: colour('--mute'), accent: colour('--accent'), bg: colour('--bg') };

		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, level.width, level.height);

		// Everything is drawn with its base on the surface it stands on.
		for (const m of gels) {
			if (m.away > 0) continue;
			const spring = m.type === 'spring';
			const x = Math.round(m.host.x1 + m.offset);
			const age = presence(m.born, m.gone);
			if (age >= POP) drawGlow(x + m.w / 2, m.host.y - m.h / 2, spring ? colours.accent : SHIELD_BLUE, .15, now);
			const tones = spring ? { a: colours.accent, o: GEL_SHINE } : { a: SHIELD_BLUE, o: SHIELD_SHINE };
			drawArrival(spring ? GEL : BUBBLE, x, m.host.y, m.w, m.h, age, colours, tones);
		}

		if (state === 'won' && sprite && !sprite.crowned) drawCrowning(colours);
		else if (!sprite?.crowned) drawCrown(colours, now);

		for (const smudge of smudges) {
			const frame = smudge.flat > 0 ? SMUDGE.flat : Math.floor(smudge.step * 6) % 2 ? SMUDGE.walkB : SMUDGE.walkA;
			drawArrival(frame, smudge.x, smudge.host.y, smudge.w, smudge.h, presence(smudge.born, smudge.gone), colours, { '#': colours.ink, e: colours.accent });
		}

		if (corpse) drawFrame(ROW.die, Math.min(DIE_FRAMES - 1, Math.floor(corpse.age / DIE_FRAME_TIME)), corpse.x, corpse.y, corpse.face);
		if (sprite) drawSprite(colours, now);

		const tones = [colours.accent, colours.ink, colours.mute];
		for (const p of particles) {
			ctx.globalAlpha = clamp(p.life / .3, 0, 1);
			ctx.fillStyle = tones[p.tone];
			ctx.fillRect(snap(p.x), snap(p.y), UNIT, UNIT);
		}
		ctx.globalAlpha = 1;
	}

	/* ----- camera ----- */

	// The page only follows the slime upward, as it climbs towards the top of the
	// screen. Landing never moves the page, and a fall is left to leave the
	// screen. It moves only when the slime's height changes: while the slime
	// stays level the page is the player's to scroll.
	let followedY = null;
	function follow() {
		if (state !== 'play' || !sprite || sprite.y === followedY) return;
		followedY = sprite.y;
		const margin = Math.min(140, window.innerHeight * .22);
		const top = sprite.y - sprite.h - window.scrollY;
		if (top < margin) window.scrollBy(0, top - margin);
	}

	/* ----- HUD ----- */

	// The line beside the button shows one thing at a time: a hint, the running
	// time, the result. When it changes kind the old text fades out and the new
	// one fades in; the clock ticking over is not a change of kind.
	let shownKind = null;
	let swapping = false;
	function renderHud() {
		// a win keeps its result up while everything files out
		const finished = state === 'won' || leaving?.won;
		const showing = message && elapsed < message.until && !finished;
		const text = finished ? result : showing ? message.text : clock(runTime());
		const kind = finished ? 'result' : showing ? message.text : 'time';
		const put = () => {
			hudText.textContent = text;
			hud.classList.toggle('is-time', kind === 'time');
		};
		if (shownKind === null || reduceMotion.matches) {
			shownKind = kind;
			put();
		} else if (kind !== shownKind && !swapping) {
			swapping = true;
			shownKind = kind;
			const line = hudText;
			line.classList.add('is-out');
			setTimeout(() => {
				swapping = false;
				line.classList.remove('is-out');
				if (line === hudText && state !== 'idle') renderHud();
			}, HUD_SWAP_MS);
		} else if (!swapping && hudText.textContent !== text) {
			put();
		}
		pips.spring.style.setProperty('--left', sprite ? sprite.spring / SPRING_TIME : 0);
		pips.shield.style.setProperty('--left', sprite ? sprite.shield / SHIELD_TIME : 0);
		pips.spring.hidden = !(sprite?.spring > 0);
		pips.shield.hidden = !(sprite?.shield > 0);
	}

	/* ----- loop ----- */

	function frame(now) {
		frameId = requestAnimationFrame(frame);
		carryShelf();
		backlog += Math.min(.05, (now - last) / 1000);
		last = now;
		while (backlog >= STEP) {
			step(STEP);
			backlog -= STEP;
		}
		if (state === 'won' && wonFor > WIN_LINGER) stop(true);
		if (state === 'out' && elapsed >= leaving.until) {
			stop(leaving.won, true);
			return;
		}
		follow();
		draw(now);
		renderHud();
	}

	function onVisibility() {
		cancelAnimationFrame(frameId);
		if (document.hidden) return;
		last = performance.now();
		frameId = requestAnimationFrame(frame);
	}

	/* ----- layout changes mid-game ----- */

	function sizeCanvas() {
		// One canvas pixel per CSS pixel, scaled up without smoothing: the art is
		// whole CSS pixels, so it looks the same, and the layer (which covers the
		// whole page) stays cheap to redraw on dense or zoomed displays.
		dpr = 1;
		canvas.width = Math.round(level.width);
		canvas.height = Math.round(level.height);
		canvas.style.width = `${level.width}px`;
		canvas.style.height = `${level.height}px`;
	}

	function relayout() {
		relayoutQueued = false;
		if (state === 'idle') return;
		const old = { level, gels, smudges };
		const next = measure();
		if (!next || !allowed()) {
			stop(false, true);
			return;
		}
		level = next;
		const made = populate(level);
		const find = platform => level.platforms.find(other => other.key === platform.key);

		// keep everyone on the platform they were on, the same way along it
		made.gels.forEach((m, i) => {
			m.away = old.gels[i]?.away ?? 0;
			m.born = old.gels[i]?.born ?? -POP;
		});
		made.smudges.forEach((smudge, i) => {
			const before = old.smudges[i];
			smudge.born = before?.born ?? -POP;
			if (!before || before.host.key !== smudge.host.key) return;
			const along = (before.x - before.host.x1) / Math.max(1, before.host.x2 - before.host.x1 - before.w);
			smudge.x = smudge.host.x1 + along * (smudge.host.x2 - smudge.host.x1 - smudge.w);
			smudge.dir = before.dir;
			smudge.flat = before.flat;
		});
		gels = made.gels;
		smudges = made.smudges;

		const s = sprite;
		const on = s?.on && find(s.on);
		if (on) {
			s.x = clamp(on.x1 + (s.x - s.on.x1), on.x1 - s.w / 2, on.x2 - s.w / 2);
			s.y = on.y;
			s.on = on;
		} else if (s && state !== 'won') {
			spawn();
		}
		sizeCanvas();
	}

	function queueRelayout() {
		if (relayoutQueued || state === 'idle') return;
		relayoutQueued = true;
		requestAnimationFrame(relayout);
	}

	/* ----- input ----- */

	function press(name, down) {
		if (name === 'jump' && down && !input.jump && sprite) sprite.buffer = JUMP_BUFFER;
		input[name] = down;
	}

	function onKeyDown(event) {
		if (event.metaKey || event.ctrlKey || event.altKey) return;
		if (event.code === 'Escape') {
			stop();
			return;
		}
		if (event.code === 'KeyM' && !event.repeat) {
			announce(sound.toggle() ? 'sound off' : 'sound on');
			return;
		}
		const name = KEYS[event.code];
		if (!name && event.code !== 'ArrowDown') return;
		// These keys would otherwise scroll the page or press whichever button has focus.
		event.preventDefault();
		if (name && !event.repeat) press(name, true);
	}

	function onKeyUp(event) {
		const name = KEYS[event.code];
		if (!name) return;
		event.preventDefault();
		press(name, false);
	}

	function releaseAll() {
		for (const name in input) input[name] = false;
	}

	// A short note under the credit (sound on, sound off) that fades in, waits, and fades out.
	let noteTimer = 0;
	function announce(text) {
		toast.textContent = text;
		toast.classList.add('is-visible');
		clearTimeout(noteTimer);
		noteTimer = setTimeout(() => toast?.classList.remove('is-visible'), NOTE_MS);
	}

	/* ----- start and stop ----- */

	// The HUD and the button's "play game" label share one spot: one fades out as the other fades in.
	function showHud(on) {
		hud?.classList.toggle('is-visible', on);
		button?.classList.toggle('has-hud', on);
	}

	function start() {
		level = measure();
		if (!level) return;
		({ gels, smudges } = populate(level));

		sprite = null;
		particles = [];
		corpse = null;
		elapsed = 0;
		backlog = 0;
		deaths = 0;
		result = '';
		message = { text: HINT, until: 4.5 };
		shownKind = null;
		releaseAll();
		crownGone = slimeGone = leaving = null;
		cues = [];
		runStart = null;
		state = 'wait';
		// the slime comes last, once everything else has arrived
		wait = hatchAll(.2) + .2;
		sound.wake();
		// one note per arrival, in the order they pop out
		const arrivals = [...gels, ...smudges].map(creature => creature.born).concat(crownBorn).filter(at => at >= 0);
		arrivalCount = arrivals.length;
		cues = arrivals.sort((a, b) => a - b).map((at, degree) => ({ at: at + POP * .3, play: () => sound.play('scale', degree) }));

		document.querySelectorAll('.game-canvas').forEach(node => node.remove());
		canvas = element('canvas', 'game-canvas');
		canvas.setAttribute('aria-hidden', 'true');
		ctx = canvas.getContext('2d');
		sizeCanvas();
		document.body.append(canvas);
		// one frame at opacity 0 first, so the fade-in has something to start from
		requestAnimationFrame(() => requestAnimationFrame(() => canvas?.classList.add('is-on')));

		root.dataset.leaveHold = String(FADE_MS);
		button.classList.add('is-playing');
		button.setAttribute('aria-label', 'Quit the mini game');
		hud.classList.add('is-playing');
		showHud(true);
		credit.classList.add('is-fixed', 'is-playing');

		window.addEventListener('keydown', onKeyDown, true);
		window.addEventListener('keyup', onKeyUp, true);
		window.addEventListener('blur', releaseAll);
		document.addEventListener('visibilitychange', onVisibility);
		observer = new ResizeObserver(queueRelayout);
		observer.observe(paragraphs[0].parentElement);
		observer.observe(document.body);
		document.fonts?.ready.then(queueRelayout);

		last = performance.now();
		frameId = requestAnimationFrame(frame);
	}

	// Ending a game: everything files out through its portal, top to bottom, to
	// the scale played back down, and then the layer goes. `quick` skips that
	// (leaving the page, a second press of stop, reduced motion).
	function beginExit(won) {
		const going = [];
		if (!sprite?.crowned) going.push({ y: level.crown.y, go: at => { crownGone = at; } });
		for (const creature of [...gels.filter(m => m.away <= 0), ...smudges]) going.push({ y: creature.host.y, go: at => { creature.gone = at; } });
		going.sort((a, b) => a.y - b.y);
		const first = elapsed + .1;
		going.forEach((thing, i) => thing.go(first + i * POP_STAGGER));
		// the slime always goes last, on the lowest note
		const steps = going.length + (sprite ? 1 : 0);
		if (sprite) slimeGone = first + going.length * POP_STAGGER;
		// Each note is cued for the moment its creature vanishes (most of the way
		// through its exit), counting down the scale; the bottom note is the slime's.
		cues = going.map((thing, i) => ({
			at: first + i * POP_STAGGER + POP * VANISH,
			play: () => sound.play('scale', going.length - i)
		}));
		if (sprite) cues.push({ at: slimeGone + POP * VANISH, play: () => sound.play('floor') });
		// long enough for the last portal to close and the last note to ring out
		leaving = { won, until: first + Math.max(0, steps - 1) * POP_STAGGER + POP + .45 };
		state = 'out';
		releaseAll();
		// a quit clears the text beside the button straight away; a win keeps its time up
		if (!won) showHud(false);
	}

	function stop(won = false, quick = false) {
		if (state === 'idle') return;
		if (state !== 'out' && !quick && !reduceMotion.matches && level) {
			beginExit(won);
			return;
		}
		state = 'idle';
		cancelAnimationFrame(frameId);
		window.removeEventListener('keydown', onKeyDown, true);
		window.removeEventListener('keyup', onKeyUp, true);
		window.removeEventListener('blur', releaseAll);
		document.removeEventListener('visibilitychange', onVisibility);
		observer.disconnect();
		releaseAll();

		// the layer fades out, then goes
		const fading = canvas;
		const fadingHud = hud;
		canvas = null;
		fading.classList.remove('is-on');
		setTimeout(() => fading.remove(), FADE_MS);

		delete root.dataset.leaveHold;
		clearTimeout(noteTimer);
		toast?.classList.remove('is-visible');
		button?.classList.remove('is-playing');
		button?.setAttribute('aria-label', 'Play the mini game');
		pips.spring.hidden = pips.shield.hidden = true;

		// The text beside the button fades out where it is. Only once it has gone
		// does it stop being pinned to the screen (unless a new game began meanwhile).
		const fadingCredit = credit;
		const letGo = () => setTimeout(() => {
			if (state !== 'idle') return;
			fadingHud.classList.remove('is-playing');
			fadingCredit?.classList.remove('is-fixed');
		}, FADE_MS);
		fadingCredit?.classList.remove('is-playing');
		// a winning time stays up for a while first
		if (won) {
			setTimeout(() => {
				if (state !== 'idle') return;
				showHud(false);
				letGo();
			}, 6000);
		} else {
			showHud(false);
			letGo();
		}
	}

	/* ----- the play button exists only where the game is playable ----- */

	const allowed = () => finePointer.matches && window.innerWidth >= MIN_WIDTH;

	function mount() {
		button = element('button', 'game-play', `${ICON_PLAY}${ICON_STOP}<span class="game-play-label" aria-hidden="true">play game</span>`);
		button.type = 'button';
		button.setAttribute('aria-label', 'Play the mini game');
		button.addEventListener('click', event => {
			if (state === 'idle') start();
			else stop();
			// after a mouse click the button would keep focus, and the next press of
			// space (the jump key) would click it again
			if (event.detail > 0) button.blur();
		});

		hud = element('p', 'game-hud', '<span class="game-hud-text"></span><i class="game-pip is-spring" hidden></i><i class="game-pip is-shield" hidden></i>');
		hudText = hud.querySelector('.game-hud-text');
		pips = { spring: hud.querySelector('.is-spring'), shield: hud.querySelector('.is-shield') };
		credit = element('p', 'game-credit', CREDIT);
		toast = element('p', 'game-note');
		toast.setAttribute('role', 'status');
		document.body.append(button, hud, credit, toast);
	}

	function unmount() {
		stop(false, true);
		button.remove();
		hud.remove();
		credit.remove();
		toast.remove();
		button = hud = hudText = pips = credit = toast = null;
	}

	function sync() {
		if (allowed() && !button) mount();
		else if (!allowed() && button) unmount();
	}

	// Switching tabs mid-game: the game stops and fades out first. While it is
	// running it asks the page (see initPageTransitions) to hold on that long.
	window.addEventListener('site:leaving', () => stop(false, true));

	window.addEventListener('resize', sync);
	finePointer.addEventListener('change', sync);
	sync();

	return {
		snapshot() {
			if (state === 'idle' || !level) return { state };
			const s = sprite;
			const flat = ({ key, x1, x2, y }) => ({ key, x1, x2, y });
			return {
				state,
				elapsed,
				deaths,
				message: message && elapsed < message.until ? message.text : null,
				sprite: s && { x: s.x, y: s.y, w: s.w, h: s.h, vy: s.vy, on: s.on?.key ?? null, spring: s.spring, shield: s.shield, landed: s.landed },
				level: {
					width: level.width, height: level.height, pitch: level.pitch, baseApex: level.baseApex, springApex: level.springApex,
					paraGap: level.paraGap, cardGap: level.cardGap, spawnX: level.spawnX,
					platforms: level.platforms.map(flat),
					paras: level.paras.map(para => para.map(line => line.key)),
					cards: level.cards.map(card => card.key),
					crown: { ...level.crown }
				},
				gels: gels.map(m => ({ type: m.type, host: m.host.key, x: m.host.x1 + m.offset, y: m.host.y, w: m.w, h: m.h, ready: m.away <= 0 })),
				smudges: smudges.map(e => ({ host: e.host.key, x: e.x, y: e.host.y, w: e.w, h: e.h, dir: e.dir, speed: e.speed, flat: e.flat > 0 }))
			};
		}
	};
}
