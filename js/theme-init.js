// Runs before first paint so the page never flashes the wrong theme.
(function () {
	var root = document.documentElement;
	var theme;
	try { theme = localStorage.getItem('theme'); } catch (e) {}
	if (theme !== 'light' && theme !== 'dark') {
		theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}
	root.dataset.theme = theme;

	// The tab icon follows the theme: Reshiram in light, Zekrom in dark.
	var icon = document.getElementById('favicon');
	if (icon) icon.href = '/assets/favicon-' + theme + '.png';

	// Loading a page holds its entrance (see "is-loading" in site.css) until the
	// scripts have run, the fonts are in and the hero has drawn its first frame,
	// so it plays in full at the same unhurried pace as switching tabs (which
	// swaps pages in place, see site.js), instead of being cut short by the work
	// of loading. Never held for long.
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	root.classList.add('is-loading');
	var released = false;
	function release() {
		if (released) return;
		released = true;
		// two frames on, so the entrance starts on a quiet frame
		requestAnimationFrame(function () {
			requestAnimationFrame(function () { root.classList.remove('is-loading'); });
		});
	}
	document.addEventListener('DOMContentLoaded', function () {
		var waiting = 1;
		function done() { if (--waiting === 0) release(); }
		if (document.querySelector('.art canvas') && !window.heroDrawn) {
			waiting++;
			window.addEventListener('hero:drawn', done, { once: true });
		}
		if (document.fonts && document.fonts.ready) document.fonts.ready.then(done, done);
		else done();
	});
	setTimeout(release, 1000);
})();
