/**
 * Hero artwork.
 *
 * The illustration is drawn through a small WebGL shader. It stays black and
 * white: its blacks and whites are just pinned to the page's own, so the
 * white dragon melts into a light page and the black one into a dark page.
 * The ink drifts slowly, the edges bleed out through a dithered, grainy
 * falloff, and the pointer disturbs the ink: rings run out from it and the
 * paint around it churns, harder the faster it moves.
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
	vUv = aPos * .5 + .5;
	gl_Position = vec4(aPos, 0., 1.);
}`;

const FRAG = `
precision highp float;

varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uCover;
uniform float uCell;
uniform float uTime;
uniform float uReveal;
uniform vec2 uPointer;
uniform float uHover;
uniform float uStir;
uniform vec3 uLo;
uniform vec3 uHi;

// Where the crop holds on to the image: its centre, between the two heads.
const vec2 ANCHOR = vec2(.5, .5);

float hash(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3. - 2. * f);
	return mix(
		mix(hash(i), hash(i + vec2(1., 0.)), f.x),
		mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x),
		f.y
	);
}

float fbm(vec2 p) {
	float v = 0.;
	float a = .5;
	for (int i = 0; i < 3; i++) {
		v += a * noise(p);
		p = p * 2.03 + 17.1;
		a *= .5;
	}
	return v;
}

// Ordered (Bayer) dither thresholds, 0..1.
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2. + a.y * a.y * .75); }
float bayer4(vec2 a) { return bayer2(.5 * a) * .25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(.5 * a) * .25 + bayer2(a); }

void main() {
	vec2 aspect = vec2(uRes.x / uRes.y, 1.);
	vec2 cell = floor(gl_FragCoord.xy / uCell);
	float threshold = bayer8(cell) + .008;
	vec2 uv = vUv;

	// The ink never quite settles: it drifts like paint still wet on the page.
	vec2 p = uv * aspect * 1.6;
	vec2 flow = vec2(
		fbm(p + vec2(0., uTime * .09)),
		fbm(p + vec2(5.2, -uTime * .075))
	) - .5;
	uv += flow * .03 / aspect;

	// The pointer drags through it like a finger through thick, wet ink: slow,
	// heavy rings roll outwards, the ink around the cursor is churned into the
	// drift, and moving the cursor quickly (uStir) churns it harder.
	vec2 d = (vUv - uPointer) * aspect;
	float dist = length(d);
	vec2 away = normalize(d + 1e-5) / aspect;
	float near = exp(-dist * dist * 6.) * uHover;
	float rings = sin(dist * 21. - uTime * 2.1) * exp(-dist * 3.2) * uHover;
	vec2 churn = vec2(
		fbm(p * 2.2 + vec2(uTime * .2, 3.1)),
		fbm(p * 2.2 + vec2(8.4, -uTime * .17))
	) - .5;
	uv += away * rings * (.02 + .02 * uStir);
	uv += churn * near * (.09 + .13 * uStir) / aspect;
	uv -= d / aspect * near * .1;

	// Fit the image like object-fit: cover, so a taller frame crops the sides.
	uv = (uv - ANCHOR) * uCover + ANCHOR;
	float lum = texture2D(uTex, clamp(uv, 0., 1.)).r;

	vec3 col = mix(uLo, uHi, lum);

	// Edges: the picture bleeds into the page like wet ink. The silhouette
	// wanders, and the falloff is broken up by the dither grid with a little
	// loose grain in it.
	float body = clamp(vUv.x * aspect.x / .24, 0., 1.)
		* clamp((1. - vUv.x) * aspect.x / .24, 0., 1.)
		* clamp((1. - vUv.y) / .3, 0., 1.)
		* clamp(vUv.y / .38, 0., 1.);
	float wander = fbm(vUv * aspect * 3.4 + uTime * .1) - .5;
	float fade = body + body * (1. - body) * wander * 3.2;
	float tooth = mix(threshold, hash(cell), .3);

	// Entrance: the ink soaks outwards from the middle in uneven tongues.
	float soak = fbm(vUv * aspect * 2.2 + 3.7) - .5;
	float appear = smoothstep(0., .45, uReveal * 2.2 - length((vUv - .5) * aspect) * .85 - soak * 1.1 - wander * .4);
	float alpha = smoothstep(0., 1., min(fade, appear) * 1.7 - tooth * .7);

	gl_FragColor = vec4(col * alpha, alpha);
}`;

const container = document.querySelector('[data-art]');
if (container) init(container);

function init(container) {
	const canvas = container.querySelector('canvas');
	const source = container.querySelector('img');
	const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
	const program = gl && link(gl);

	if (!program) {
		container.classList.add('no-gl');
		return;
	}
	gl.useProgram(program);

	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
	const aPos = gl.getAttribLocation(program, 'aPos');
	gl.enableVertexAttribArray(aPos);
	gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

	const uniform = name => gl.getUniformLocation(program, name);
	const u = {
		res: uniform('uRes'), cover: uniform('uCover'), cell: uniform('uCell'),
		time: uniform('uTime'), reveal: uniform('uReveal'),
		pointer: uniform('uPointer'), hover: uniform('uHover'), stir: uniform('uStir'),
		lo: uniform('uLo'), hi: uniform('uHi')
	};

	const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
	const pointer = { x: .5, y: .5, tx: .5, ty: .5, hover: 0, target: 0, stir: 0 };
	let textureReady = false;
	let revealStart = 0;
	let inView = true;
	let frame = 0;

	// Theme colours, cross-faded over the same time the page's own colours take.
	const FADE_MS = 300;
	let colours = null;
	let fadeFrom = null;
	let fadeStart = 0;

	// Null until the stylesheet has applied: WebKit can run this module first.
	function readColours() {
		const style = getComputedStyle(document.documentElement);
		const rgb = name => {
			const hex = style.getPropertyValue(name).trim().slice(1);
			return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
		};
		const read = { lo: rgb('--art-lo'), hi: rgb('--art-hi') };
		return [...read.lo, ...read.hi].every(Number.isFinite) ? read : null;
	}

	const fadeProgress = now => Math.min(1, Math.max(0, (now - fadeStart) / FADE_MS));

	function coloursAt(now) {
		const t = fadeProgress(now);
		const blend = key => colours[key].map((to, i) => fadeFrom[key][i] + (to - fadeFrom[key][i]) * t);
		return { lo: blend('lo'), hi: blend('hi') };
	}

	function setColours(animate) {
		const now = performance.now();
		const next = readColours();
		fadeFrom = animate && colours && next ? coloursAt(now) : next;
		colours = next;
		fadeStart = now;
	}

	function resize() {
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const width = Math.round(canvas.clientWidth * dpr);
		const height = Math.round(canvas.clientHeight * dpr);
		if (canvas.width !== width || canvas.height !== height) {
			canvas.width = width;
			canvas.height = height;
			gl.viewport(0, 0, width, height);
		}
		gl.uniform2f(u.res, width, height);
		// Dither cells are 2 CSS pixels, in whole device pixels so they stay crisp.
		gl.uniform1f(u.cell, Math.max(1, Math.round(dpr * 2)));
		const frameAspect = width / height;
		const imageAspect = source.naturalWidth / source.naturalHeight || frameAspect;
		gl.uniform2f(u.cover, Math.min(frameAspect / imageAspect, 1), Math.min(imageAspect / frameAspect, 1));
	}

	function draw(now) {
		if (!colours) setColours(false);
		if (!colours) return;

		const still = reduceMotion.matches;
		const reveal = still ? 1 : Math.min(1, (now - revealStart) / 2600);

		// Everything follows the cursor slowly and lets go slowly, so it feels viscous.
		pointer.x += (pointer.tx - pointer.x) * .045;
		pointer.y += (pointer.ty - pointer.y) * .045;
		pointer.hover += (pointer.target - pointer.hover) * .03;
		// How fast the cursor is travelling, eased so the churn builds and dies away.
		const speed = Math.hypot(pointer.tx - pointer.x, pointer.ty - pointer.y);
		pointer.stir += (Math.min(1, speed * 5) - pointer.stir) * .04;

		gl.uniform1f(u.time, still ? 0 : now / 1000);
		gl.uniform1f(u.reveal, reveal * reveal * (3 - 2 * reveal));
		gl.uniform2f(u.pointer, pointer.x, pointer.y);
		gl.uniform1f(u.hover, pointer.hover);
		gl.uniform1f(u.stir, pointer.stir);
		const tint = coloursAt(now);
		gl.uniform3fv(u.lo, tint.lo);
		gl.uniform3fv(u.hi, tint.hi);
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		// The first frame is the costly one (the shader is built for it). Once it is
		// out, say so: a fresh load holds the page's entrance for it (theme-init.js).
		if (!window.heroDrawn) {
			window.heroDrawn = true;
			window.dispatchEvent(new Event('hero:drawn'));
		}
	}

	// With reduced motion nothing drifts, but the hover and a theme fade still have to settle.
	const settling = now => !colours || Math.abs(pointer.target - pointer.hover) > .002 || fadeProgress(now) < 1;

	function loop(now) {
		frame = 0;
		if (!textureReady) return;
		draw(now);
		const moving = reduceMotion.matches ? settling(now) : true;
		if (inView && !document.hidden && moving) frame = requestAnimationFrame(loop);
	}

	const kick = () => { if (!frame) frame = requestAnimationFrame(loop); };

	function upload() {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		textureReady = true;
		revealStart = performance.now();
		setColours(false);
		resize();
		kick();
	}

	if (source.complete && source.naturalWidth) upload();
	else {
		source.addEventListener('load', upload, { once: true });
		source.addEventListener('error', () => container.classList.add('no-gl'), { once: true });
	}

	// Pointer position in the shader's space (origin bottom-left).
	const track = event => {
		const rect = canvas.getBoundingClientRect();
		pointer.tx = (event.clientX - rect.left) / rect.width;
		pointer.ty = 1 - (event.clientY - rect.top) / rect.height;
		kick();
	};
	const enter = event => {
		track(event);
		if (pointer.hover < .02) { pointer.x = pointer.tx; pointer.y = pointer.ty; }
		pointer.target = 1;
	};
	container.addEventListener('pointerenter', enter);
	container.addEventListener('pointerdown', enter);
	container.addEventListener('pointermove', track);
	['pointerleave', 'pointercancel'].forEach(type => {
		container.addEventListener(type, () => { pointer.target = 0; kick(); });
	});

	new ResizeObserver(() => { resize(); kick(); }).observe(canvas);
	new IntersectionObserver(([entry]) => {
		inView = entry.isIntersecting;
		if (inView) kick();
	}).observe(canvas);
	document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
	reduceMotion.addEventListener('change', kick);
	window.addEventListener('themechange', () => {
		setColours(!reduceMotion.matches);
		kick();
	});

	canvas.addEventListener('webglcontextlost', event => {
		event.preventDefault();
		container.classList.add('no-gl');
	});
}

function link(gl) {
	const compile = (type, src) => {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, src);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.warn(gl.getShaderInfoLog(shader));
			return null;
		}
		return shader;
	};
	const vert = compile(gl.VERTEX_SHADER, VERT);
	const frag = compile(gl.FRAGMENT_SHADER, FRAG);
	if (!vert || !frag) return null;
	const program = gl.createProgram();
	gl.attachShader(program, vert);
	gl.attachShader(program, frag);
	gl.linkProgram(program);
	return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
}
