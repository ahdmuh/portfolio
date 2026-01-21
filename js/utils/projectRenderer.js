/**
 * Simple Project Renderer - generates the exact same HTML structure as before
 */

import { FEATURED_PROJECTS } from '../config/projects.js';

/**
 * Generate HTML for a single project card - matches original structure exactly
 */
function generateProjectCard(project, index) {
    const techTags = project.technologies.map(tech => 
        `<span class="tech-tag">${tech}</span>`
    ).join('');

    const projectLinks = project.links.map(link => 
        `<a href="${link.url}" ${link.url.startsWith('http') ? 'target="_blank"' : ''} class="project-link">
            ${link.icon}
            ${link.text}
        </a>`
    ).join('');

    // First 3 projects visible, rest hidden (matches original behavior)
    const displayStyle = index < 3 ? '' : 'style="display: none;"';
    
    // Generate poster path from video source
    const posterPath = project.videoSource.replace('/demos/', '/posters/').replace('.mp4', '-poster.jpg');

    return `
        <div class="project-card" data-video="${project.id}-demo.mp4" ${displayStyle}>
            <div class="project-video-container">
                <video class="project-video" muted preload="none" loop playsinline webkit-playsinline poster="${posterPath}">
                    <source src="${project.videoSource}" type="video/mp4">
                </video>
                <div class="video-overlay">
                    <div class="play-icon-circle">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <div class="video-controls">
                    <button class="video-control-btn restart-btn" title="Restart">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                        </svg>
                    </button>
                    <button class="video-control-btn rewind-btn" title="Hold to rewind">
                        <i class="fas fa-backward" style="font-size: 14px;"></i>
                    </button>
                    <button class="video-control-btn forward-btn" title="Hold to fast forward">
                        <i class="fas fa-forward" style="font-size: 14px;"></i>
                    </button>
                    <button class="video-control-btn fullscreen-btn" title="Fullscreen">
                        <i class="fas fa-expand" style="font-size: 14px;"></i>
                    </button>
                </div>
            </div>
            <div class="project-content">
                <h3 class="project-title">${project.title}</h3>
                <p class="project-description">${project.description}</p>
                <div class="project-tech">${techTags}</div>
                <div class="project-links">${projectLinks}</div>
            </div>
        </div>
    `;
}

/**
 * Simple function to populate the projects grid before component initialization
 */
export function populateProjectsOnLoad() {
    const projectsGrid = document.getElementById('projectsGrid');
    if (!projectsGrid) {
        console.warn('Projects grid not found - projects not populated');
        return;
    }

    // Generate HTML for all projects from config
    const projectsHTML = FEATURED_PROJECTS.map((project, index) => 
        generateProjectCard(project, index)
    ).join('');

    // Replace the placeholder with actual projects
    projectsGrid.innerHTML = projectsHTML;
    
    console.log(`Populated ${FEATURED_PROJECTS.length} projects from configuration`);
}