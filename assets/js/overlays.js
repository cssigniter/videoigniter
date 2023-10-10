/**
 * Overlays plugin
 */

class Overlay extends videojs.getComponent('Component') {
  constructor(player, options = {}) {
    super(player, options);
    this.startTime = options.startTime;
    this.endTime = options.endTime;
    this.dismissed = false;
  }

  createEl() {
    const { link, title, text, imageUrl, position = 'top-left' } = this.options();
    const mainEl = videojs.dom.createEl('div', {
      className: `vjs-overlay vjs-overlay-${position}`,
    });
    const innerEl = videojs.dom.createEl(link ? 'a' : 'div', {
      className: 'vjs-overlay-inner',
      href: link || undefined,
      target: link ? '_blank' : undefined,
      rel: link ? 'noopener' : undefined,
    });
    const contentEl = videojs.dom.createEl('div', {
      className: 'vjs-overlay-content',
    });
    const titleEl = videojs.dom.createEl('p', {
      className: 'vjs-overlay-title',
      textContent: title,
    });
    const textEl = videojs.dom.createEl('p', {
      className: 'vjs-overlay-text',
      textContent: text,
    });

    if (imageUrl) {
      const imageWrapEl = videojs.dom.createEl('div', {
        className: 'vjs-overlay-image-wrap',
      });
      const imageEl = videojs.dom.createEl('img', {
        className: 'vjs-overlay-image',
        src: imageUrl,
        alt: '',
      });
      imageWrapEl.append(imageEl);
      innerEl.append(imageWrapEl);
    }

    const dismissEl = videojs.dom.createEl('button', {
      className: 'vjs-overlay-dismiss',
      onclick: () => {
        this.dismiss();
      },
    });

    contentEl.append(titleEl);
    contentEl.append(textEl);
    innerEl.append(contentEl);
    mainEl.append(innerEl);
    mainEl.append(dismissEl);

    return mainEl;
  }

  show() {
    if (!this.dismissed) {
      this.el().classList.add('vjs-overlay-visible');
    }
  }

  hide() {
    this.el().classList.remove('vjs-overlay-visible');
  }

  dismiss() {
    this.hide();
    this.dismissed = true;
  }
}

videojs.registerComponent('Overlay', Overlay);

function overlays(overlays) {
  const player = this;

  const overlayComponents = overlays.map(overlay => {
    return player.addChild('Overlay', overlay);
  });

  const updateOverlays = () => {
    const currentTime = player.currentTime();
    overlayComponents.forEach(overlay => {
      if (currentTime >= overlay.startTime && currentTime <= overlay.endTime) {
        overlay.show();
      } else {
        overlay.hide();
      }
    });
  };

  player.on('timeupdate', updateOverlays);
  player.on('dispose', () => {
    player.off('timeupdate', updateOverlays);
  });
}

videojs.registerPlugin('overlays', overlays);
