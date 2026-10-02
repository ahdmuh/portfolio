import { PROJECTS, TECH_ICONS } from './projects.js';
import { createPlayer } from './player.js';

const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const canHover = matchMedia('(hover: hover) and (pointer: fine)');

/* ---------- theme ---------- */

function applyTheme(theme) {
	root.dataset.theme = theme;
	const next = theme === 'dark' ? 'light' : 'dark';
	document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
		btn.setAttribute('aria-label', `Switch to ${next} theme`);
	});
	const meta = document.querySelector('meta[name="theme-color"]');
	// Empty if the stylesheet hasn't applied yet; the static value in the markup stands in.
	const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
	if (meta && bg) meta.content = bg;
	window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
}

function toggleTheme() {
	const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
	try { localStorage.setItem('theme', next); } catch {}

	// Colours cross-fade for a moment (see .theme-fading in the CSS), then the
	// class comes off so it doesn't slow down ordinary hover states.
	if (!reduceMotion.matches) {
		root.classList.add('theme-fading');
		clearTimeout(toggleTheme.timer);
		toggleTheme.timer = setTimeout(() => root.classList.remove('theme-fading'), 360);
	}
	applyTheme(next);
}

function initTheme() {
	applyTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');

	document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
		btn.addEventListener('click', toggleTheme);
	});

	// Follow the system until the visitor picks a theme themselves.
	matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
		let stored = null;
		try { stored = localStorage.getItem('theme'); } catch {}
		if (!stored) applyTheme(event.matches ? 'dark' : 'light');
	});
}

/* ---------- page width ---------- */

// Keeps --vw at the width the page really has (see --edge in the CSS). The
// gutter is always reserved, so this only changes when the window does.
function trackPageWidth() {
	const set = () => root.style.setProperty('--vw', `${root.clientWidth}px`);
	set();
	window.addEventListener('resize', set);
}

/* ---------- moving between pages ---------- */

const LEAVE_MS = 140;

// Clicking a link to another page of the site lets the current one slip out
// first; the next page's own entrance (page-in in the CSS) does the rest.
function initPageTransitions() {
	document.addEventListener('click', event => {
		const link = event.target.closest('a[href]');
		if (!link || event.defaultPrevented || reduceMotion.matches) return;
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		if (link.target && link.target !== '_self') return;
		const url = new URL(link.href, location.href);
		const samePage = url.pathname === location.pathname && url.search === location.search;
		if (url.origin !== location.origin || samePage || link.hasAttribute('download')) return;
		// The résumé is a PDF viewer, not one of the site's own pages.
		if (!document.querySelector(`.site-nav a[href="${url.pathname}"]`)) return;

		event.preventDefault();
		// The tab highlight moves the instant it is clicked, and the next page
		// arrives with it already in place (see initSquiggles).
		const nav = document.getElementById('site-nav');
		const tab = nav.querySelector(`a[href="${url.pathname}"]`);
		nav.classList.add('is-switching');
		nav.querySelector('[aria-current]')?.removeAttribute('aria-current');
		tab.setAttribute('aria-current', 'page');
		// ...and at the same scroll position, so the page doesn't jump back to the top
		try {
			sessionStorage.setItem('arrived-by-tab', '1');
			sessionStorage.setItem('tab-scroll', String(Math.round(window.scrollY)));
		} catch {}
		// anything that needs a moment to bow out (the game) says how long, and is told we are going
		const hold = Math.max(LEAVE_MS, Number(root.dataset.leaveHold) || 0);
		window.dispatchEvent(new Event('site:leaving'));
		root.classList.add('is-leaving');
		setTimeout(() => { location.href = url.href; }, hold);
	});

	// Coming back with the back button restores this page as it was left: mid-exit.
	window.addEventListener('pageshow', () => root.classList.remove('is-leaving'));
}

// Arriving from another tab: pick up at the scroll position the last page was left at.
function restoreTabScroll() {
	let top = 0;
	try {
		top = Number(sessionStorage.getItem('tab-scroll')) || 0;
		sessionStorage.removeItem('tab-scroll');
	} catch {}
	if (!top) return;
	const restore = () => { if (window.scrollY < top) window.scrollTo(0, top); };
	restore();
	// parts of a page settle their height a moment later (the work page's cards, webfonts)
	requestAnimationFrame(restore);
	window.addEventListener('load', restore, { once: true });
}

/* ---------- squiggles ---------- */

const SVG_NS = 'http://www.w3.org/2000/svg';

function squigglePath(width) {
	const half = 4.5;
	const waves = Math.max(2, Math.round(width / half));
	const step = width / waves;
	let d = `M0 3.5q${step / 2} -2.6 ${step} 0`;
	for (let i = 1; i < waves; i++) d += `t${step} 0`;
	return d;
}

function drawSquiggles() {
	document.querySelectorAll('.site-nav a, .name').forEach(host => {
		let svg = host.querySelector('.squiggle');
		if (!svg) {
			svg = document.createElementNS(SVG_NS, 'svg');
			svg.setAttribute('class', 'squiggle');
			svg.setAttribute('aria-hidden', 'true');
			svg.setAttribute('height', '7');
			const path = document.createElementNS(SVG_NS, 'path');
			path.setAttribute('pathLength', '1');
			svg.append(path);
			host.append(svg);
		}
		const width = host.offsetWidth;
		svg.setAttribute('width', width);
		svg.firstChild.setAttribute('d', squigglePath(width));
	});
}

function initSquiggles() {
	const nav = document.getElementById('site-nav');
	drawSquiggles();

	// Arriving from another tab, the highlight is simply there: no redraw, no flash.
	let arrived = false;
	try {
		arrived = sessionStorage.getItem('arrived-by-tab') === '1';
		sessionStorage.removeItem('arrived-by-tab');
	} catch {}
	if (arrived) {
		nav?.classList.add('is-ready', 'is-instant');
		document.fonts?.ready.then(() => {
			drawSquiggles();
			requestAnimationFrame(() => nav?.classList.remove('is-instant'));
		});
		return;
	}

	// A first visit draws it in. Link widths shift once the webfont lands, so measure again first.
	const ready = () => {
		drawSquiggles();
		requestAnimationFrame(() => nav?.classList.add('is-ready'));
	};
	Promise.race([
		document.fonts?.ready ?? Promise.resolve(),
		new Promise(resolve => setTimeout(resolve, 400))
	]).then(ready);
	document.fonts?.ready.then(drawSquiggles);
}

/* ---------- shelves ---------- */

const SHELF_NAV = `
	<div class="shelf-nav">
		<button class="shelf-btn" type="button" data-dir="-1" aria-label="Previous">
			<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M11.5 7h-9m3.5-3.5L2.5 7 6 10.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
		</button>
		<button class="shelf-btn" type="button" data-dir="1" aria-label="Next">
			<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7h9M8 3.5 11.5 7 8 10.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
		</button>
	</div>`;

// A [data-shelf] is a horizontal, snap-scrolling row of cards with previous/next buttons.
function initShelves() {
	document.querySelectorAll('[data-shelf]').forEach(shelf => {
		shelf.insertAdjacentHTML('beforeend', SHELF_NAV);

		const track = shelf.querySelector('.shelf-track');
		const [prev, next] = shelf.querySelectorAll('.shelf-btn');

		const stride = () => {
			const card = track.querySelector('.card');
			return card ? card.getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0) : track.clientWidth * .8;
		};

		const update = () => {
			const max = track.scrollWidth - track.clientWidth;
			shelf.toggleAttribute('data-fits', max <= 2);
			prev.disabled = track.scrollLeft <= 2;
			next.disabled = track.scrollLeft >= max - 2;
		};

		[prev, next].forEach(btn => btn.addEventListener('click', () => {
			track.scrollBy({
				left: Number(btn.dataset.dir) * stride(),
				behavior: reduceMotion.matches ? 'auto' : 'smooth'
			});
		}));

		track.addEventListener('scroll', update, { passive: true });
		new ResizeObserver(update).observe(track);
		update();
	});
}

/* ---------- work page: project cards ---------- */

const demoSrc = id => `/assets/demos/demo-${id}.mp4`;
const posterSrc = id => `/assets/posters/demo-${id}-poster.jpg`;

function cardHTML(project) {
	const tech = project.tech.map(name => `
		<span class="tech"><i class="tech-icon" style="--icon: url(/assets/icons/${TECH_ICONS[name]}.svg)"></i>${name}</span>`).join('');
	return `
		<figure class="card">
			<button class="card-face" type="button" data-demo="${project.id}" aria-label="Play the ${project.title} demo, ${project.length}">
				<span class="window">
					<span class="window-bar"><i></i><i></i><i></i><span class="window-title">${project.title}</span></span>
					<video muted loop playsinline preload="none" poster="${posterSrc(project.id)}" tabindex="-1" aria-hidden="true"></video>
					<span class="play-chip">
						<svg width="8" height="9" viewBox="0 0 8 9" aria-hidden="true"><path d="M.5.8v7.4a.5.5 0 0 0 .76.43l6.1-3.7a.5.5 0 0 0 0-.86L1.26.37A.5.5 0 0 0 .5.8Z" fill="currentColor"/></svg>
						${project.length}
					</span>
				</span>
				<span class="card-note">${tech}</span>
			</button>
			<figcaption class="card-cap">
				<a class="card-name" href="${project.code}" target="_blank" rel="noopener">${project.title}</a>
				<span class="card-desc">${project.blurb}</span>
			</figcaption>
		</figure>`;
}

// The frame a card's preview is paused on, as an image, so the player can
// open on the very same picture. Null if the preview never got that far.
function stillOf(video) {
	if (video.readyState < 2 || !video.videoWidth) return null;
	try {
		const canvas = document.createElement('canvas');
		canvas.width = 960;
		canvas.height = Math.round(960 * video.videoHeight / video.videoWidth);
		canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
		return canvas.toDataURL('image/jpeg', .82);
	} catch {
		return null;
	}
}

// Hovering a card plays its demo silently in place; clicking opens the player.
function wireCard(card, player) {
	const face = card.querySelector('.card-face');
	const project = PROJECTS.find(p => p.id === face.dataset.demo);
	const preview = face.querySelector('video');
	let hoverTimer;

	const stopPreview = () => {
		clearTimeout(hoverTimer);
		preview.pause();
		face.classList.remove('is-previewing');
	};

	face.addEventListener('pointerenter', () => {
		if (!canHover.matches || reduceMotion.matches) return;
		hoverTimer = setTimeout(() => {
			if (!preview.getAttribute('src')) preview.src = demoSrc(project.id);
			preview.play().then(() => face.classList.add('is-previewing')).catch(() => {});
		}, 140);
	});
	face.addEventListener('pointerleave', stopPreview);

	face.addEventListener('click', () => {
		stopPreview();
		const still = stillOf(preview);
		const startAt = preview.currentTime;
		// Let go of the file before the player asks for it: Chromium stalls a
		// second video on a URL that a paused one is still holding open.
		if (preview.getAttribute('src')) {
			preview.removeAttribute('src');
			preview.load();
		}
		player.open(project, {
			src: demoSrc(project.id),
			poster: posterSrc(project.id),
			still,
			startAt,
			origin: face.querySelector('.window')
		});
	});
}

// Things other than the project demos that open in the same window.
const EMBEDS = {
	'first-game': {
		title: 'Naruto RPG Naruto vs. Pain',
		about: 'The first game I made, in Scratch. Press the green flag to play.',
		src: 'https://scratch.mit.edu/projects/263657747/embed',
		page: 'https://scratch.mit.edu/projects/263657747',
		linkText: 'scratch',
		width: 485,
		height: 402
	}
};

// A link marked data-demo opens that project's demo right where you are, in the
// same player the work page uses; one marked data-embed opens a playable page
// in it. Without script each is just a link.
function initDemoLinks() {
	const links = document.querySelectorAll('a[data-demo], a[data-embed]');
	if (!links.length) return;
	let player = null;
	links.forEach(link => link.addEventListener('click', event => {
		const project = PROJECTS.find(p => p.id === link.dataset.demo);
		const item = EMBEDS[link.dataset.embed];
		if ((!project && !item) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		event.preventDefault();
		player ??= createPlayer();
		if (item) player.embed(item, { origin: link });
		else player.open(project, { src: demoSrc(project.id), poster: posterSrc(project.id), origin: link });
	}));
}

/* ---------- work page: the snake ---------- */

/**
 * The projects as one chain laid over two rows. The top row reads left to
 * right and moves left as you go forward; the bottom row carries on from where
 * the top row runs off the right edge, reads right to left, and moves the
 * other way. A card going round that turn leaves one row as it arrives on the
 * other, so each project is drawn twice, once per row.
 *
 * It starts with the first project in the top row's home slot and ends with
 * the last one in the bottom row's. Movement is handled here (horizontal
 * wheel, drag, arrow keys, the buttons) rather than by a scroll container:
 * Firefox drops whole tiles of the page when videos sit inside a sticky
 * element in a scroller.
 */
function initSnake() {
	const snake = document.querySelector('[data-snake]');
	if (!snake) return;

	const GAP = 16;
	const ROW_GAP = 30;

	snake.innerHTML = `
		<div class="snake-stage" role="region" aria-label="Projects" tabindex="0">${(PROJECTS.map(cardHTML).join('')).repeat(2)}</div>${SHELF_NAV}`;

	const stage = snake.querySelector('.snake-stage');
	const [prev, next] = snake.querySelectorAll('.shelf-btn');
	const column = document.querySelector('.page');
	const player = createPlayer();
	const count = PROJECTS.length;

	const cards = Array.from(stage.children, (el, i) => ({ el, row: i < count ? 0 : 1, index: i % count }));
	cards.forEach(card => {
		wireCard(card.el, player);
		// Entrance order (see .card > * in the CSS): along the top row, round the turn, back along the bottom.
		card.el.style.setProperty('--i', card.index);
		// The bottom row repeats the top one, so keep it out of the tab order and the accessibility tree.
		if (card.row === 1) {
			card.el.setAttribute('aria-hidden', 'true');
			card.el.querySelectorAll('button, a').forEach(control => { control.tabIndex = -1; });
		}
	});

	let stride = 0;
	let edge = 0;
	let rowHeight = 0;
	let turn = 0;
	let steps = 0;
	// How far along we are, in cards, and where we are heading.
	let position = 0;
	let target = 0;
	let frame = 0;

	const clamp = value => Math.min(steps, Math.max(0, value));

	function layout() {
		// WebKit can run this before the stylesheet applies; measuring then would be wrong.
		if (getComputedStyle(stage).position !== 'relative') {
			requestAnimationFrame(layout);
			return;
		}
		const width = snake.clientWidth;
		stride = cards[0].el.offsetWidth + GAP;
		edge = column.getBoundingClientRect().left;
		rowHeight = Math.max(...cards.map(card => card.el.offsetHeight));
		stage.style.height = `${rowHeight * 2 + ROW_GAP}px`;

		// How many cards sit between the column edge and the right edge of the
		// screen. The bottom row is shifted by it so the card peeking in at the
		// right of both rows is the same one: that is the snake's turn.
		const across = Math.ceil((width - edge) / stride);
		turn = 2 * across - 2;
		// It stops once the last project has come round to the bottom row's home slot.
		steps = Math.max(0, count - 1 - turn);
		snake.toggleAttribute('data-fits', steps === 0);

		position = target = clamp(Math.round(target));
		render();
	}

	function render() {
		const width = snake.clientWidth;
		cards.forEach(({ el, row, index }) => {
			const slot = row === 0 ? index - position : turn - index + position;
			const x = edge + slot * stride;
			const onScreen = x + stride > 0 && x < width;
			el.style.visibility = onScreen ? 'visible' : 'hidden';
			if (onScreen) el.style.transform = `translate3d(${x}px, ${row * (rowHeight + ROW_GAP)}px, 0)`;
		});
		prev.disabled = target <= 0;
		next.disabled = target >= steps;
	}

	// Glide towards the target, a fixed share of the remaining distance each frame.
	function glide() {
		frame = 0;
		const gap = target - position;
		position = Math.abs(gap) < .002 ? target : position + gap * .16;
		render();
		if (position !== target) frame = requestAnimationFrame(glide);
	}

	function goTo(where) {
		target = clamp(where);
		if (reduceMotion.matches) position = target;
		if (!frame) frame = requestAnimationFrame(glide);
	}

	// Follow the hand directly (wheel or drag), then settle on a whole card.
	let settle;
	function nudge(cardsMoved) {
		cancelAnimationFrame(frame);
		frame = 0;
		position = target = clamp(position + cardsMoved);
		render();
		clearTimeout(settle);
		settle = setTimeout(() => goTo(Math.round(position)), 130);
	}

	[prev, next].forEach(btn => btn.addEventListener('click', () => goTo(Math.round(target) + Number(btn.dataset.dir))));

	stage.addEventListener('keydown', event => {
		if (event.target !== stage) return;
		if (event.key === 'ArrowRight') goTo(Math.round(target) + 1);
		else if (event.key === 'ArrowLeft') goTo(Math.round(target) - 1);
		else return;
		event.preventDefault();
	});

	// Sideways trackpad scrolling (or shift + wheel). Vertical scrolling is left to the page.
	stage.addEventListener('wheel', event => {
		if (!steps || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
		event.preventDefault();
		const pixels = event.deltaMode === 1 ? event.deltaX * 16 : event.deltaX;
		nudge(pixels / stride);
	}, { passive: false });

	// Dragging, by finger or mouse. A drag only starts once it is clearly
	// sideways, so taps still open cards and vertical swipes still scroll the page.
	let drag = null;
	let dragged = false;
	stage.addEventListener('pointerdown', event => {
		if (!steps || (event.pointerType === 'mouse' && event.button !== 0)) return;
		drag = { id: event.pointerId, x: event.clientX, y: event.clientY, from: position, active: false, lastX: event.clientX, lastTime: event.timeStamp, speed: 0 };
		dragged = false;
	});
	stage.addEventListener('pointermove', event => {
		if (!drag || event.pointerId !== drag.id) return;
		const dx = event.clientX - drag.x;
		if (!drag.active) {
			if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(event.clientY - drag.y)) return;
			drag.active = dragged = true;
			stage.setPointerCapture(event.pointerId);
			clearTimeout(settle);
			cancelAnimationFrame(frame);
			frame = 0;
		}
		const elapsed = event.timeStamp - drag.lastTime;
		if (elapsed > 0) drag.speed = (event.clientX - drag.lastX) / elapsed;
		drag.lastX = event.clientX;
		drag.lastTime = event.timeStamp;
		position = target = clamp(drag.from - dx / stride);
		render();
	});
	const release = event => {
		if (!drag || event.pointerId !== drag.id) return;
		// Carry a flick on by what it would cover in a fifth of a second.
		if (drag.active) goTo(Math.round(position - (drag.speed * 200) / stride));
		drag = null;
	};
	stage.addEventListener('pointerup', release);
	stage.addEventListener('pointercancel', release);
	// The click that ends a drag shouldn't open the card under it.
	stage.addEventListener('click', event => {
		if (!dragged) return;
		dragged = false;
		event.preventDefault();
		event.stopPropagation();
	}, true);

	new ResizeObserver(layout).observe(snake);
	document.fonts?.ready.then(layout);
	layout();
}

/* ---------- footer clock ---------- */

function initClock() {
	const el = document.getElementById('clock');
	if (!el) return;
	const format = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'America/Edmonton',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});
	const tick = () => { el.textContent = `${format.format(new Date())} MT`; };
	tick();
	setInterval(tick, 15000);
}

trackPageWidth();
initTheme();
initPageTransitions();
initSquiggles();
initShelves();
initDemoLinks();
initSnake();
initClock();
restoreTabScroll();
