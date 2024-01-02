/* global videojs */
'use strict';

videojs.registerPlugin('hoverPreview', hoverPreviewPlugin);
videojs.registerPlugin('branding', brandingPlugin);
videojs.registerPlugin('stickyPlayer', stickyPlayer);

const videoIgniter = videoElement => {
  const videos = videoElement
    ? [videoElement]
    : document.querySelectorAll('.vi-player');

  videos.forEach(video => {
    // Bail out if the player has already been initialized.
    if (video.player) {
      return;
    }

    const main = video.closest('.vi-player-wrap');
    const sticky = main.dataset.sticky === 'true';
    const fullscreenToggleEnabled =
      main.dataset.showFullscreenToggle === 'true';
    const hoverPreviewEnabled = main.dataset.hoverPreviewEnabled === 'true';
    const playbackSpeedEnabled = main.dataset.showPlaybackSpeed === 'true';
    const initialVolume = (parseInt(main.dataset.volume, 10) ?? 100) / 100;
    const skipSeconds = parseInt(main.dataset.skipSeconds, 10) ?? 0;
    const playlist = JSON.parse(main.dataset.playlist);
    const brandingImage = main.dataset.brandingImage;
    const brandingImagePosition = main.dataset.brandingImagePosition;

    const title = video.dataset.title;
    const description = video.dataset.description;
    const overlays = JSON.parse(video.dataset.overlays);

    const player = videojs(video, {
      playbackRates: playbackSpeedEnabled ? [0.5, 1, 1.5, 2] : undefined,
      responsive: true,
      experimentalSvgIcons: true,
      controlBar: {
        fullscreenToggle: fullscreenToggleEnabled,
        pictureInPictureToggle: false,
        skipButtons: {
          forward: skipSeconds,
          backward: skipSeconds,
        },
      },
      titleBar: true,
      breakpoints: {
        tiny: 300,
        xsmall: 400,
        small: 500,
        medium: 600,
        large: 700,
        xlarge: 800,
        huge: 900,
      },
    });

    player.playsinline('true');

    replaceIcons(player);

    if (title || description) {
      player.titleBar.update({
        title: title || '',
        description: description || '',
      });
    }

    // Initialize plugins
    if (player.chaptersTimeline && player.chaptersTimeline) {
      player.chaptersTimeline();
    }

    if (hoverPreviewEnabled && player.hoverPreview) {
      player.hoverPreview();
    }

    if (sticky && player.stickyPlayer) {
      player.stickyPlayer();
    }

    if (overlays?.length > 0 && player.overlays) {
      player.overlays(overlays);
    }

    if (brandingImage) {
      player.branding({
        imageUrl: brandingImage,
        position: brandingImagePosition,
      });
    }

    if (playlist?.length > 1) {
      player.playlist(playlist);
      player.playlistUi();

      player.on('playlistitem', () => {
        const currentItem = playlist[player.playlist.currentItem()];

        if (overlays?.length > 0) {
          player.overlays(currentItem.overlays ?? []);
        }

        if (currentItem.name || currentItem.description) {
          player.titleBar.update({
            title: currentItem.name || '',
            description: currentItem.description ?? '',
          });
        }
      });
    }

    setTimeout(() => {
      player.volume(initialVolume);
    }, 100);
  });
};

addEventListener('DOMContentLoaded', () => {
  videoIgniter();
});

window.__CI_VIDEOIGNITER_MANUAL_INIT__ = videoIgniter;

/**
 * Branding
 */
function brandingPlugin(options) {
  this.brandingImageUrl = options.imageUrl;
  this.position = options.position ?? 'top-right';
  this.opacity = options.opacity ?? '1';
  this.width = options.width ?? 200;

  this.renderBranding = () => {
    const container = document.createElement('div');
    container.classList.add('vjs-branding', `vjs-branding-${this.position}`);
    container.style.maxWidth = `${this.width}px`;
    const img = document.createElement('img');
    img.src = this.brandingImageUrl;
    img.style.opacity = this.opacity;
    img.classList.add('vjs-branding-image');

    container.appendChild(img);
    this.el().appendChild(container);
  };

  this.renderBranding();
}

/**
 * Hover preview
 */
function hoverPreviewPlugin() {
  if (videojs.browser.TOUCH_ENABLED) {
    return;
  }

  const player = this;
  let isMuted = false;
  let isExplicitlyStarted = false; // To track if playback was started by a click

  const handleMouseEnter = () => {
    if (!isExplicitlyStarted) {
      player.muted(true);
      player.play();
      player.addClass('vjs-hover-preview-running');
      isMuted = true;
    }
  };

  const handleMouseLeave = () => {
    if (isMuted && !isExplicitlyStarted) {
      player.pause();
      player.muted(false);
      player.removeClass('vjs-hover-preview-running');
      isMuted = false;
    }
  };

  const handleClick = () => {
    if (isMuted) {
      player.muted(false);
      player.removeClass('vjs-hover-preview-running');
      isMuted = false;
      player.play();
    }

    isExplicitlyStarted = true;
  };

  player.on('mouseenter', handleMouseEnter);
  player.on('mouseleave', handleMouseLeave);
  player.on('click', handleClick);

  player.on('dispose', () => {
    player.off('mouseenter', handleMouseEnter);
    player.off('mouseleave', handleMouseLeave);
    player.off('click', handleClick);
  });
}

/**
 * Sticky player plugin
 */
function stickyPlayer() {
  const player = this;
  const parent = document.createElement('div');
  parent.classList.add('vjs-sticky-parent');
  player.el().parentNode.insertBefore(parent, player.el());
  parent.append(player.el());

  const sentinel = document.createElement('div');
  parent.parentNode.insertBefore(sentinel, parent);
  sentinel.append(parent);

  // Only stick the player if the user has already seen it (ie scrolled to it)
  let playerSeen = false;

  const observer = new IntersectionObserver(
    debounce(entries => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        // Player is in view
        playerSeen = true;
        sentinel.classList.remove('vjs-stuck');
        sentinel.style.height = 'auto';
      } else {
        // Player is out of view
        if (playerSeen) {
          sentinel.style.height = `${player.el().clientHeight}px`;
          sentinel.classList.add('vjs-stuck');
        }
      }
    }, 50),
    { threshold: 0 },
  );

  observer.observe(sentinel);

  player.on('dispose', () => {
    observer.disconnect();
  });
}

function replaceIcons(player) {
  const icons = `
  <svg xmlns="http://www.w3.org/2000/svg">
    <defs>
      <symbol viewBox="0 0 24 24" id="vjs-icon-play">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z" />
      </symbol>
      <symbol viewBox="0 0 24 24" id="vjs-icon-pause">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M9 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" stroke-width="0" />
        <path d="M17 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" stroke-width="0" />
      </symbol>
      <symbol viewBox="0 0 48 48" id="vjs-icon-audio">
        <path d="M24 2C14.06 2 6 10.06 6 20v14c0 3.31 2.69 6 6 6h6V24h-8v-4c0-7.73 6.27-14 14-14s14 6.27 14 14v4h-8v16h6c3.31 0 6-2.69 6-6V20c0-9.94-8.06-18-18-18z"></path>
      </symbol>
      <symbol viewBox="0 0 24 24" id="vjs-icon-captions" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z"/>
        <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <path d="M10 10.5a1.5 1.5 0 0 0-3 0v3a1.5 1.5 0 0 0 3 0M17 10.5a1.5 1.5 0 0 0-3 0v3a1.5 1.5 0 0 0 3 0"/>
      </symbol>
      <symbol viewBox="0 0 48 48" id="vjs-icon-subtitles">
        <path d="M40 8H8c-2.21 0-4 1.79-4 4v24c0 2.21 1.79 4 4 4h32c2.21 0 4-1.79 4-4V12c0-2.21-1.79-4-4-4zM8 24h8v4H8v-4zm20 12H8v-4h20v4zm12 0h-8v-4h8v4zm0-8H20v-4h20v4z"></path>
      </symbol>
      <symbol viewBox="0 0 24 24" id="vjs-icon-fullscreen-enter" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z"/>
        <path d="M4 8V6a2 2 0 0 1 2-2h2M4 16v2a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v2M16 20h2a2 2 0 0 0 2-2v-2"/>
      </symbol>
      <symbol viewBox="0 0 24 24" id="vjs-icon-fullscreen-exit" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z"/>
        <path d="M5 9h4V5M3 3l6 6M5 15h4v4M3 21l6-6M19 9h-4V5M15 9l6-6M19 15h-4v4M15 15l6 6"/>
      </symbol>
      <symbol viewBox="0 0 48 48" id="vjs-icon-play-circle">
        <path d="M20 33l12-9-12-9v18zm4-29C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm0 36c-8.82 0-16-7.18-16-16S15.18 8 24 8s16 7.18 16 16-7.18 16-16 16z"></path>
      </symbol>
      <symbol viewBox="0 0 24 24" id="vjs-icon-volume-mute" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
        <path stroke="none" d="M0 0h24v24H0z"/>
        <path d="M15 8a5 5 0 0 1 1.912 4.934m-1.377 2.602A5 5 0 0 1 15 16M17.7 5a9 9 0 0 1 2.362 11.086m-1.676 2.299A9 9 0 0 1 17.7 19M9.069 5.054 9.5 4.5A.8.8 0 0 1 11 5v2m0 4v8a.8.8 0 0 1-1.5.5L6 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2l1.294-1.664M3 3l18 18"/>
      </symbol>
      <symbol viewBox="0 0 24 24" id="vjs-icon-volume-low" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
        <path stroke="none" d="M0 0h24v24H0z"/>
        <path d="M6 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2l3.5-4.5A.8.8 0 0 1 11 5v14a.8.8 0 0 1-1.5.5L6 15M16 10l4 4m0-4-4 4"/>
      </symbol>
      <symbol viewBox="0 0 24 24" id="vjs-icon-volume-medium" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
        <path stroke="none" d="M0 0h24v24H0z"/>
        <path d="M15 8a5 5 0 0 1 0 8M6 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2l3.5-4.5A.8.8 0 0 1 11 5v14a.8.8 0 0 1-1.5.5L6 15"/>
      </symbol>
      <symbol viewBox="0 0 24 24" id="vjs-icon-volume-high" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
        <path stroke="none" d="M0 0h24v24H0z"/>
        <path d="M15 8a5 5 0 0 1 0 8M17.7 5a9 9 0 0 1 0 14M6 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2l3.5-4.5A.8.8 0 0 1 11 5v14a.8.8 0 0 1-1.5.5L6 15"/>
      </symbol>
      <symbol viewBox="0 0 48 48" id="vjs-icon-spinner">
        <path d="M18.8 21l9.53-16.51C26.94 4.18 25.49 4 24 4c-4.8 0-9.19 1.69-12.64 4.51l7.33 12.69.11-.2zm24.28-3c-1.84-5.85-6.3-10.52-11.99-12.68L23.77 18h19.31zm.52 2H28.62l.58 1 9.53 16.5C41.99 33.94 44 29.21 44 24c0-1.37-.14-2.71-.4-4zm-26.53 4l-7.8-13.5C6.01 14.06 4 18.79 4 24c0 1.37.14 2.71.4 4h14.98l-2.31-4zM4.92 30c1.84 5.85 6.3 10.52 11.99 12.68L24.23 30H4.92zm22.54 0l-7.8 13.51c1.4.31 2.85.49 4.34.49 4.8 0 9.19-1.69 12.64-4.51L29.31 26.8 27.46 30z"></path>
      </symbol>
      <symbol viewBox="0 0 24 24" id="vjs-icon-hd">
        <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 12H9.5v-2h-2v2H6V9h1.5v2.5h2V9H11v6zm2-6h4c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1h-4V9zm1.5 4.5h2v-3h-2v3z"></path>
      </symbol>
      <symbol viewBox="0 0 24 24" id="vjs-icon-chapters" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
        <path stroke="none" d="M0 0h24v24H0z"/>
        <path d="M9 6h11M9 12h11M9 18h11M5 6v.01M5 12v.01M5 18v.01"/>
      </symbol>
      <symbol viewBox="0 0 40 40" id="vjs-icon-downloading">
        <path d="M18.208 36.875q-3.208-.292-5.979-1.729-2.771-1.438-4.812-3.729-2.042-2.292-3.188-5.229-1.146-2.938-1.146-6.23 0-6.583 4.334-11.416 4.333-4.834 10.833-5.5v3.166q-5.167.75-8.583 4.646Q6.25 14.75 6.25 19.958q0 5.209 3.396 9.104 3.396 3.896 8.562 4.646zM20 28.417L11.542 20l2.083-2.083 4.917 4.916v-11.25h2.916v11.25l4.875-4.916L28.417 20zm1.792 8.458v-3.167q1.833-.25 3.541-.958 1.709-.708 3.167-1.875l2.333 2.292q-1.958 1.583-4.25 2.541-2.291.959-4.791 1.167zm6.791-27.792q-1.541-1.125-3.25-1.854-1.708-.729-3.541-1.021V3.042q2.5.25 4.77 1.208 2.271.958 4.271 2.5zm4.584 21.584l-2.25-2.25q1.166-1.5 1.854-3.209.687-1.708.937-3.541h3.209q-.292 2.5-1.229 4.791-.938 2.292-2.521 4.209zm.541-12.417q-.291-1.833-.958-3.562-.667-1.73-1.833-3.188l2.375-2.208q1.541 1.916 2.458 4.208.917 2.292 1.167 4.75z"></path>
      </symbol>
      <symbol viewBox="0 0 48 48" id="vjs-icon-file-download">
        <path d="M10.8 40.55q-1.35 0-2.375-1T7.4 37.15v-7.7h3.4v7.7h26.35v-7.7h3.4v7.7q0 1.4-1 2.4t-2.4 1zM24 32.1L13.9 22.05l2.45-2.45 5.95 5.95V7.15h3.4v18.4l5.95-5.95 2.45 2.45z"></path>
      </symbol>
      <symbol viewBox="0 0 48 48" id="vjs-icon-file-download-done">
        <path d="M9.8 40.5v-3.45h28.4v3.45zm9.2-9.05L7.4 19.85l2.45-2.35L19 26.65l19.2-19.2 2.4 2.4z"></path>
      </symbol>
      <symbol viewBox="0 0 48 48" id="vjs-icon-file-download-off">
        <path d="M4.9 4.75L43.25 43.1 41 45.3l-4.75-4.75q-.05.05-.075.025-.025-.025-.075-.025H10.8q-1.35 0-2.375-1T7.4 37.15v-7.7h3.4v7.7h22.05l-7-7-1.85 1.8L13.9 21.9l1.85-1.85L2.7 7zm26.75 14.7l2.45 2.45-3.75 3.8-2.45-2.5zM25.7 7.15V21.1l-3.4-3.45V7.15z"></path>
      </symbol>
      <symbol viewBox="0 0 48 48" id="vjs-icon-share">
        <path d="M36 32.17c-1.52 0-2.89.59-3.93 1.54L17.82 25.4c.11-.45.18-.92.18-1.4s-.07-.95-.18-1.4l14.1-8.23c1.07 1 2.5 1.62 4.08 1.62 3.31 0 6-2.69 6-6s-2.69-6-6-6-6 2.69-6 6c0 .48.07.95.18 1.4l-14.1 8.23c-1.07-1-2.5-1.62-4.08-1.62-3.31 0-6 2.69-6 6s2.69 6 6 6c1.58 0 3.01-.62 4.08-1.62l14.25 8.31c-.1.42-.16.86-.16 1.31A5.83 5.83 0 1 0 36 32.17z"></path>
      </symbol>
      <symbol viewBox="0 0 24 24" id="vjs-icon-cog" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z"/>
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37 1 .608 2.296.07 2.572-1.065z"/>
        <path d="M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0"/>
      </symbol>
      <symbol viewBox="0 0 48 48" id="vjs-icon-square">
        <path d="M36 8H12c-2.21 0-4 1.79-4 4v24c0 2.21 1.79 4 4 4h24c2.21 0 4-1.79 4-4V12c0-2.21-1.79-4-4-4zm0 28H12V12h24v24z"></path>
      </symbol>
      <symbol viewBox="0 0 48 48" id="vjs-icon-circle">
        <circle cx="24" cy="24" r="20"></circle>
      </symbol>
      <symbol viewBox="0 0 48 48" id="vjs-icon-circle-outline">
        <path d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm0 36c-8.82 0-16-7.18-16-16S15.18 8 24 8s16 7.18 16 16-7.18 16-16 16z"></path>
      </symbol>
      <symbol viewBox="0 0 48 48" id="vjs-icon-circle-inner-circle">
        <path d="M24 4C12.97 4 4 12.97 4 24s8.97 20 20 20 20-8.97 20-20S35.03 4 24 4zm0 36c-8.82 0-16-7.18-16-16S15.18 8 24 8s16 7.18 16 16-7.18 16-16 16zm6-16c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6 6 2.69 6 6z"></path>
      </symbol>
      <symbol viewBox="0 0 24 24" id="vjs-icon-cancel" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14z" />
        <path d="M9 9l6 6m0 -6l-6 6" />
      </symbol>
      <symbol viewBox="0 0 24 24" id="vjs-icon-replay" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M19.95 11a8 8 0 1 0 -.5 4m.5 5v-5h-5" />
      </symbol>
      <symbol viewBox="0 0 48 48" id="vjs-icon-repeat">
        <path d="M14 14h20v6l8-8-8-8v6H10v12h4v-8zm20 20H14v-6l-8 8 8 8v-6h24V26h-4v8z"></path>
      </symbol>
      <symbol viewBox="0 0 24 24" id="vjs-icon-replay-5" fill="none" stroke-linecap="round"  stroke-linejoin="round" stroke-width="1.5">
        <path stroke="none" d="M0 0h24v24H0z"/>
        <path fill="currentColor" stroke="none" d="m19.496 4.136-12 7a1 1 0 0 0 0 1.728l12 7A1 1 0 0 0 21 19V5a1 1 0 0 0-1.504-.864zM4 4a1 1 0 0 1 .993.883L5 5v14a1 1 0 0 1-1.993.117L3 19V5a1 1 0 0 1 1-1z"/>
      </symbol>
      <symbol viewBox="0 0 24 24" id="vjs-icon-replay-10" fill="none" stroke-linecap="round"  stroke-linejoin="round" stroke-width="1.5">
        <path stroke="none" d="M0 0h24v24H0z"/>
        <path fill="currentColor" stroke="none" d="m19.496 4.136-12 7a1 1 0 0 0 0 1.728l12 7A1 1 0 0 0 21 19V5a1 1 0 0 0-1.504-.864zM4 4a1 1 0 0 1 .993.883L5 5v14a1 1 0 0 1-1.993.117L3 19V5a1 1 0 0 1 1-1z"/>
      </symbol>
      <symbol viewBox="0 0 24 24" id="vjs-icon-replay-30" fill="none" stroke-linecap="round"  stroke-linejoin="round" stroke-width="1.5">
        <path stroke="none" d="M0 0h24v24H0z"/>
        <path fill="currentColor" stroke="none" d="m19.496 4.136-12 7a1 1 0 0 0 0 1.728l12 7A1 1 0 0 0 21 19V5a1 1 0 0 0-1.504-.864zM4 4a1 1 0 0 1 .993.883L5 5v14a1 1 0 0 1-1.993.117L3 19V5a1 1 0 0 1 1-1z"/>
      </symbol>
      <symbol viewBox="0 0 24 24" id="vjs-icon-forward-5" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
        <path stroke="none" d="M0 0h24v24H0z"/>
        <path fill="currentColor" stroke="none" d="M3 5v14a1 1 0 0 0 1.504.864l12-7a1 1 0 0 0 0-1.728l-12-7A1 1 0 0 0 3 5zM20 4a1 1 0 0 1 .993.883L21 5v14a1 1 0 0 1-1.993.117L19 19V5a1 1 0 0 1 1-1z"/>
      </symbol>
      <symbol viewBox="0 0 24 24" id="vjs-icon-forward-10" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
        <path stroke="none" d="M0 0h24v24H0z"/>
        <path fill="currentColor" stroke="none" d="M3 5v14a1 1 0 0 0 1.504.864l12-7a1 1 0 0 0 0-1.728l-12-7A1 1 0 0 0 3 5zM20 4a1 1 0 0 1 .993.883L21 5v14a1 1 0 0 1-1.993.117L19 19V5a1 1 0 0 1 1-1z"/>
      </symbol>
      <symbol viewBox="0 0 24 24" id="vjs-icon-forward-30" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
        <path stroke="none" d="M0 0h24v24H0z"/>
        <path fill="currentColor" stroke="none" d="M3 5v14a1 1 0 0 0 1.504.864l12-7a1 1 0 0 0 0-1.728l-12-7A1 1 0 0 0 3 5zM20 4a1 1 0 0 1 .993.883L21 5v14a1 1 0 0 1-1.993.117L19 19V5a1 1 0 0 1 1-1z"/>
      </symbol>
      <symbol viewBox="0 0 512 512" id="vjs-icon-audio-description">
        <g fill-rule="evenodd">
          <path d="M227.29 381.351V162.993c50.38-1.017 89.108-3.028 117.631 17.126 27.374 19.342 48.734 56.965 44.89 105.325-4.067 51.155-41.335 94.139-89.776 98.475-24.085 2.155-71.972 0-71.972 0s-.84-1.352-.773-2.568m48.755-54.804c31.43 1.26 53.208-16.633 56.495-45.386 4.403-38.51-21.188-63.552-58.041-60.796v103.612c-.036 1.466.575 2.22 1.546 2.57"></path>
          <path d="M383.78 381.328c13.336 3.71 17.387-11.06 23.215-21.408 12.722-22.571 22.294-51.594 22.445-84.774.221-47.594-18.343-82.517-35.6-106.182h-8.51c-.587 3.874 2.226 7.315 3.865 10.276 13.166 23.762 25.367 56.553 25.54 94.194.2 43.176-14.162 79.278-30.955 107.894"></path>
          <path d="M425.154 381.328c13.336 3.71 17.384-11.061 23.215-21.408 12.721-22.571 22.291-51.594 22.445-84.774.221-47.594-18.343-82.517-35.6-106.182h-8.511c-.586 3.874 2.226 7.315 3.866 10.276 13.166 23.762 25.367 56.553 25.54 94.194.2 43.176-14.162 79.278-30.955 107.894"></path>
          <path d="M466.26 381.328c13.337 3.71 17.385-11.061 23.216-21.408 12.722-22.571 22.292-51.594 22.445-84.774.221-47.594-18.343-82.517-35.6-106.182h-8.51c-.587 3.874 2.225 7.315 3.865 10.276 13.166 23.762 25.367 56.553 25.54 94.194.2 43.176-14.162 79.278-30.955 107.894M4.477 383.005H72.58l18.573-28.484 64.169-.135s.065 19.413.065 28.62h48.756V160.307h-58.816c-5.653 9.537-140.85 222.697-140.85 222.697zm152.667-145.282v71.158l-40.453-.27 40.453-70.888z"></path>
        </g>
      </symbol>
      <symbol viewBox="0 0 48 48" id="vjs-icon-next-item">
        <path d="M12 36l17-12-17-12v24zm20-24v24h4V12h-4z"></path>
      </symbol>
      <symbol viewBox="0 0 48 48" id="vjs-icon-previous-item">
        <path d="M12 12h4v24h-4zm7 12l17 12V12z"></path>
      </symbol>
      <symbol viewBox="0 0 48 48" id="vjs-icon-shuffle">
        <path d="M21.17 18.34L10.83 8 8 10.83l10.34 10.34 2.83-2.83zM29 8l4.09 4.09L8 37.17 10.83 40l25.09-25.09L40 19V8H29zm.66 18.83l-2.83 2.83 6.26 6.26L29 40h11V29l-4.09 4.09-6.25-6.26z"></path>
      </symbol>
      <symbol viewBox="0 0 48 48" id="vjs-icon-cast">
        <path d="M42 6H6c-2.21 0-4 1.79-4 4v6h4v-6h36v28H28v4h14c2.21 0 4-1.79 4-4V10c0-2.21-1.79-4-4-4zM2 36v6h6c0-3.31-2.69-6-6-6zm0-8v4c5.52 0 10 4.48 10 10h4c0-7.73-6.27-14-14-14zm0-8v4c9.94 0 18 8.06 18 18h4c0-12.15-9.85-22-22-22z"></path>
      </symbol>
      <symbol viewBox="0 0 24 24" id="vjs-icon-picture-in-picture-enter" fill="none" stroke-linecap="round"  stroke-linejoin="round" stroke-width="1.5">
        <path stroke="none" d="M0 0h24v24H0z"/>
        <path d="M11 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/>
        <path d="M14 15a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1z"/>
      </symbol>
      <symbol viewBox="0 0 24 24" id="vjs-icon-picture-in-picture-exit" fill="none" stroke-linecap="round"  stroke-linejoin="round" stroke-width="1.5">
        <path stroke="none" d="M0 0h24v24H0z"/>
        <path d="M11 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/>
        <path d="M14 15a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1zM7 9l4 4M7 12V9h3"/>
      </symbol>
      <symbol viewBox="0 0 1792 1792" id="vjs-icon-facebook">
        <path d="M1343 12v264h-157q-86 0-116 36t-30 108v189h293l-39 296h-254v759H734V905H479V609h255V391q0-186 104-288.5T1115 0q147 0 228 12z"></path>
      </symbol>
      <symbol viewBox="0 0 1792 1792" id="vjs-icon-linkedin">
        <path d="M477 625v991H147V625h330zm21-306q1 73-50.5 122T312 490h-2q-82 0-132-49t-50-122q0-74 51.5-122.5T314 148t133 48.5T498 319zm1166 729v568h-329v-530q0-105-40.5-164.5T1168 862q-63 0-105.5 34.5T999 982q-11 30-11 81v553H659q2-399 2-647t-1-296l-1-48h329v144h-2q20-32 41-56t56.5-52 87-43.5T1285 602q171 0 275 113.5t104 332.5z"></path>
      </symbol>
      <symbol viewBox="0 0 1792 1792" id="vjs-icon-twitter">
        <path d="M1684 408q-67 98-162 167 1 14 1 42 0 130-38 259.5T1369.5 1125 1185 1335.5t-258 146-323 54.5q-271 0-496-145 35 4 78 4 225 0 401-138-105-2-188-64.5T285 1033q33 5 61 5 43 0 85-11-112-23-185.5-111.5T172 710v-4q68 38 146 41-66-44-105-115t-39-154q0-88 44-163 121 149 294.5 238.5T884 653q-8-38-8-74 0-134 94.5-228.5T1199 256q140 0 236 102 109-21 205-78-37 115-142 178 93-10 186-50z"></path>
      </symbol>
      <symbol viewBox="0 0 1792 1792" id="vjs-icon-tumblr">
        <path d="M1328 1329l80 237q-23 35-111 66t-177 32q-104 2-190.5-26T787 1564t-95-106-55.5-120-16.5-118V676H452V461q72-26 129-69.5t91-90 58-102 34-99T779 12q1-5 4.5-8.5T791 0h244v424h333v252h-334v518q0 30 6.5 56t22.5 52.5 49.5 41.5 81.5 14q78-2 134-29z"></path>
      </symbol>
      <symbol viewBox="0 0 1792 1792" id="vjs-icon-pinterest">
        <path d="M1664 896q0 209-103 385.5T1281.5 1561 896 1664q-111 0-218-32 59-93 78-164 9-34 54-211 20 39 73 67.5t114 28.5q121 0 216-68.5t147-188.5 52-270q0-114-59.5-214T1180 449t-255-63q-105 0-196 29t-154.5 77-109 110.5-67 129.5T377 866q0 104 40 183t117 111q30 12 38-20 2-7 8-31t8-30q6-23-11-43-51-61-51-151 0-151 104.5-259.5T904 517q151 0 235.5 82t84.5 213q0 170-68.5 289T980 1220q-61 0-98-43.5T859 1072q8-35 26.5-93.5t30-103T927 800q0-50-27-83t-77-33q-62 0-105 57t-43 142q0 73 25 122l-99 418q-17 70-13 177-206-91-333-281T128 896q0-209 103-385.5T510.5 231 896 128t385.5 103T1561 510.5 1664 896z"></path>
      </symbol>
    </defs>
  </svg>`;

  const parser = new window.DOMParser();
  const parsedSVG = parser.parseFromString(icons, 'image/svg+xml');
  const errorNode = parsedSVG.querySelector('parsererror');

  if (errorNode) {
    log.warn('Failed to load SVG Icons.');
  } else {
    const sprite = parsedSVG.documentElement;
    player.el().querySelector('svg').remove();

    sprite.style.display = 'none';
    player.el().appendChild(sprite);

    player.addClass('vjs-svg-icons-enabled');
  }
}

function debounce(func, wait) {
  let timeoutId = null;

  return function () {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, arguments), wait);
  };
}

window.HELP_IMPROVE_VIDEOJS = false;
