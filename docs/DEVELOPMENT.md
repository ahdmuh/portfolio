# Development

The site is static files with no dependencies and no build step. Edit a file, reload the page.

## Running locally

Serve the repository root with any static server that supports range requests (Safari needs them to play video):

```sh
npx serve
```

Opening the HTML files straight from disk does not work, because the pages use root-relative paths and ES modules.

## Layout

```text
portfolio/
├── index.html         # Index page
├── about/             # About page
├── work/              # Work page
├── links/             # Links page
├── resume/            # Résumé viewer and the PDF it shows
├── css/
│   ├── site.css       # Everything shared by the pages
│   └── game.css       # The index page game
├── js/
│   ├── theme-init.js  # Sets the theme before first paint
│   ├── site.js        # Theme, navigation, page transitions, work page
│   ├── projects.js    # The project list
│   ├── player.js      # Demo player window
│   ├── hero.js        # WebGL hero illustration
│   ├── sketches.js    # Algorithm sketches
│   ├── dex.js         # Pokédex hover cards
│   └── game.js        # The index page game
├── assets/
│   ├── demos/         # Project videos
│   ├── posters/       # A still frame for each video
│   ├── icons/         # Tool icons
│   ├── logos/         # Employer and school logos
│   └── game/          # Sprite sheet
├── docs/
├── CNAME              # Custom domain for GitHub Pages
└── .nojekyll          # Tells GitHub Pages to serve the files untouched
```

The four pages share the same `<head>`, navigation, and footer markup. A change to any of those has to be made in each page.

## Adding a project

1. Add the video as `assets/demos/demo-<id>.mp4` and a still frame as `assets/posters/demo-<id>-poster.jpg`.
2. Add an entry to `PROJECTS` in `js/projects.js`. The order of the list is the order on the work page.
3. Every name in the entry's `tech` list needs a matching icon in `TECH_ICONS`, with the file in `assets/icons/`.

Encode videos as H.264 with the index at the front, so they start playing before they finish downloading:

```sh
ffmpeg -i input.mov -c:v libx264 -crf 26 -pix_fmt yuv420p -movflags +faststart assets/demos/demo-<id>.mp4
```

GitHub rejects files over 100 MB, and a Pages site is limited to 1 GB.

## Deploying

GitHub Pages serves the root of `main`, so pushing to `main` publishes the site. There is nothing to build.

## Third-party assets

These are not mine, and their terms limit what the repository can be used for:

- The hero illustration is by [fatdaifuku](https://www.instagram.com/fatdaifuku).
- The slime sprite sheet is recoloured from *Minifantasy - Creatures* by [Krishna Palacio](https://www.patreon.com/cw/krishna_palacio). It is the free version, which allows non-commercial use with credit and does not allow redistributing the assets.
- Tool icons are from [Simple Icons](https://simpleicons.org) (CC0).
- Pokémon sprites and type badges are loaded from [Pokémon Database](https://pokemondb.net) and the [PokéAPI sprite collection](https://github.com/PokeAPI/sprites) at runtime and are not stored here.
