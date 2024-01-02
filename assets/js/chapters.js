/**
 * Chapters timeline plugin
 */

class ChapterTimeline extends videojs.getComponent('Component') {
  constructor(player, options = {}) {
    super(player, options);

    if (options.left && options.width) {
      this.setPosition(options.left, options.width);
    }
  }

  createEl() {
    const main = videojs.dom.createEl('div', {
      className: 'vjs-chapter-timeline',
    });
    const progressBar = videojs.dom.createEl('div', {
      className: 'vjs-chapter-timeline-progress',
    });
    main.append(progressBar);

    return main;
  }

  setPosition(left, width) {
    this.el().style.left = left;
    this.el().style.width = width;
  }

  updateProgress(progress) {
    const progressBar = this.el().querySelector(
      '.vjs-chapter-timeline-progress',
    );
    progressBar.style.width = `${progress}%`;
  }
}

videojs.registerComponent('ChapterTimeline', ChapterTimeline);

function chaptersTimeline() {
  const player = this;

  /**
   * Fetches all chapter cues from the chapters track.
   * @returns {*[]}
   */
  const getChapters = () => {
    const [chapters] =
      Array.from(player.textTracks()).filter(textTrack => {
        return textTrack.kind === 'chapters';
      }) ?? [];

    return chapters;
  };

  /**
   * Given a time (in seconds) it returns the chapter it corresponds to.
   * @param time
   * @returns {TextTrackCue|null}
   */
  const findChapter = time => {
    const chapters = getChapters();
    const cues = chapters?.cues;

    if (!cues) {
      return;
    }

    return Array.from(cues).find(
      cue => time >= cue.startTime && time <= cue.endTime,
    );
  };

  const handleTooltipUpdate = () => {
    const mouseTimeDisplay = player
      .getChild('controlBar')
      .getChild('progressControl')
      .getChild('seekBar')
      .getChild('mouseTimeDisplay');

    const timeTooltip = mouseTimeDisplay.getChild('timeTooltip');

    timeTooltip.update = function (seekBarRect, seekBarPoint, time) {
      const seconds = seekBarPoint * player.duration();
      const chapter = findChapter(seconds);

      if (chapter) {
        timeTooltip.el().classList.add('vjs-time-tooltip-with-chapter-title');
        timeTooltip.el().innerHTML = `<span class="vjs-time-tooltip-chapter-title">${chapter.text}</span>${time}`;
      } else {
        timeTooltip.write(time);
        timeTooltip
          .el()
          .classList.remove('vjs-time-tooltip-with-chapter-title');
      }
    };
  };

  /**
   * Highlights the chapter timelines.
   * @param event
   */
  const chapterTimelineHighlight = event => {
    const progressControl = player
      .getChild('controlBar')
      .getChild('progressControl');
    const seekBarPoint = player
      .getChild('controlBar')
      .getChild('progressControl')
      .getChild('seekBar')
      .calculateDistance(event);
    const seconds = seekBarPoint * player.duration();

    const chapters = getChapters();
    const cues = chapters?.cues;
    const chapterTimelines = progressControl
      .el()
      .querySelectorAll('.vjs-chapter-timeline');

    if (!cues) {
      return;
    }

    Array.from(cues).forEach((cue, index) => {
      const chapterTimeline = chapterTimelines[index];

      if (chapterTimeline) {
        if (seconds >= cue.startTime && seconds <= cue.endTime) {
          chapterTimeline.classList.add('vjs-chapter-timeline-current');
        } else {
          chapterTimeline.classList.remove('vjs-chapter-timeline-current');
        }
      }
    });
  };

  const clearChapterTimelineHighlight = () => {
    const progressControl = player
      .getChild('controlBar')
      .getChild('progressControl');
    progressControl
      .el()
      .querySelectorAll('.vjs-chapter-timeline')
      ?.forEach(chapterTimeline => {
        chapterTimeline.classList.remove('vjs-chapter-timeline-current');
      });
  };

  /**
   * Updates the chapter timelines' progress.
   */
  const updateChapterTimelineProgress = () => {
    const currentTime = player.currentTime();
    const chapters = getChapters();
    const cues = chapters?.cues;

    if (!cues) {
      return;
    }

    const progressControl = player
      .getChild('controlBar')
      .getChild('progressControl');
    const chapterTimelines = progressControl
      .el()
      .querySelectorAll('.vjs-chapter-timeline');

    Array.from(cues).forEach((cue, index) => {
      const chapterTimeline = chapterTimelines[index];

      if (chapterTimeline) {
        const progressEl = chapterTimeline.querySelector(
          '.vjs-chapter-timeline-progress',
        );

        if (currentTime >= cue.endTime) {
          progressEl.style.width = '100%';
        } else if (currentTime >= cue.startTime && currentTime <= cue.endTime) {
          const chapterProgress =
            ((currentTime - cue.startTime) / (cue.endTime - cue.startTime)) *
            100;
          progressEl.style.width = `${chapterProgress}%`;
        } else {
          progressEl.style.width = '0%';
        }
      }
    });
  };

  /**
   * Clears chapter timelines.
   */
  const clearChapterTimelines = () => {
    const seekBar = player
      .getChild('controlBar')
      .getChild('progressControl')
      .getChild('seekBar');

    // Remove all previous potential chapter timelines
    seekBar
      .el()
      .querySelectorAll('.vjs-chapter-timeline')
      .forEach(el => {
        el.remove();
      });
  };

  /**
   * Renders the chapters as timeline bars on the player's progress bar.
   */
  const renderChapterTimelines = () => {
    const chapters = getChapters();
    const cues = chapters?.cues;

    const seekBar = player
      .getChild('controlBar')
      .getChild('progressControl')
      .getChild('seekBar');

    clearChapterTimelines();

    if (!cues) {
      return;
    }

    const duration = player.duration();

    Array.from(cues).forEach(cue => {
      const startTimePercentage = (cue.startTime / duration) * 100;
      const endTimePercentage = (cue.endTime / duration) * 100;
      const chapterTimeline = new ChapterTimeline(player, {
        left: `${startTimePercentage}%`,
        width: `${endTimePercentage - startTimePercentage}%`,
      });

      seekBar.addChild(chapterTimeline);
    });

    handleTooltipUpdate();
  };

  /**
   * Polls for chapters tracks.
   * @returns {Promise<Array>}
   */
  const waitForChaptersTextTrack = () => {
    return new Promise(resolve => {
      let attempts = 0;
      const maxAttempts = 12;

      const check = () => {
        const chapters = getChapters();
        if (chapters) {
          resolve(chapters);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(check, 250);
        }
      };

      check();
    });
  };

  /**
   * Polls for chapter cues.
   * @returns {Promise<unknown>}
   */
  const waitForCues = () => {
    return new Promise(async resolve => {
      let attempts = 0;
      const maxAttempts = 12;

      const check = async () => {
        const chapters = await waitForChaptersTextTrack();
        const cues = chapters?.cues;
        if (cues) {
          resolve(cues);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(check, 250);
        }
      };

      await check();
    });
  };

  player.on('loadedmetadata', async () => {
    clearChapterTimelines();

    try {
      await waitForCues();
      renderChapterTimelines();

      const progressControl = player
        .getChild('controlBar')
        .getChild('progressControl');
      progressControl.on('mousemove', chapterTimelineHighlight);
      progressControl.on('touchmove', chapterTimelineHighlight);
      progressControl.on('mouseleave', clearChapterTimelineHighlight);
    } catch {}
  });
  player.on('timeupdate', updateChapterTimelineProgress);

  player.on('dispose', () => {
    player.off('loadedmetadata', renderChapterTimelines);
    player.off('timeupdate', updateChapterTimelineProgress);

    const progressControl = player
      .getChild('controlBar')
      .getChild('progressControl');
    progressControl.off('mousemove', chapterTimelineHighlight);
    progressControl.off('touchmove', chapterTimelineHighlight);
    progressControl.off('mouseleave', clearChapterTimelineHighlight);
  });
}

videojs.registerPlugin('chaptersTimeline', chaptersTimeline);
