/**
 * Projects, in the order they appear on the site: latest first.
 *
 * To add one, drop its video in assets/demos/ and a poster frame in
 * assets/posters/ (same name, "-poster.jpg"), then add an entry here.
 * `blurb` is the one-liner beside the title; `about` is shown in the player.
 * Every name in `tech` needs a logo in TECH_ICONS (files are in assets/icons/).
 */

export const PROJECTS = [
	{
		id: 'wizdomrun',
		title: 'Wizdom Run',
		blurb: 'study notes, turned into a game',
		about: 'Turns your study notes into a cross-platform game. I led a team of six on it, with an LLM writing the questions as you play.',
		tech: ['Unity', 'C#', 'Python', 'PostgreSQL'],
		length: '8:54',
		code: 'https://github.com/ahdmuh/WizdomRun'
	},
	{
		id: 'briarbot',
		title: 'Briar',
		blurb: 'Epic Seven builds, on Discord',
		about: 'A Discord bot that turns thousands of players’ gear into stat cards for any Epic Seven character. It runs around the clock in Docker on my home server, for 100+ users.',
		tech: ['Node.js', 'Docker'],
		length: '3:20',
		code: 'https://github.com/ahdmuh/Briar'
	},
	{
		id: 'pokesight',
		title: 'PokéSight',
		blurb: 'who wins the battle',
		about: 'Predicts Pokémon battle outcomes with a gradient boosting model trained on 50,000+ past battles, served from a small Flask app.',
		tech: ['Python', 'Flask'],
		length: '2:45',
		code: 'https://github.com/ahdmuh/PokeSight',
		site: 'https://www.pokesight.cc'
	},
	{
		id: 'acmebuddy',
		title: 'AcmeBuddy',
		blurb: 'cinema booking, seats and all',
		about: 'Full-stack cinema booking with seat selection and ticket management. React and TypeScript up front, Spring Boot and MySQL behind.',
		tech: ['React', 'TypeScript', 'Spring Boot', 'MySQL'],
		length: '6:40',
		code: 'https://github.com/ahdmuh/AcmeBuddy'
	},
	{
		id: 'bya-machine',
		title: 'The BYA Machine',
		blurb: 'a handheld console, from scratch',
		about: 'A handheld game console built from nothing with a multidisciplinary team. I wrote the embedded C that keeps several games running smoothly on it.',
		tech: ['C', 'C++', 'Arduino'],
		length: '3:57',
		code: 'https://github.com/ahdmuh/BYA'
	},
	{
		id: 'reccify',
		title: 'Reccify',
		blurb: 'music you haven’t found yet',
		about: 'An Android app that recommends music from your listening, using Spotify’s Web API and a ranking algorithm of my own.',
		tech: ['Java', 'Android'],
		length: '4:24',
		code: 'https://github.com/ahdmuh/reccify'
	},
	{
		id: 'flightmanagement',
		title: 'Flight Management',
		blurb: 'flights, passengers, seat maps',
		about: 'A terminal flight manager in object-oriented C++: flights, passengers, and seat maps, saved to and loaded from files.',
		tech: ['C++'],
		length: '1:50',
		code: 'https://github.com/ahdmuh/flightmanagement'
	}
];

export const TECH_ICONS = {
	'Unity': 'unity',
	'C#': 'csharp',
	'Python': 'python',
	'PostgreSQL': 'postgresql',
	'Node.js': 'nodedotjs',
	'Docker': 'docker',
	'Flask': 'flask',
	'C': 'c',
	'C++': 'cplusplus',
	'Arduino': 'arduino',
	'React': 'react',
	'TypeScript': 'typescript',
	'Spring Boot': 'springboot',
	'MySQL': 'mysql',
	'Java': 'java',
	'Android': 'android'
};
