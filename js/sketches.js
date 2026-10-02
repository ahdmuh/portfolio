/**
 * The algorithm cards on the index page.
 *
 * Each `<canvas data-sketch="name">` gets one small drawing. Only the ones
 * that gain something from input take it; the rest just run.
 * A sketch is a function that receives a few helpers and returns handlers:
 *   draw(time)      paint a frame; return true to keep animating
 *   click(x, y)     optional
 *   cursor(x, y)    optional: the CSS cursor to show there
 *   down/move/up    optional pointer handlers (CSS pixels, canvas-relative)
 *   grabs(x, y)     optional: true if a touch here starts a drag (so the
 *                   shelf shouldn't scroll instead)
 */

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);

/* ---------- shared mounting ---------- */

function mount(canvas, sketch) {
	const ctx = canvas.getContext('2d');
	const readout = canvas.closest('.card-face').querySelector('[data-readout]');
	const view = { w: 0, h: 0, box: { x: 0, y: 0, size: 0 }, pointer: null, colours: null };
	let frame = 0;
	let visible = false;

	function readColours() {
		const style = getComputedStyle(document.documentElement);
		const get = name => style.getPropertyValue(name).trim();
		view.colours = { ink: get('--ink'), text: get('--text'), mute: get('--mute'), rule: get('--underline'), accent: get('--accent'), card: get('--card') };
	}

	function resize() {
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		view.w = canvas.clientWidth;
		view.h = canvas.clientHeight;
		canvas.width = Math.round(view.w * dpr);
		canvas.height = Math.round(view.h * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		// The square the drawing lives in: clear of the edges and of the note at the bottom.
		const size = Math.max(40, Math.min(view.w - 56, view.h - 28 - 60));
		view.box = { x: (view.w - size) / 2, y: 28 + (view.h - 28 - 60 - size) / 2, size };
	}

	const handlers = sketch({
		ctx,
		view,
		kick: () => kick(),
		say: text => { if (readout && readout.textContent !== text) readout.textContent = text; }
	});

	function loop(now) {
		frame = 0;
		// Nothing is drawn until the card is on screen, so entrances aren't spent unseen.
		if (!view.w || !visible) return;
		if (!view.colours?.ink) readColours();
		// Stylesheet not applied yet (WebKit can run modules first): try again next frame.
		if (!view.colours.ink) { frame = requestAnimationFrame(loop); return; }
		ctx.clearRect(0, 0, view.w, view.h);
		const animating = handlers.draw(now / 1000);
		if (animating && visible && !document.hidden) frame = requestAnimationFrame(loop);
	}

	function kick() { if (!frame) frame = requestAnimationFrame(loop); }

	const at = event => {
		const rect = canvas.getBoundingClientRect();
		return [event.clientX - rect.left, event.clientY - rect.top];
	};

	canvas.addEventListener('pointerdown', event => {
		view.pointer = at(event);
		if (handlers.down?.(...view.pointer)) canvas.setPointerCapture(event.pointerId);
		kick();
	});
	canvas.addEventListener('pointermove', event => {
		view.pointer = at(event);
		handlers.move?.(...view.pointer);
		if (handlers.cursor) canvas.style.cursor = handlers.cursor(...view.pointer);
		kick();
	});
	['pointerup', 'pointercancel'].forEach(type => canvas.addEventListener(type, () => { handlers.up?.(); kick(); }));
	canvas.addEventListener('pointerleave', () => { view.pointer = null; kick(); });
	canvas.addEventListener('click', event => { handlers.click?.(...at(event)); kick(); });
	// A touch that lands on something draggable belongs to the sketch, not to the shelf's scrolling.
	canvas.addEventListener('touchstart', event => {
		const rect = canvas.getBoundingClientRect();
		const touch = event.touches[0];
		if (handlers.grabs?.(touch.clientX - rect.left, touch.clientY - rect.top)) event.preventDefault();
	}, { passive: false });

	new ResizeObserver(() => { resize(); kick(); }).observe(canvas);
	new IntersectionObserver(([entry]) => {
		visible = entry.isIntersecting;
		if (visible) kick();
	}, { threshold: .15 }).observe(canvas);
	document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
	window.addEventListener('themechange', () => { readColours(); kick(); });
}

/* ---------- Hilbert curve ---------- */

// Points of the order-n curve in the unit square. Point j of order n is the
// centre of the 2×2 block that points 4j..4j+3 of order n+1 fill, which is
// what lets one order unfold into the next.
function hilbertPoints(order) {
	const points = [];
	(function step(x, y, xi, xj, yi, yj, n) {
		if (n <= 0) {
			points.push([x + (xi + yi) / 2, y + (xj + yj) / 2]);
			return;
		}
		step(x, y, yi / 2, yj / 2, xi / 2, xj / 2, n - 1);
		step(x + xi / 2, y + xj / 2, xi / 2, xj / 2, yi / 2, yj / 2, n - 1);
		step(x + xi / 2 + yi / 2, y + xj / 2 + yj / 2, xi / 2, xj / 2, yi / 2, yj / 2, n - 1);
		step(x + xi / 2 + yi, y + xj / 2 + yj, -yi / 2, -yj / 2, -xi / 2, -xj / 2, n - 1);
	})(0, 0, 1, 0, 0, 1, order);
	return points;
}

function hilbert({ ctx, view, say }) {
	const MAX = 6;
	const UNFOLD = 1.1;
	let order = 2;
	let points = hilbertPoints(order);
	let parents = null;
	let startedAt = null;
	let seen = false;

	function grow() {
		order = order % MAX + 1;
		points = hilbertPoints(order);
		parents = order > 1 ? hilbertPoints(order - 1) : null;
		startedAt = null;
	}

	return {
		cursor: () => 'pointer',
		click: grow,
		draw(time) {
			// Unfold once on first sight, so the idea reads before anyone clicks.
			if (!seen) { seen = true; grow(); }
			if (startedAt === null) startedAt = time;
			const t = reduceMotion.matches ? 1 : Math.min(1, (time - startedAt) / UNFOLD);
			const k = ease(t);
			const { x, y, size } = view.box;
			const { ink, accent } = view.colours;

			ctx.beginPath();
			if (parents) {
				// Every point starts on its parent and slides out to its own place.
				points.forEach(([px, py], i) => {
					const [qx, qy] = parents[i >> 2];
					ctx.lineTo(x + lerp(qx, px, k) * size, y + lerp(qy, py, k) * size);
				});
			} else {
				// Order 1 has nothing to unfold from: draw it in from the start.
				const upTo = k * (points.length - 1);
				points.forEach(([px, py], i) => {
					if (i <= Math.ceil(upTo)) {
						const f = Math.min(1, Math.max(0, upTo - (i - 1)));
						const [ox, oy] = points[Math.max(0, i - 1)];
						ctx.lineTo(x + lerp(ox, px, f) * size, y + lerp(oy, py, f) * size);
					}
				});
			}
			ctx.strokeStyle = ink;
			ctx.lineWidth = order > 4 ? 1.1 : 1.5;
			ctx.lineJoin = ctx.lineCap = 'round';
			ctx.stroke();

			// Ends of the curve.
			[points[0], points[points.length - 1]].forEach(([px, py], end) => {
				const [qx, qy] = parents ? parents[end ? parents.length - 1 : 0] : [px, py];
				ctx.beginPath();
				ctx.arc(x + lerp(qx, px, k) * size, y + lerp(qy, py, k) * size, 2.5, 0, Math.PI * 2);
				ctx.fillStyle = accent;
				ctx.fill();
			});

			say(`n = ${order} · ${4 ** order} points`);
			return t < 1;
		}
	};
}

/* ---------- de Casteljau ---------- */

function casteljau({ ctx, view, say }) {
	// Control points in the unit square.
	const points = [[.08, .86], [.2, .12], [.82, .1], [.92, .8]];
	let dragging = -1;

	const toScreen = ([px, py]) => [view.box.x + px * view.box.size, view.box.y + py * view.box.size];
	const nearest = (x, y) => points.findIndex(p => {
		const [sx, sy] = toScreen(p);
		return Math.hypot(sx - x, sy - y) < 20;
	});
	// One round of the algorithm: n points in, n − 1 out.
	const reduce = (pts, t) => pts.slice(1).map((p, i) => [lerp(pts[i][0], p[0], t), lerp(pts[i][1], p[1], t)]);
	const pointAt = t => {
		let level = points.map(toScreen);
		while (level.length > 1) level = reduce(level, t);
		return level[0];
	};

	return {
		cursor: (x, y) => (dragging >= 0 ? 'grabbing' : nearest(x, y) >= 0 ? 'grab' : ''),
		grabs: (x, y) => nearest(x, y) >= 0,
		down(x, y) { dragging = nearest(x, y); return dragging >= 0; },
		move(x, y) {
			if (dragging < 0) return;
			const { x: bx, y: by, size } = view.box;
			points[dragging] = [
				Math.min(1.04, Math.max(-.04, (x - bx) / size)),
				Math.min(1.04, Math.max(-.04, (y - by) / size))
			];
		},
		up() { dragging = -1; },
		draw(time) {
			const { ink, mute, rule, accent, card } = view.colours;
			const t = reduceMotion.matches ? .5 : .5 - .5 * Math.cos(time * .9);
			const line = (pts, colour, width) => {
				ctx.beginPath();
				pts.forEach(([px, py]) => ctx.lineTo(px, py));
				ctx.strokeStyle = colour;
				ctx.lineWidth = width;
				ctx.lineJoin = ctx.lineCap = 'round';
				ctx.stroke();
			};
			const curve = (from, to) => {
				const pts = [];
				for (let i = 0; i <= 48; i++) pts.push(pointAt(lerp(from, to, i / 48)));
				return pts;
			};

			// The whole curve faintly, the part traced so far in ink.
			line(curve(0, 1), rule, 1.5);
			line(curve(0, t), ink, 1.75);

			// The scaffolding: each level of the reduction, down to one point.
			let level = points.map(toScreen);
			line(level, rule, 1);
			while (level.length > 1) {
				level = reduce(level, t);
				if (level.length > 1) {
					line(level, mute, 1);
					level.forEach(([px, py]) => {
						ctx.beginPath();
						ctx.arc(px, py, 2, 0, Math.PI * 2);
						ctx.fillStyle = mute;
						ctx.fill();
					});
				}
			}
			ctx.beginPath();
			ctx.arc(level[0][0], level[0][1], 3.5, 0, Math.PI * 2);
			ctx.fillStyle = accent;
			ctx.fill();

			points.map(toScreen).forEach(([px, py], i) => {
				ctx.beginPath();
				ctx.arc(px, py, i === dragging ? 6 : 4.5, 0, Math.PI * 2);
				ctx.fillStyle = card;
				ctx.fill();
				ctx.strokeStyle = ink;
				ctx.lineWidth = 1.5;
				ctx.stroke();
			});

			say(`t = ${t.toFixed(2)}`);
			return !reduceMotion.matches || dragging >= 0;
		}
	};
}

/* ---------- Bresenham's line ---------- */

function bresenham({ ctx, view, say }) {
	const CELLS = 22;

	// Integer-only line rasterisation, all octants.
	function cellsBetween(x0, y0, x1, y1) {
		const cells = [];
		const dx = Math.abs(x1 - x0);
		const dy = -Math.abs(y1 - y0);
		const sx = x0 < x1 ? 1 : -1;
		const sy = y0 < y1 ? 1 : -1;
		let error = dx + dy;
		for (;;) {
			cells.push([x0, y0]);
			if (x0 === x1 && y0 === y1) break;
			const doubled = 2 * error;
			if (doubled >= dy) { error += dy; x0 += sx; }
			if (doubled <= dx) { error += dx; y0 += sy; }
		}
		return cells;
	}

	return {
		draw(time) {
			const { x, y, size } = view.box;
			const { ink, rule, accent } = view.colours;
			const cell = size / CELLS;
			const clamp = v => Math.min(CELLS - 1, Math.max(0, v));
			const start = [3, CELLS - 4];

			// The far end wanders the grid on its own, so every slope gets its turn.
			const t = reduceMotion.matches ? 2.2 : time * .42;
			const end = [
				clamp(Math.round(CELLS / 2 + 1 + Math.cos(t) * 8.5 + Math.cos(t * 2.7) * 1.5)),
				clamp(Math.round(CELLS / 2 - 2 + Math.sin(t * 1.3) * 8))
			];

			ctx.fillStyle = rule;
			for (let i = 0; i <= CELLS; i++) {
				for (let j = 0; j <= CELLS; j++) ctx.fillRect(x + i * cell - .5, y + j * cell - .5, 1, 1);
			}

			const cells = cellsBetween(...start, ...end);
			ctx.fillStyle = ink;
			cells.forEach(([cx, cy]) => {
				ctx.beginPath();
				ctx.roundRect(x + cx * cell + 1, y + cy * cell + 1, cell - 2, cell - 2, 2);
				ctx.fill();
			});

			// The line it is approximating.
			ctx.beginPath();
			ctx.moveTo(x + (start[0] + .5) * cell, y + (start[1] + .5) * cell);
			ctx.lineTo(x + (end[0] + .5) * cell, y + (end[1] + .5) * cell);
			ctx.strokeStyle = accent;
			ctx.lineWidth = 1.25;
			ctx.stroke();

			say(`Δx ${Math.abs(end[0] - start[0])} · Δy ${Math.abs(end[1] - start[1])} · ${cells.length} px`);
			return !reduceMotion.matches;
		}
	};
}

/* ---------- quadtree ---------- */

function quadtree({ ctx, view, say }) {
	const MAX_DEPTH = 7;
	const points = [];
	const add = (px, py, spread = 0) => {
		points.push({
			x: Math.min(.98, Math.max(.02, px + (Math.random() - .5) * spread)),
			y: Math.min(.98, Math.max(.02, py + (Math.random() - .5) * spread)),
			vx: (Math.random() - .5) * .05,
			vy: (Math.random() - .5) * .05
		});
	};
	// Two loose clumps and some strays, so the tree is deep in places and shallow in others.
	for (let i = 0; i < 14; i++) add(.3, .32, .28);
	for (let i = 0; i < 14; i++) add(.72, .7, .22);
	for (let i = 0; i < 10; i++) add(.5, .5, 1);

	let last = 0;

	return {
		draw(time) {
			const { x, y, size } = view.box;
			const { ink, rule } = view.colours;
			const dt = Math.min(.05, time - last || 0);
			last = time;

			if (!reduceMotion.matches) {
				points.forEach(p => {
					p.x += p.vx * dt;
					p.y += p.vy * dt;
					if (p.x < .02 || p.x > .98) p.vx *= -1;
					if (p.y < .02 || p.y > .98) p.vy *= -1;
				});
			}

			let deepest = 0;

			// A cell holding more than one point splits into four, until none does.
			ctx.strokeStyle = rule;
			ctx.lineWidth = 1;
			(function split(cx, cy, s, inside, depth) {
				deepest = Math.max(deepest, depth);
				if (inside.length <= 1 || depth === MAX_DEPTH) return;
				const half = s / 2;
				ctx.beginPath();
				ctx.moveTo(x + (cx + half) * size, y + cy * size);
				ctx.lineTo(x + (cx + half) * size, y + (cy + s) * size);
				ctx.moveTo(x + cx * size, y + (cy + half) * size);
				ctx.lineTo(x + (cx + s) * size, y + (cy + half) * size);
				ctx.stroke();
				for (const [qx, qy] of [[cx, cy], [cx + half, cy], [cx, cy + half], [cx + half, cy + half]]) {
					split(qx, qy, half, inside.filter(p => p.x >= qx && p.x < qx + half && p.y >= qy && p.y < qy + half), depth + 1);
				}
			})(0, 0, 1, points, 0);

			ctx.strokeRect(x, y, size, size);

			ctx.fillStyle = ink;
			points.forEach(p => {
				ctx.beginPath();
				ctx.arc(x + p.x * size, y + p.y * size, 1.75, 0, Math.PI * 2);
				ctx.fill();
			});

			say(`n = ${points.length} · depth ${deepest}`);
			return !reduceMotion.matches;
		}
	};
}

/* ---------- Game of Life ---------- */

function life({ ctx, view, say }) {
	const SIZE = 30;
	const STEP = .12;
	let cells = new Uint8Array(SIZE * SIZE);
	let generation = 0;
	let lastStep = 0;
	let quiet = 0;
	let lastAlive = -1;

	const index = (cx, cy) => ((cy + SIZE) % SIZE) * SIZE + ((cx + SIZE) % SIZE);

	function seed() {
		cells = cells.map(() => (Math.random() < .3 ? 1 : 0));
		generation = 0;
		quiet = 0;
	}

	function step() {
		const next = new Uint8Array(SIZE * SIZE);
		for (let cy = 0; cy < SIZE; cy++) {
			for (let cx = 0; cx < SIZE; cx++) {
				let n = 0;
				for (let dy = -1; dy <= 1; dy++) {
					for (let dx = -1; dx <= 1; dx++) if (dx || dy) n += cells[index(cx + dx, cy + dy)];
				}
				next[index(cx, cy)] = n === 3 || (n === 2 && cells[index(cx, cy)]) ? 1 : 0;
			}
		}
		cells = next;
		generation++;
	}

	seed();

	return {
		draw(time) {
			const { x, y, size } = view.box;
			const { ink } = view.colours;
			const cell = size / SIZE;

			if (!reduceMotion.matches && time - lastStep > STEP) {
				lastStep = time;
				step();
				// Start over once it has died out or settled into a loop.
				const alive = cells.reduce((sum, c) => sum + c, 0);
				quiet = Math.abs(alive - lastAlive) <= 2 ? quiet + 1 : 0;
				lastAlive = alive;
				if (alive === 0 || quiet > 60) seed();
			}

			ctx.fillStyle = ink;
			let alive = 0;
			for (let cy = 0; cy < SIZE; cy++) {
				for (let cx = 0; cx < SIZE; cx++) {
					if (!cells[cy * SIZE + cx]) continue;
					alive++;
					ctx.beginPath();
					ctx.roundRect(x + cx * cell + .75, y + cy * cell + .75, cell - 1.5, cell - 1.5, 1.5);
					ctx.fill();
				}
			}

			say(`gen ${generation} · ${alive} alive`);
			return !reduceMotion.matches;
		}
	};
}

/* ---------- start ---------- */

const SKETCHES = { hilbert, casteljau, bresenham, quadtree, life };

document.querySelectorAll('canvas[data-sketch]').forEach(canvas => {
	const sketch = SKETCHES[canvas.dataset.sketch];
	if (sketch) mount(canvas, sketch);
});
