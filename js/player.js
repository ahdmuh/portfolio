/**
 * Demo player: an old-school QuickTime window in a <dialog>, in the site's
 * own monochrome.
 *
 * Title bar with traffic lights (red closes, green goes full screen, yellow
 * is switched off), the video, and under it the classic control deck: a recessed scrubber with a timecode, a volume
 * slider, and a row of round transport buttons around a big play button.
 * The window eases in from the direction of the card it was opened from and
 * leaves the same way. Everything is custom; the native controls stay off.
 */

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const ENTER_MS = 360;
const EXIT_MS = 200;

const ICONS = {
	play: '<svg class="qt-icon-play" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.6v10.8a.6.6 0 0 0 .92.5l8.4-5.4a.6.6 0 0 0 0-1L5.42 2.1a.6.6 0 0 0-.92.5Z" fill="currentColor"/></svg>',
	pause: '<svg class="qt-icon-pause" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="2.5" width="3.2" height="11" rx=".8" fill="currentColor"/><rect x="9.3" y="2.5" width="3.2" height="11" rx=".8" fill="currentColor"/></svg>',
	start: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="2" y="3" width="1.8" height="8" rx=".6" fill="currentColor"/><path d="M11.6 3.5v7a.5.5 0 0 1-.78.42L5.4 7.4a.5.5 0 0 1 0-.82l5.42-3.5a.5.5 0 0 1 .78.42Z" fill="currentColor"/></svg>',
	back: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M6.8 3.5v7a.5.5 0 0 1-.78.42L.9 7.4a.5.5 0 0 1 0-.82l5.12-3.5a.5.5 0 0 1 .78.42Zm6.2 0v7a.5.5 0 0 1-.78.42L7.1 7.4a.5.5 0 0 1 0-.82l5.12-3.5a.5.5 0 0 1 .78.42Z" fill="currentColor"/></svg>',
	forward: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7.2 3.5v7a.5.5 0 0 0 .78.42L13.1 7.4a.5.5 0 0 0 0-.82L7.98 3.08a.5.5 0 0 0-.78.42ZM1 3.5v7a.5.5 0 0 0 .78.42L6.9 7.4a.5.5 0 0 0 0-.82L1.78 3.08A.5.5 0 0 0 1 3.5Z" fill="currentColor"/></svg>',
	end: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="10.2" y="3" width="1.8" height="8" rx=".6" fill="currentColor"/><path d="M2.4 3.5v7a.5.5 0 0 0 .78.42L8.6 7.4a.5.5 0 0 0 0-.82L3.18 3.08a.5.5 0 0 0-.78.42Z" fill="currentColor"/></svg>',
	volume: '<svg class="qt-icon-volume" width="16" height="16" viewBox="0 0 18 18" aria-hidden="true"><path d="M8.2 3.2 4.9 6H2.8a.8.8 0 0 0-.8.8v4.4c0 .44.36.8.8.8h2.1l3.3 2.8a.5.5 0 0 0 .8-.38V3.58a.5.5 0 0 0-.8-.38Z" fill="currentColor"/><path d="M11.6 6.4a3.7 3.7 0 0 1 0 5.2m2-7.3a6.6 6.6 0 0 1 0 9.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
	muted: '<svg class="qt-icon-muted" width="16" height="16" viewBox="0 0 18 18" aria-hidden="true"><path d="M8.2 3.2 4.9 6H2.8a.8.8 0 0 0-.8.8v4.4c0 .44.36.8.8.8h2.1l3.3 2.8a.5.5 0 0 0 .8-.38V3.58a.5.5 0 0 0-.8-.38Z" fill="currentColor"/><path d="m12 7 4 4m0-4-4 4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
	github: '<svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" fill="currentColor"/></svg>',
	scratch: '<svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.406 11.312c-.78-.123-1.198-.654-.99-2.295l.023-.198c.175-1.426.321-1.743.996-1.706.198.013.426.14.654.33.211.247.68.568.945 1.204.19.466.254.77.281 1.098l.042.402v-.002a.68.68 0 0 0 1.342-.007c.008-.044.176-4.365.176-4.436 0-.38-.302-.69-.68-.696a.685.685 0 0 0-.682.688c0 .009-.001.605-.014 1.206-.536-.592-1.223-1.123-1.994-1.17-2.058-.11-2.283 1.811-2.419 2.918l-.02.196c-.278 2.189.441 3.569 2.13 3.837 1.838.293 3.063.72 3.074 1.868.007.446-.224.903-.627 1.254a2.163 2.163 0 0 1-1.749.507 3.233 3.233 0 0 1-.539-.141c-.24-.136-.847-.51-1.154-.942-.26-.364-.35-.937-.378-1.3.004-.163.005-.27.005-.283a.69.69 0 0 0-.669-.703.689.689 0 0 0-.696.682c0 .013-.017 1.367-.066 2.183-.07 1.313 0 2.426 0 2.474.028.382.35.67.727.644a.681.681 0 0 0 .635-.733c0-.006-.033-.545-.029-1.29a5.21 5.21 0 0 0 1.938.773 3.451 3.451 0 0 0 2.856-.82c.713-.619 1.122-1.464 1.11-2.32-.024-2.555-2.865-3.004-4.228-3.222M14.174 0a5.51 5.51 0 0 0-2.724.723h-.112c-2.637 0-4.937 1.392-6.15 3.728-.728 1.393-.9 2.75-.999 3.579-.012.089-.018.17-.028.262-.12.974-.123 1.904-.01 2.772a5.824 5.824 0 0 0-.625 2.529v.016a58.919 58.919 0 0 1-.057 1.95 29.72 29.72 0 0 0-.008 2.94l.013.209C3.698 21.676 6.159 24 9.083 24a5.516 5.516 0 0 0 3.463-1.21 8.357 8.357 0 0 0 5.195-2.08c1.826-1.587 2.859-3.845 2.83-6.19-.013-1.362-.346-2.638-.978-3.763.117-1.273.221-4.996.221-5.03 0-3.103-2.484-5.67-5.539-5.727zm.056 2.675c1.642.03 2.978 1.412 2.978 3.081 0 .038-.145 4.497-.215 4.883a3.152 3.152 0 0 1-.203.69c.756.89 1.165 2 1.175 3.256.021 1.555-.681 3.076-1.926 4.16a5.763 5.763 0 0 1-3.8 1.444 5.986 5.986 0 0 1-.718-.048 3.386 3.386 0 0 1-.172.215 2.97 2.97 0 0 1-2.264 1.038c-1.573 0-2.897-1.255-3.013-2.856l-.008-.122a27.366 27.366 0 0 1 .005-2.662c.039-.679.06-1.831.062-2.08a3.124 3.124 0 0 1 .783-2.025c-.237-.835-.312-1.836-.167-3.02l.024-.212c.083-.695.208-1.72.72-2.7.765-1.473 2.168-2.318 3.848-2.318a4.568 4.568 0 0 1 .824.07c.546-.5 1.27-.81 2.067-.794Z" fill="currentColor"/></svg>',
	full: '<svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true"><path d="M10.5 3H15v4.5M7.5 15H3v-4.5M15 3l-4.6 4.6M3 15l4.6-4.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

const TEMPLATE = `
	<div class="qt-window" data-window>
		<div class="qt-bar">
			<span class="qt-lights">
				<button class="qt-light is-close" type="button" data-act="close" aria-label="Close"></button>
				<span class="qt-light is-min" aria-hidden="true"></span>
				<button class="qt-light is-full" type="button" data-act="full" aria-label="Full screen"></button>
			</span>
			<span class="qt-title" data-title></span>
		</div>
		<div class="qt-stage is-paused" data-stage>
			<video playsinline preload="metadata"></video>
			<span class="qt-spinner" aria-hidden="true"></span>
		</div>
		<div class="qt-deck">
			<div class="qt-well">
				<span class="qt-time" data-elapsed>00:00</span>
				<input class="qt-range qt-seek" type="range" min="0" max="1000" step="1" value="0" data-seek aria-label="Seek">
				<span class="qt-time" data-total>00:00</span>
			</div>
			<div class="qt-controls">
				<div class="qt-volume">
					<button class="qt-btn is-flat" type="button" data-act="mute" aria-label="Mute">${ICONS.volume}${ICONS.muted}</button>
					<input class="qt-range" type="range" min="0" max="1" step="0.01" value="1" data-volume aria-label="Volume">
				</div>
				<div class="qt-transport">
					<button class="qt-btn" type="button" data-act="start" aria-label="Back to the start">${ICONS.start}</button>
					<button class="qt-btn" type="button" data-act="back" aria-label="Back 10 seconds">${ICONS.back}</button>
					<button class="qt-btn qt-play" type="button" data-act="play" aria-label="Play">${ICONS.play}${ICONS.pause}</button>
					<button class="qt-btn" type="button" data-act="forward" aria-label="Forward 10 seconds">${ICONS.forward}</button>
					<button class="qt-btn" type="button" data-act="end" aria-label="Skip to the end">${ICONS.end}</button>
				</div>
				<div class="qt-extra">
					<button class="qt-btn is-flat" type="button" data-act="full" aria-label="Full screen">${ICONS.full}</button>
				</div>
			</div>
		</div>
		<div class="qt-info">
			<p data-about></p>
			<p class="qt-links" data-links></p>
		</div>
	</div>`;

// Timecode like the old player's: mm:ss, growing to h:mm:ss for long clips.
const timecode = seconds => {
	const total = Math.max(0, Math.floor(seconds || 0));
	const pad = n => String(n).padStart(2, '0');
	const h = Math.floor(total / 3600);
	const rest = `${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`;
	return h ? `${h}:${rest}` : rest;
};

export function createPlayer() {
	const dialog = document.createElement('dialog');
	dialog.className = 'qt';
	dialog.tabIndex = -1;
	dialog.innerHTML = TEMPLATE;
	document.body.append(dialog);

	const $ = selector => dialog.querySelector(selector);
	const video = $('video');
	const frame = $('[data-window]');
	const stage = $('[data-stage]');
	const seek = $('[data-seek]');
	const volume = $('[data-volume]');
	const elapsed = $('[data-elapsed]');
	const total = $('[data-total]');
	const playBtn = $('[data-act="play"]');
	const muteBtn = $('[data-act="mute"]');

	let scrubbing = false;
	let origin = null;
	let closing = false;
	let embedded = null; // an <iframe> standing in for the video (see embed())

	const fill = (range, fraction) => range.style.setProperty('--fill', `${fraction * 100}%`);

	/* ----- state → UI ----- */

	function renderTime() {
		const duration = video.duration || 0;
		const current = scrubbing ? (seek.value / 1000) * duration : video.currentTime;
		const fraction = duration ? current / duration : 0;
		if (!scrubbing) seek.value = Math.round(fraction * 1000);
		fill(seek, fraction);
		elapsed.textContent = timecode(current);
		total.textContent = timecode(duration);

		// Shade how far the video has loaded past the playhead.
		let loaded = fraction;
		for (let i = 0; i < video.buffered.length; i++) {
			if (video.buffered.start(i) <= current + .5 && video.buffered.end(i) > current) {
				loaded = Math.max(loaded, video.buffered.end(i) / duration);
			}
		}
		seek.style.setProperty('--buffer', `${Math.min(1, loaded) * 100}%`);
	}

	function renderPlaying() {
		frame.classList.toggle('is-paused', video.paused);
		playBtn.setAttribute('aria-label', video.paused ? 'Play' : 'Pause');
	}

	function renderVolume() {
		const silent = video.muted || video.volume === 0;
		frame.classList.toggle('is-muted', silent);
		muteBtn.setAttribute('aria-label', silent ? 'Unmute' : 'Mute');
		volume.value = silent ? 0 : video.volume;
		fill(volume, Number(volume.value));
	}

	/* ----- entrance and exit ----- */

	// The window settles into place from a short step towards the card it was
	// opened from, and leaves the same way. Small moves on a still picture: the
	// video isn't loaded until the window has landed, which keeps this smooth.
	function away(reach) {
		const here = dialog.getBoundingClientRect();
		const there = origin?.isConnected ? origin.getBoundingClientRect() : null;
		const lean = (from, to) => Math.max(-28, Math.min(28, (to - from) * reach));
		const dx = there ? lean(here.left + here.width / 2, there.left + there.width / 2) : 0;
		const dy = there ? lean(here.top + here.height / 2, there.top + there.height / 2) : 14;
		return { transform: `translate(${dx}px, ${dy}px) scale(.955)`, opacity: 0 };
	}

	function close() {
		if (closing || !dialog.open) return;
		if (reduceMotion.matches) { dialog.close(); return; }
		closing = true;
		video.pause();
		dialog.classList.add('is-closing');
		const exit = dialog.animate(
			[{ transform: 'none', opacity: 1 }, away(.05)],
			{ duration: EXIT_MS, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' }
		);
		// A timer, not the animation's finished promise: that promise never settled in Chromium here.
		setTimeout(() => {
			dialog.close();
			exit.cancel();
		}, EXIT_MS);
	}

	/* ----- actions ----- */

	const toggle = () => { if (video.paused) video.play().catch(() => {}); else video.pause(); };
	const jumpTo = seconds => {
		video.currentTime = Math.min(video.duration || 0, Math.max(0, seconds));
		renderTime();
	};
	const mute = () => {
		video.muted = !(video.muted || video.volume === 0);
		if (!video.muted && video.volume === 0) video.volume = .6;
	};

	const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
	function fullscreen() {
		if (fullscreenElement()) {
			(document.exitFullscreen || document.webkitExitFullscreen).call(document);
		} else if (frame.requestFullscreen) {
			frame.requestFullscreen().catch(() => {});
		} else if (frame.webkitRequestFullscreen) {
			frame.webkitRequestFullscreen();
		} else if (video.webkitEnterFullscreen) {
			// iPhone only lets the video element itself go full screen.
			video.webkitEnterFullscreen();
		}
	}

	const actions = {
		close,
		play: toggle,
		start: () => jumpTo(0),
		back: () => jumpTo(video.currentTime - 10),
		forward: () => jumpTo(video.currentTime + 10),
		end: () => jumpTo(video.duration || 0),
		mute,
		full: fullscreen
	};

	dialog.addEventListener('click', event => {
		// A click on the backdrop lands on the dialog element itself.
		if (event.target === dialog) { close(); return; }
		const act = event.target.closest('[data-act]')?.dataset.act;
		if (act) actions[act]();
	});

	video.addEventListener('click', toggle);
	video.addEventListener('dblclick', fullscreen);

	/* ----- sliders ----- */

	seek.addEventListener('input', () => {
		scrubbing = true;
		if (video.duration) video.currentTime = (seek.value / 1000) * video.duration;
		renderTime();
	});
	seek.addEventListener('change', () => { scrubbing = false; });

	volume.addEventListener('input', () => {
		video.volume = Number(volume.value);
		video.muted = video.volume === 0;
	});

	/* ----- keyboard ----- */

	dialog.addEventListener('keydown', event => {
		// with something embedded there is no video to drive, and its own keys must get through
		if (embedded || event.metaKey || event.ctrlKey || event.altKey) return;
		const onControl = event.target.matches('button, input');
		const key = event.key.toLowerCase();
		if ((key === ' ' || key === 'k') && !onControl) toggle();
		else if (key === 'arrowleft' && event.target !== volume) jumpTo(video.currentTime - 5);
		else if (key === 'arrowright' && event.target !== volume) jumpTo(video.currentTime + 5);
		else if (key === 'm') mute();
		else if (key === 'f') fullscreen();
		else return;
		event.preventDefault();
	});

	/* ----- video events ----- */

	['timeupdate', 'durationchange', 'progress', 'seeked'].forEach(type => video.addEventListener(type, renderTime));
	['play', 'pause', 'ended'].forEach(type => video.addEventListener(type, renderPlaying));
	video.addEventListener('volumechange', renderVolume);
	video.addEventListener('waiting', () => stage.classList.add('is-waiting'));
	['playing', 'canplay', 'seeked'].forEach(type => video.addEventListener(type, () => stage.classList.remove('is-waiting')));
	// Reveal the video once a real frame is on screen.
	video.addEventListener('playing', () => requestAnimationFrame(() => stage.classList.add('has-frame')));

	// Escape goes through the same exit as the close light.
	dialog.addEventListener('cancel', event => {
		event.preventDefault();
		close();
	});

	dialog.addEventListener('close', () => {
		closing = false;
		dialog.classList.remove('is-closing');
		video.pause();
		video.muted = true;
		renderVolume();
		video.removeAttribute('src');
		video.load();
		stage.classList.remove('is-waiting', 'has-frame');
		// an embedded page is thrown away, which also stops whatever it was playing
		embedded?.remove();
		embedded = null;
		dialog.classList.remove('is-embed');
		stage.style.aspectRatio = '';
	});

	renderVolume();
	renderPlaying();

	return {
		open(project, { src, poster, still = null, startAt = 0, origin: from = null }) {
			origin = from;
			$('[data-title]').textContent = project.title;
			$('[data-about]').textContent = project.about;
			$('[data-links]').innerHTML = [
				`<a class="icon-link is-lined" href="${project.code}" target="_blank" rel="noopener">${ICONS.github}code</a>`,
				project.site ? `<a href="${project.site}" target="_blank" rel="noopener">site</a>` : ''
			].filter(Boolean).join(' · ');
			dialog.setAttribute('aria-label', `${project.title} demo`);

			scrubbing = false;
			// The stage shows a still (the frame the card was on, or the poster) and
			// the video fades in over it once it is actually playing, so there is no
			// jump from poster to first frame to the seeked position.
			stage.classList.remove('has-frame', 'is-waiting');
			stage.style.backgroundImage = `url("${still || poster}")`;
			// Every demo opens silent; sound is only ever on because someone turned it on in this window.
			video.muted = true;
			renderVolume();
			renderTime();
			dialog.showModal();
			// Focus the window itself, so the keyboard shortcuts work without a ring on any one button.
			dialog.focus({ preventScroll: true });

			// Muted playback needs no click behind it, so it can wait for the window to land.
			const start = () => {
				if (!dialog.open || closing || video.getAttribute('src')) return;
				// "#t=" starts the stream at that time, rather than loading frame 0 and seeking.
				video.src = startAt > 0 ? `${src}#t=${startAt.toFixed(2)}` : src;
				video.play().catch(() => {});
				// If starting part-way in hasn't produced a picture after a while, start from the top instead.
				if (startAt > 0) {
					setTimeout(() => {
						if (!dialog.open || closing || stage.classList.contains('has-frame') || video.getAttribute('src') === src) return;
						video.src = src;
						video.play().catch(() => {});
					}, 2500);
				}
			};
			if (reduceMotion.matches) { start(); return; }
			dialog.animate(
				[away(.08), { transform: 'none', opacity: 1 }],
				{ duration: ENTER_MS, easing: 'cubic-bezier(.22, 1, .36, 1)' }
			);
			setTimeout(start, ENTER_MS);
		},

		// The same window around an embedded page (a playable game, say) instead
		// of a video: no control deck, just the title bar, the page and the caption.
		// `item` is { title, about, src, page, linkText, icon, width, height }.
		embed(item, { origin: from = null } = {}) {
			origin = from;
			$('[data-title]').textContent = item.title;
			$('[data-about]').textContent = item.about;
			$('[data-links]').innerHTML = `<a class="icon-link is-lined" href="${item.page}" target="_blank" rel="noopener">${ICONS[item.icon] ?? ''}${item.linkText}</a>`;
			dialog.setAttribute('aria-label', item.title);
			dialog.classList.add('is-embed');
			stage.classList.remove('has-frame', 'is-waiting');
			stage.style.backgroundImage = '';
			stage.style.aspectRatio = `${item.width} / ${item.height}`;
			dialog.showModal();
			dialog.focus({ preventScroll: true });

			// like the video, the page is only loaded once the window has landed
			const start = () => {
				if (!dialog.open || closing || embedded) return;
				embedded = document.createElement('iframe');
				embedded.src = item.src;
				embedded.title = item.title;
				embedded.allowFullscreen = true;
				embedded.setAttribute('scrolling', 'no');
				stage.append(embedded);
			};
			if (reduceMotion.matches) { start(); return; }
			dialog.animate(
				[away(.08), { transform: 'none', opacity: 1 }],
				{ duration: ENTER_MS, easing: 'cubic-bezier(.22, 1, .36, 1)' }
			);
			setTimeout(start, ENTER_MS);
		}
	};
}
