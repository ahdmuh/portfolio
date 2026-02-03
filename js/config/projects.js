/**
 * Projects Configuration
 * 
 * Easy-to-modify list of featured projects. Simply add new projects to the array
 * and the system will automatically handle batching (groups of 3 for desktop),
 * mobile carousel, and all existing functionality.
 */

export const FEATURED_PROJECTS = [
    {
        id: 'wizdom-run',
        title: 'WizdomRun',
        description: 'Transforms study notes into an addictive cross-platform game! Led a 6-person team to build this Unity-powered learning app with AI integration using GPT-4o-mini for dynamic question generation.',
        videoSource: '../../assets/demos/demo-wizdomrun.mp4',
        technologies: ['Unity', 'C#', 'Python', 'PostgreSQL', 'LLM'],
        links: [
            {
                type: 'github',
                url: 'https://github.com/mahmedmo/WizdomRun',
                icon: `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>`,
                text: 'View Code'
            }
        ]
    },
    {
        id: 'acme-buddy',
        title: 'AcmeBuddy',
        description: 'Full-stack cinema booking app with smart seat selection and scalable ticket management. Built with React TypeScript frontend and Spring Boot Java backend using clean architecture patterns.',
        videoSource: '../../assets/demos/demo-acmebuddy.mp4',
        technologies: ['React', 'TypeScript', 'Java', 'Spring Boot', 'MySQL'],
        links: [
            {
                type: 'github',
                url: 'https://github.com/mahmedmo/AcmeBuddy',
                icon: `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>`,
                text: 'View Code'
            }
        ]
    },
    {
        id: 'poke-sight',
        title: 'PokéSight',
        description: 'Predicts Pokémon battle outcomes using machine learning! Built with a Gradient Boosting model trained on historical data, delivering battle predictions with probability insights through a Flask web app.',
        videoSource: '../../assets/demos/demo-pokesight.mp4',
        technologies: ['Python', 'Flask', 'Machine Learning', 'scikit-learn'],
        links: [
            {
                type: 'github',
                url: 'https://github.com/mahmedmo/PokeSight',
                icon: `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.30 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>`,
                text: 'View Code'
            },
            {
                type: 'website',
                url: 'https://www.pokesight.cc',
                icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>`,
                text: 'View Site'
            }
        ]
    },
	{
		id: 'briar-bot',
		title: 'BriarBot',
		description: 'A Discord bot serving hundreds of users across multiple servers with Epic Seven character build analysis. Provides real-time build statistics from thousands of players, popular gear recommendations, and automated visual stat cards with seamless Discord integration.',
		videoSource: '../../assets/demos/demo-briarbot.mp4',
		technologies: ['Node.js', 'Docker'],
		links: [
			{
				type: 'github',
				url: 'https://github.com/mahmedmo/BriarBot',
				icon: `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.30 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
				</svg>`,
				text: 'View Code'
			}
		]
	},
    {
        id: 'retro-gaming-console',
        title: 'The BYA Machine',
        description: 'Built a handheld gaming console from scratch! Collaborated with a multidisciplinary team to design physical components and wrote optimized embedded C software for smooth multi-game gameplay.',
        videoSource: '../../assets/demos/demo-bya-machine.mp4',
        technologies: ['C','C++','Arduino', 'Embedded Systems'],
        links: [
            {
                type: 'github',
                url: 'https://github.com/mahmedmo/BYA',
                icon: `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.30 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>`,
                text: 'View Code'
            }
        ]
    },
	{
		id: 'reccify',
		title: 'Reccify',
		description: 'Android app that knows your music taste better than you do! Features custom algorithms for personalized recommendations and integrates Spotify\'s Web API for seamless music discovery.',
		videoSource: '../../assets/demos/demo-reccify.mp4',
		technologies: ['Java', 'Android Studio', 'API', 'Mobile UI/UX'],
		links: [
			{
				type: 'github',
				url: 'https://github.com/mahmedmo/reccify',
				icon: `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.30 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
				</svg>`,
				text: 'View Code'
			}
		]
	},
    {
        id: 'flight-management-system',
        title: 'Flight Management System',
        description: 'Comprehensive flight management program using object-oriented C++ design. Handles flight details, passenger management, and seating with efficient data structures and clean interfaces.',
        videoSource: '../../assets/demos/demo-flightmanagement.mp4',
        technologies: ['C++', 'Object-Oriented Programming', 'Data Structures', 'File Handling'],
        links: [
            {
                type: 'github',
                url: 'https://github.com/mahmedmo/flightmanagement',
                icon: `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.30 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>`,
                text: 'View Code'
            }
        ]
    }
];

/**
 * How to add more projects:
 * 
 * Simply add new project objects to the FEATURED_PROJECTS array above.
 * The system will automatically:
 * - Show the first 3 projects initially
 * - Create additional batches of 3 for the "View More" rotation
 * - Include all projects in the mobile carousel
 * - Maintain all existing functionality
 * 
 * Example new project:
 * {
 *     id: 'my-new-project',
 *     title: 'My New Project',
 *     description: 'What this project does...',
 *     videoSource: 'path/to/video.mp4',
 *     technologies: ['Tech1', 'Tech2'],
 *     links: [{ type: 'github', url: '#', icon: '...', text: 'View Code' }]
 * }
 */