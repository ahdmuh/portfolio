/**
 * Pokédex cards for the two dragons named on the index page: hover, focus or
 * tap a name and its entry appears beside it: the sprite on the left with its
 * weight and height under it and a link to its Pokémon Database page, the
 * entry on the right. One card is shared and moved to whichever name is active.
 */

const ENTRIES = {
	reshiram: {
		no: '643',
		name: 'Reshiram',
		kind: 'Vast White Pokémon',
		types: ['Dragon', 'Fire'],
		height: '3.2 m',
		weight: '330.0 kg',
		bio: 'A legendary dragon said to side with those who pursue truth. The flare from its tail can scorch everything around it, stirring the air enough to change the weather.'
	},
	zekrom: {
		no: '644',
		name: 'Zekrom',
		kind: 'Deep Black Pokémon',
		types: ['Dragon', 'Electric'],
		height: '2.9 m',
		weight: '345.0 kg',
		bio: 'A legendary dragon said to aid those who hold to their ideals. Its tail generates electricity, and it crosses Unova hidden inside thunderclouds.'
	}
};

// animated sprites from the Black & White games, as hosted by Pokémon Database
const sprite = id => `https://img.pokemondb.net/sprites/black-white/anim/normal/${id}.gif`;

// and the type badges from those games, from the PokéAPI sprite collection
const TYPE_IDS = { Fire: 10, Electric: 13, Dragon: 16 };
const badge = type => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-v/black-white/${TYPE_IDS[type]}.png`;

const MARGIN = 12;
const HIDE_MS = 40; // from the pointer leaving the name or the card to the fade-out starting
const SWAP_MS = 150; // one card fades most of the way out, then the next fades gently in
const names = document.querySelectorAll('[data-dex]');
if (names.length) init();

function init() {
	const card = document.createElement('div');
	card.className = 'dex-card';
	card.id = 'dex-card';
	card.setAttribute('role', 'tooltip');
	card.innerHTML = `
		<div class="dex-side">
			<div class="dex-sprite"><img alt="" decoding="async"></div>
			<p class="dex-stats"><span data-weight></span><span data-height></span></p>
			<a class="dex-source icon-link is-lined" target="_blank" rel="noopener" data-source>
				<img src="https://pokemondb.net/favicon.ico" alt="" width="12" height="12">Pokémon DB
			</a>
		</div>
		<div class="dex-entry">
			<p class="dex-no" data-no></p>
			<p class="dex-name" data-name></p>
			<p class="dex-kind"><span data-kind></span><span class="dex-types" data-types></span></p>
			<p class="dex-bio" data-bio></p>
		</div>`;
	document.body.append(card);

	const field = key => card.querySelector(`[data-${key}]`);
	const image = card.querySelector('img');
	image.addEventListener('error', () => card.classList.add('no-sprite'));
	let current = null;
	let hideTimer = 0;

	function place(target) {
		const word = target.getBoundingClientRect();
		const width = card.offsetWidth;
		const height = card.offsetHeight;
		const left = Math.min(Math.max(word.left + word.width / 2 - width / 2, MARGIN), document.documentElement.clientWidth - width - MARGIN);
		// below the word, or above it when there is no room underneath
		const below = word.bottom + 10;
		const above = word.top - 10 - height;
		const fitsBelow = below + height <= window.innerHeight - MARGIN || above < MARGIN;
		card.classList.toggle('is-above', !fitsBelow);
		card.style.left = `${Math.round(left + window.scrollX)}px`;
		card.style.top = `${Math.round((fitsBelow ? below : above) + window.scrollY)}px`;
		// the little pointer stays under the word even when the card is nudged sideways
		card.style.setProperty('--pointer', `${Math.round(word.left + word.width / 2 - left)}px`);
	}

	// Fill the card with one dragon's entry.
	function fill(target) {
		const id = target.dataset.dex;
		const entry = ENTRIES[id];
		field('no').textContent = `No. ${entry.no}`;
		field('name').textContent = entry.name;
		field('kind').textContent = entry.kind;
		// each type as its in-game badge; if one fails to load, its name stands in
		field('types').replaceChildren(...entry.types.map(type => {
			const img = document.createElement('img');
			img.src = badge(type);
			img.alt = type;
			img.width = 32;
			img.height = 12;
			img.addEventListener('error', () => img.replaceWith(type), { once: true });
			return img;
		}));
		field('bio').textContent = entry.bio;
		field('height').textContent = `HT ${entry.height}`;
		field('weight').textContent = `WT ${entry.weight}`;
		card.dataset.dex = id;
		field('source').href = `https://pokemondb.net/pokedex/${id}`;
		card.classList.remove('no-sprite');
		image.src = sprite(id);
		current = target;
	}

	function open(target) {
		if (current !== target) fill(target);
		place(target);
		card.classList.add('is-open');
	}

	// The first time either name is touched, fetch both sprites and all the
	// badges, so going from one card to the other never waits on the network.
	let warmed = false;
	function warm() {
		if (warmed) return;
		warmed = true;
		for (const id of Object.keys(ENTRIES)) new Image().src = sprite(id);
		for (const type of Object.keys(TYPE_IDS)) new Image().src = badge(type);
	}

	let swapTimer = 0;
	function show(target) {
		warm();
		clearTimeout(hideTimer);
		clearTimeout(swapTimer);
		if (!ENTRIES[target.dataset.dex]) return;
		// Going straight from one name to the other: the open card closes first,
		// then the next one opens at its own name, rather than snapping across.
		// (The same goes if the old card is already on its way out but still visible.)
		const showing = card.classList.contains('is-open') || parseFloat(getComputedStyle(card).opacity) > .05;
		if (showing && current && current !== target) {
			card.classList.remove('is-open');
			swapTimer = setTimeout(() => open(target), SWAP_MS);
		} else {
			open(target);
		}
	}

	function hide() {
		clearTimeout(hideTimer);
		clearTimeout(swapTimer);
		// Only the briefest grace: the card reaches up to the name it belongs to,
		// so the pointer can cross onto it without ever leaving both.
		hideTimer = setTimeout(() => card.classList.remove('is-open'), HIDE_MS);
	}

	names.forEach(name => {
		name.tabIndex = 0;
		name.setAttribute('aria-describedby', card.id);
		name.addEventListener('pointerenter', () => show(name));
		name.addEventListener('pointerleave', hide);
		name.addEventListener('focus', () => show(name));
		name.addEventListener('blur', hide);
	});

	// the card stays up while the pointer (or focus) is on it, so its link can be used
	card.addEventListener('pointerenter', () => clearTimeout(hideTimer));
	card.addEventListener('pointerleave', hide);
	card.addEventListener('focusin', () => clearTimeout(hideTimer));
	card.addEventListener('focusout', hide);

	document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
	window.addEventListener('scroll', () => { if (card.classList.contains('is-open') && current) place(current); }, { passive: true });
	window.addEventListener('resize', hide);
	window.addEventListener('site:leaving', () => card.classList.remove('is-open'));
}
