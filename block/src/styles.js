import Style from './components/Style';
import Rule from './components/Style/Rule';

const VideoIgniterPlaylistStyles = ({ attributes }) => {
  const {
    uniqueId,
    backgroundColor = window.viColors.backgroundColor,
    textColor = window.viColors.textColor,
    accentColor = window.viColors.accentColor,
    textOnAccentColor = window.viColors.textOnAccentColor,
    controlColor = window.viColors.controlColor,
    playerTextColor = window.viColors.playerTextColor,
    playerButtonBackgroundColor = window.viColors.playerButtonBackgroundColor,
    playerButtonTextColor = window.viColors.playerButtonTextColor,
    playerButtonActiveColor = window.viColors.playerButtonActiveColor,
    playerButtonActiveTextColor = window.viColors.playerButtonActiveTextColor,
    trackBarColor = window.viColors.trackBarColor,
    progressBarColor = window.viColors.progressBarColor,
    trackBackgroundColor = window.viColors.trackBackgroundColor,
    trackTextColor = window.viColors.trackTextColor,
    activeTrackBackgroundColor = window.viColors.activeTrackBackgroundColor,
    trackActiveTextColor = window.viColors.trackActiveTextColor,
    trackButtonBackgroundColor = window.viColors.trackButtonBackgroundColor,
    trackButtonTextColor = window.viColors.trackButtonTextColor,
    lyricsModalBackgroundColor = window.viColors.lyricsModalBackgroundColor,
    lyricsModalTextColor = window.viColors.lyricsModalTextColor,
    backgroundImage,
  } = attributes;

  const { url, repeat, size, position, attachment } = backgroundImage;

  return (
    <Style id={`videoigniter-block-${uniqueId}`}>
      <Rule rule=".vi-wrap { background-color: %s; }" value={backgroundColor} />
      <Rule
        rule=".vi-wrap .vi-volume-bar { border-right-color: %s; }"
        value={backgroundColor}
      />
      <Rule
        rule=".vi-wrap .vi-track-btn, .vi-wrap .vi-track-control { border-left-color: %s; }"
        value={backgroundColor}
      />

      <Rule
        rule=".vi-wrap { background-image: url(%s); }"
        value={url || window.viColors.bg_image}
      />
      <Rule
        rule=".vi-wrap { background-repeat: %s; }"
        value={repeat || window.viColors.bg_image_repeat}
      />
      <Rule rule=".vi-wrap { background-size: %s; }" value={size} />
      <Rule
        rule=".vi-wrap { background-position: %s; }"
        value={position || window.viColors.bg_image_position}
      />
      <Rule rule=".vi-wrap { background-attachment: %s; }" value={attachment} />

      <Rule
        rule=".vi-wrap,
				.vi-wrap .vi-btn,
				.vi-wrap .vi-track-btn { color: %s; }"
        value={textColor}
      />
      <Rule
        rule="
				.vi-wrap .vi-btn svg,
				.vi-wrap .vi-track-no-thumb svg,
				.vi-wrap .vi-track-btn svg { fill: %s; }"
        value={textColor}
      />

      <Rule
        rule=".vi-wrap .vi-audio-control,
				.vi-wrap .vi-audio-control:hover,
				.vi-wrap .vi-audio-control:focus,
				.vi-wrap .vi-track-progress,
				.vi-wrap .vi-volume-bar.vi-volume-bar-active::before,
				.vi-wrap .vi-track:hover,
				.vi-wrap .vi-track.vi-track-active,
				.vi-wrap .vi-btn.vi-btn-active { background-color: %s; }"
        value={accentColor}
      />
      <Rule
        rule=".vi-wrap .vi-scroll-wrap > div:last-child div { background-color: %s !important; }"
        value={accentColor}
      />
      <Rule
        rule="
				.vi-wrap .vi-btn:hover,
				.vi-wrap .vi-btn:focus,
				.vi-wrap .vi-footer a,
				.vi-wrap .vi-footer a:hover {
					color: %s;
				}"
        value={accentColor}
      />
      <Rule
        rule="
				.vi-wrap .vi-btn:hover svg,
				.vi-wrap .vi-btn:focus svg  {
					fill: %s;
				}"
        value={accentColor}
      />

      <Rule
        rule="
					.vi-wrap .vi-audio-control,
					.vi-wrap .vi-track:hover,
					.vi-wrap .vi-track.vi-track-active,
					.vi-wrap .vi-track.vi-track-active .vi-track-btn,
					.vi-wrap .vi-track:hover .vi-track-btn,
					.vi-wrap .vi-btn.vi-btn-active {
						color: %s;
					}
				"
        value={textOnAccentColor}
      />
      <Rule
        rule="
					.vi-wrap .vi-audio-control path,
					.vi-wrap .vi-track.vi-track-active .vi-track-btn path,
					.vi-wrap .vi-track:hover .vi-track-btn path,
					.vi-wrap .vi-btn.vi-btn-active path {
						fill: %s;
					}
				"
        value={textOnAccentColor}
      />

      <Rule
        rule="
					.vi-wrap .vi-track-progress-bar,
					.vi-wrap .vi-volume-bar,
					.vi-wrap .vi-btn,
					.vi-wrap .vi-btn:hover,
					.vi-wrap .vi-btn:focus,
					.vi-wrap .vi-track,
					.vi-wrap .vi-track-no-thumb {
						background-color: %s;
					}
				"
        value={controlColor}
      />
      <Rule
        rule="
					.vi-wrap .vi-scroll-wrap > div:last-child {
						background-color: %s;
					}
				"
        value={controlColor}
      />
      <Rule
        rule="
					.vi-wrap .vi-footer {
						border-top-color: %s;
					}
				"
        value={controlColor}
      />
      <Rule
        rule="
					.vi-wrap.vi-is-loading .vi-control-wrap-thumb::after,
					.vi-wrap.vi-is-loading .vi-track-title::after,
					.vi-wrap.vi-is-loading .vi-track-subtitle::after {
						background: %s;
					}
				"
        value={controlColor}
      />

      <Rule rule=".vi-control-wrap { color: %s; }" value={playerTextColor} />
      <Rule
        rule="
          .vi-control-wrap .vi-btn,
			    .vi-control-wrap .vi-btn:hover,
			    .vi-player-buttons .vi-btn,
			    .vi-player-buttons .vi-btn:hover,
			    .vi-wrap .vi-volume-bar {
			      background-color: %s;
			    }
        "
        value={playerButtonBackgroundColor}
      />
      <Rule
        rule="
          .vi-control-wrap .vi-audio-control,
          .vi-control-wrap .vi-audio-control:hover,
          .vi-control-wrap .vi-audio-control:focus,
          .vi-control-wrap .vi-btn.vi-btn-active,
          .vi-wrap .vi-volume-bar.vi-volume-bar-active::before {
			      background-color: %s;
			    }
        "
        value={playerButtonActiveColor}
      />
      <Rule
        rule="
          .vi-control-wrap .vi-btn,
			    .vi-control-wrap .vi-btn:hover,
			    .vi-player-buttons .vi-btn,
			    .vi-player-buttons .vi-btn:hover {
			      color: %s;
			    }
        "
        value={playerButtonTextColor}
      />
      <Rule
        rule="
          .vi-control-wrap .vi-btn svg,
			    .vi-control-wrap .vi-btn:hover svg,
			    .vi-player-buttons .vi-btn,
			    .vi-player-buttons .vi-btn:hover {
			      fill: %s;
			    }
        "
        value={playerButtonTextColor}
      />
      <Rule
        rule="
          .vi-control-wrap .vi-audio-control svg,
			    .vi-control-wrap .vi-btn.vi-btn-active {
			      fill: %s;
			    }
        "
        value={playerButtonActiveTextColor}
      />
      <Rule
        rule="
          .vi-control-wrap .vi-btn.vi-btn-active {
			      color: %s;
			    }
        "
        value={playerButtonActiveTextColor}
      />
      <Rule
        rule="
          .vi-wrap .vi-track-progress-bar {
			      background-color: %s;
			    }
        "
        value={trackBarColor}
      />
      <Rule
        rule="
          .vi-wrap .vi-track-progress {
			      background-color: %s;
			    }
        "
        value={progressBarColor}
      />
      <Rule
        rule="
          .vi-wrap .vi-track {
			      background-color: %s;
			    }
        "
        value={trackBackgroundColor}
      />
      <Rule
        rule="
          .vi-wrap .vi-track,
			    .vi-wrap .vi-track-btn {
			      color: %s;
			    }
        "
        value={trackTextColor}
      />
      <Rule
        rule="
          .vi-wrap .vi-track-btn svg {
			      fill: %s;
			    }
        "
        value={trackTextColor}
      />
      <Rule
        rule="
          .vi-wrap .vi-track:hover,
			    .vi-wrap .vi-track.vi-track-active {
			      background-color: %s;
			    }
        "
        value={activeTrackBackgroundColor}
      />
      <Rule
        rule="
          .vi-wrap .vi-track:hover,
			    .vi-wrap .vi-track.vi-track-active {
			      color: %s;
			    }
        "
        value={trackActiveTextColor}
      />
      <Rule
        rule="
          .vi-wrap .vi-track:hover .vi-track-btn svg,
			    .vi-wrap .vi-track.vi-track-active .vi-track-btn svg {
			      fill: %s;
			    }
        "
        value={trackActiveTextColor}
      />
      <Rule
        rule="
          .vi-wrap .vi-track-btn {
			      background-color: %s;
			    }
        "
        value={trackButtonBackgroundColor}
      />
      <Rule
        rule="
          .vi-wrap .vi-track-btn {
			      color: %s;
			    }
        "
        value={trackButtonTextColor}
      />
      <Rule
        rule="
          .vi-wrap .vi-track-btn svg,
			    .vi-wrap .vi-track:hover .vi-track-btn svg,
			    .vi-wrap .vi-track.vi-track-active .vi-track-btn svg {
			      fill: %s;
			    }
        "
        value={trackButtonTextColor}
      />
      <Rule
        rule="
          .vi-modal {
			      background-color: %s;
			    }
        "
        value={lyricsModalBackgroundColor}
      />
      <Rule
        rule="
          .vi-modal,
			    .vi-modal-dismiss,
			    .vi-modal-dismiss:hover {
			      color: %s;
			    }
        "
        value={lyricsModalTextColor}
      />
    </Style>
  );
};

export default VideoIgniterPlaylistStyles;
