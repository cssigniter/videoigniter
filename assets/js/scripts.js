/* global videojs */
'use strict';

videojs.registerPlugin('hoverPreview', hoverPreviewPlugin);
videojs.registerPlugin('branding', brandingPlugin);
videojs.registerPlugin('stickyPlayer', stickyPlayer);

addEventListener('DOMContentLoaded', () => {
  const videos = document.querySelectorAll('.vi-player');

  videos.forEach(video => {
    const main = video.closest('.vi-player-wrap ');
    const sticky = main.dataset.sticky === 'true';
    const fullscreenToggleEnabled = main.dataset.showFullscreenToggle === 'true';
    const hoverPreviewEnabled = main.dataset.hoverPreviewEnabled === 'true';
    const playbackSpeedEnabled = main.dataset.showPlaybackSpeed === 'true';
    const initialVolume = (parseInt(main.dataset.volume, 10) ?? 100) / 100;
    const skipSeconds = parseInt(main.dataset.skipSeconds, 10) ?? 0;
    const playlist = JSON.parse(main.dataset.playlist);

    const title = video.dataset.title;
    const description = video.dataset.description;
    const overlays = JSON.parse(video.dataset.overlays);

    const player = videojs(video, {
      playbackRates: playbackSpeedEnabled ? [0.5, 1, 1.5, 2] : undefined,
      responsive: true,
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
        huge: 900
      },
    });

    if (title || description) {
      player.titleBar.update({
        title: title || '',
        description: description || '',
      })
    }

    player.volume(initialVolume);

    // Initialize plugins
    player.chaptersTimeline();

    if (hoverPreviewEnabled) {
      player.hoverPreview();
    }

    if (sticky) {
      player.stickyPlayer();
    }

    if (overlays?.length > 0) {
      player.overlays(overlays);
    }

    if (playlist?.length > 1) {
      player.playlist(playlist);
      player.playlistUi();

      player.on('playlistitem', () => {
        const currentItem = playlist[player.playlist.currentItem()];
        player.overlays(currentItem.overlays ?? []);

        if (currentItem.name || currentItem.description) {
          player.titleBar.update({
            title: currentItem.name || '',
            description: currentItem.description ?? '',
          });
        }
      });
    }
  });
});

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

function debounce(func, wait) {
  let timeoutId = null;

  return function () {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, arguments), wait);
  };
}

window.HELP_IMPROVE_VIDEOJS = false;
