<?php
add_action( 'init', 'videoigniter_player_block_init' );

function videoigniter_player_block_init() {
	register_block_type( 'videoigniter/player', array(
		'attributes'      => array(
			'uniqueId'                    => array(
				'type' => 'string',
			),
			'playerId'                    => array(
				'type' => 'string',
			),
			'className'                   => array(
				'type'    => 'string',
				'default' => '',
			),
			'backgroundColor'             => array(
				'type' => 'string',
			),
			'backgroundImage'             => array(
				'type' => 'object',
			),
			'textColor'                   => array(
				'type' => 'string',
			),
			'accentColor'                 => array(
				'type' => 'string',
			),
			'textOnAccentColor'           => array(
				'type' => 'string',
			),
			'controlColor'                => array(
				'type' => 'string',
			),
			'playerTextColor'             => array(
				'type' => 'string',
			),
			'playerButtonBackgroundColor' => array(
				'type' => 'string',
			),
			'playerButtonTextColor'       => array(
				'type' => 'string',
			),
			'playerButtonActiveColor'     => array(
				'type' => 'string',
			),
			'playerButtonActiveTextColor' => array(
				'type' => 'string',
			),
			'trackBarColor'               => array(
				'type' => 'string',
			),
			'progressBarColor'            => array(
				'type' => 'string',
			),
			'trackBackgroundColor'        => array(
				'type' => 'string',
			),
			'trackTextColor'              => array(
				'type' => 'string',
			),
			'activeTrackBackgroundColor'  => array(
				'type' => 'string',
			),
			'trackActiveTextColor'        => array(
				'type' => 'string',
			),
			'trackButtonBackgroundColor'  => array(
				'type' => 'string',
			),
			'trackButtonTextColor'        => array(
				'type' => 'string',
			),
			'lyricsModalBackgroundColor'  => array(
				'type' => 'string',
			),
			'lyricsModalTextColor'        => array(
				'type' => 'string',
			),
		),
		'render_callback' => 'videoigniter_player_block_render_callback',
	) );
}

function videoigniter_player_block_defaults() {
	return array(
		'uniqueId'                    => false,
		'playerId'                    => false,
		'backgroundColor'             => false,
		'backgroundImage'             => false,
		'textColor'                   => false,
		'accentColor'                 => false,
		'textOnAccentColor'           => false,
		'controlColor'                => false,
		'playerTextColor'             => false,
		'playerButtonBackgroundColor' => false,
		'playerButtonTextColor'       => false,
		'playerButtonActiveColor'     => false,
		'playerButtonActiveTextColor' => false,
		'trackBarColor'               => false,
		'progressBarColor'            => false,
		'trackBackgroundColor'        => false,
		'trackTextColor'              => false,
		'activeTrackBackgroundColor'  => false,
		'trackActiveTextColor'        => false,
		'trackButtonBackgroundColor'  => false,
		'trackButtonTextColor'        => false,
		'lyricsModalBackgroundColor'  => false,
		'lyricsModalTextColor'        => false,
	);
}

function videoigniter_player_block_generate_styles( $attributes ) {
	ob_start();

	$attributes = wp_parse_args( $attributes, videoigniter_player_block_defaults() );

	$unique_id                       = $attributes['uniqueId'];
	$background_color                = $attributes['backgroundColor'];
	$background_image                = $attributes['backgroundImage'];
	$text_color                      = $attributes['textColor'];
	$accent_color                    = $attributes['accentColor'];
	$text_on_accent_color            = $attributes['textOnAccentColor'];
	$control_color                   = $attributes['controlColor'];
	$player_text_color               = $attributes['playerTextColor'];
	$player_button_background_color  = $attributes['playerButtonBackgroundColor'];
	$player_button_text_color        = $attributes['playerButtonTextColor'];
	$player_button_active_color      = $attributes['playerButtonActiveColor'];
	$player_button_active_text_color = $attributes['playerButtonActiveTextColor'];
	$track_bar_color                 = $attributes['trackBarColor'];
	$progress_bar_color              = $attributes['progressBarColor'];
	$track_background_color          = $attributes['trackBackgroundColor'];
	$track_text_color                = $attributes['trackTextColor'];
	$active_track_background_color   = $attributes['activeTrackBackgroundColor'];
	$track_active_text_color         = $attributes['trackActiveTextColor'];
	$track_button_background_color   = $attributes['trackButtonBackgroundColor'];
	$track_button_text_color         = $attributes['trackButtonTextColor'];
	$lyrics_modal_background_color   = $attributes['lyricsModalBackgroundColor'];
	$lyrics_modal_text_color         = $attributes['lyricsModalTextColor'];


	$id = '#videoigniter-block-' . $unique_id;

	if ( $background_color ) {
		echo wp_kses_post( sprintf( '
			%1$s .vi-wrap { background-color: %2$s; }
			%1$s .vi-wrap .vi-volume-bar { border-right-color: %2$s; }
			%1$s .vi-wrap .vi-track-btn,
			%1$s .vi-wrap .vi-track-control { border-left-color: %2$s; }
		', esc_html( $id ), VideoIgniter()->sanitizer->rgba_color( $background_color ) ) );
	}

	if ( $background_image && $background_image['url'] ) {
		$background_image_url        = $background_image['url'];
		$background_image_repeat     = $background_image['repeat'];
		$background_image_size       = $background_image['size'];
		$background_image_position   = $background_image['position'];
		$background_image_attachment = $background_image['attachment'];
		?>
		<?php echo $id; ?> .vi-wrap {
		background-image: url('<?php echo esc_url_raw( $background_image_url ); ?>');
		<?php if ( $background_image_repeat ) : ?>
			background-repeat: <?php echo $background_image_repeat; ?>;
		<?php endif; ?>
		<?php if ( $background_image_position ) : ?>
			background-position: <?php echo $background_image_position; ?>;
		<?php endif; ?>
		<?php if ( $background_image_size ) : ?>
			background-size: <?php echo $background_image_size; ?>;
		<?php endif; ?>
		<?php if ( $background_image_attachment ) : ?>
			background-attachment: <?php echo $background_image_attachment; ?>;
		<?php endif; ?>
		}
		<?php
	}

	if ( $text_color ) {
		echo wp_kses_post( sprintf( '
			%1$s .vi-wrap,
			%1$s .vi-wrap .vi-btn,
			%1$s .vi-wrap .vi-track-btn {
				color: %2$s;
			}

			%1$s .vi-wrap .vi-btn svg,
			%1$s .vi-wrap .vi-track-no-thumb svg,
			%1$s .vi-wrap .vi-track-btn svg {
				fill: %2$s;
			}
		', esc_html( $id ), VideoIgniter()->sanitizer->rgba_color( $text_color ) ) );
	}

	if ( $accent_color ) {
		echo wp_kses_post( sprintf( '
			%1$s .vi-wrap .vi-audio-control,
			%1$s .vi-wrap .vi-audio-control:hover,
			%1$s .vi-wrap .vi-audio-control:focus,
			%1$s .vi-wrap .vi-track-progress,
			%1$s .vi-wrap .vi-volume-bar.vi-volume-bar-active::before,
			%1$s .vi-wrap .vi-track:hover,
			%1$s .vi-wrap .vi-track.vi-track-active,
			%1$s .vi-wrap .vi-btn.vi-btn-active,
			%1$s .vi-wrap .vi-btn.vi-btn-active:hover,
			%1$s .vi-wrap .vi-btn.vi-btn-active:focus {
				background-color: %2$s;
			}

			%1$s .vi-wrap .vi-scroll-wrap div:last-child div {
				background-color: %2$s !important;
			}

			%1$s .vi-wrap .vi-footer a,
			%1$s .vi-wrap .vi-footer a:hover {
				color: %2$s;
			}
		', esc_html( $id ), VideoIgniter()->sanitizer->rgba_color( $accent_color ) ) );
	}

	if ( $text_on_accent_color ) {
		echo wp_kses_post( sprintf( '
			%1$s .vi-wrap .vi-audio-control,
			%1$s .vi-wrap .vi-track:hover,
			%1$s .vi-wrap .vi-track.vi-track-active,
			%1$s .vi-wrap .vi-track.vi-track-active .vi-track-btn,
			%1$s .vi-wrap .vi-track:hover .vi-track-btn,
			%1$s .vi-wrap .vi-btn.vi-btn-active {
				color: %2$s;
			}

			%1$s .vi-wrap .vi-audio-control path,
			%1$s .vi-wrap .vi-track.vi-track-active .vi-track-btn path,
			%1$s .vi-wrap .vi-track:hover .vi-track-btn path,
			%1$s .vi-wrap .vi-btn.vi-btn-active path {
				fill: %2$s;
			}
		', esc_html( $id ), VideoIgniter()->sanitizer->rgba_color( $text_on_accent_color ) ) );
	}

	if ( $control_color ) {
		echo wp_kses_post( sprintf( '
			%1$s .vi-wrap .vi-track-progress-bar,
			%1$s .vi-wrap .vi-volume-bar,
			%1$s .vi-wrap .vi-btn,
			%1$s .vi-wrap .vi-btn:hover,
			%1$s .vi-wrap .vi-btn:focus,
			%1$s .vi-wrap .vi-track,
			%1$s .vi-wrap .vi-track-no-thumb {
				background-color: %2$s;
			}

			%1$s .vi-wrap .vi-scroll-wrap > div:last-child {
				background-color: %2$s;
			}

			%1$s .vi-wrap .vi-footer {
				border-top-color: %2$s;
			}

			%1$s .vi-wrap.vi-is-loading .vi-control-wrap-thumb::after,
			%1$s .vi-wrap.vi-is-loading .vi-track-title::after,
			%1$s .vi-wrap.vi-is-loading .vi-track-subtitle::after {
				background: %2$s;
			}
		', esc_html( $id ), VideoIgniter()->sanitizer->rgba_color( $control_color ) ) );
	}

	//
	// Player Colors.
	//
	if ( $player_text_color ) {
		echo wp_kses_post( sprintf( '
			%1$s .vi-control-wrap {
				color: %2$s;
			}
		', esc_html( $id ), VideoIgniter()->sanitizer->rgba_color( $player_text_color ) ) );
	}

	if ( $player_button_background_color ) {
		echo wp_kses_post( sprintf( '
			%1$s .vi-control-wrap .vi-btn,
			%1$s .vi-control-wrap .vi-btn:hover,
			%1$s .vi-player-buttons .vi-btn,
			%1$s .vi-player-buttons .vi-btn:hover,
			%1$s .vi-wrap .vi-volume-bar {
				background-color: %2$s;
			}
		', esc_html( $id ), VideoIgniter()->sanitizer->rgba_color( $player_button_background_color ) ) );
	}

	if ( $player_button_text_color ) {
		echo wp_kses_post( sprintf( '
			%1$s .vi-control-wrap .vi-btn,
			%1$s .vi-control-wrap .vi-btn:hover,
			%1$s .vi-player-buttons .vi-btn,
			%1$s .vi-player-buttons .vi-btn:hover {
				color: %2$s;
			}

			%1$s .vi-control-wrap .vi-btn svg,
			%1$s .vi-control-wrap .vi-btn:hover svg {
				fill: %2$s;
			}
		', esc_html( $id ), VideoIgniter()->sanitizer->rgba_color( $player_button_text_color ) ) );
	}

	if ( $player_button_active_color ) {
		echo wp_kses_post( sprintf( '
			%1$s .vi-control-wrap .vi-audio-control,
			%1$s .vi-control-wrap .vi-audio-control:hover,
			%1$s .vi-control-wrap .vi-audio-control:focus,
			%1$s .vi-control-wrap .vi-btn.vi-btn-active,
			%1$s .vi-wrap .vi-volume-bar.vi-volume-bar-active::before {
				background-color: %2$s;
			}
		', esc_html( $id ), VideoIgniter()->sanitizer->rgba_color( $player_button_active_color ) ) );
	}

	if ( $player_button_active_text_color ) {
		echo wp_kses_post( sprintf( '
			%1$s .vi-control-wrap .vi-audio-control svg,
			%1$s .vi-control-wrap .vi-btn.vi-btn-active svg {
				fill: %2$s;
			}

			%1$s .vi-control-wrap .vi-btn.vi-btn-active {
				color: %2$s;
			}
		', esc_html( $id ), VideoIgniter()->sanitizer->rgba_color( $player_button_active_text_color ) ) );
	}

	//
	// Track & Progress Bar Colors.
	//
	if ( $track_bar_color ) {
		echo wp_kses_post( sprintf( '
			%1$s .vi-wrap .vi-track-progress-bar {
				background-color: %2$s;
			}
		', esc_html( $id ), VideoIgniter()->sanitizer->rgba_color( $track_bar_color ) ) );
	}

	if ( $progress_bar_color ) {
		echo wp_kses_post( sprintf( '
			%1$s .vi-wrap .vi-track-progress {
				background-color: %2$s;
			}
		', esc_html( $id ), VideoIgniter()->sanitizer->rgba_color( $progress_bar_color ) ) );
	}

	//
	// Track & Playlist Colors.
	//
	if ( $track_background_color ) {
		echo wp_kses_post( sprintf( '
			%1$s .vi-wrap .vi-track {
				background-color: %2$s;
			}
		', esc_html( $id ), VideoIgniter()->sanitizer->rgba_color( $track_background_color ) ) );
	}

	if ( $track_text_color ) {
		echo wp_kses_post( sprintf( '
			%1$s .vi-wrap .vi-track,
			%1$s .vi-wrap .vi-track-btn {
				color: %2$s;
			}

			%1$s .vi-wrap .vi-track-btn svg {
				fill: %2$s;
			}
		', esc_html( $id ), VideoIgniter()->sanitizer->rgba_color( $track_text_color ) ) );
	}

	if ( $active_track_background_color ) {
		echo wp_kses_post( sprintf( '
			%1$s .vi-wrap .vi-track:hover,
			%1$s .vi-wrap .vi-track.vi-track-active {
				background-color: %2$s;
			}
		', esc_html( $id ), VideoIgniter()->sanitizer->rgba_color( $active_track_background_color ) ) );
	}

	if ( $track_active_text_color ) {
		echo wp_kses_post( sprintf( '
			%1$s .vi-wrap .vi-track:hover,
			%1$s .vi-wrap .vi-track.vi-track-active {
				color: %2$s;
			}

			%1$s .vi-wrap .vi-track:hover .vi-track-btn svg,
			%1$s .vi-wrap .vi-track.vi-track-active .vi-track-btn svg {
				fill: %2$s;
			}
		', esc_html( $id ), VideoIgniter()->sanitizer->rgba_color( $track_active_text_color ) ) );
	}

	if ( $track_button_background_color ) {
		echo wp_kses_post( sprintf( '
			%1$s .vi-wrap .vi-track-btn {
				background-color: %2$s;
			}
		', esc_html( $id ), VideoIgniter()->sanitizer->rgba_color( $track_button_background_color ) ) );
	}

	if ( $track_button_text_color ) {
		echo wp_kses_post( sprintf( '
			%1$s .vi-wrap .vi-track-btn {
				color: %2$s;
			}

			%1$s .vi-wrap .vi-track-btn svg,
			%1$s .vi-wrap .vi-track:hover .vi-track-btn svg,
			%1$s .vi-wrap .vi-track.vi-track-active .vi-track-btn svg {
				fill: %2$s;
			}
		', esc_html( $id ), VideoIgniter()->sanitizer->rgba_color( $track_button_text_color ) ) );
	}

	//
	// Lyrics Modal Colors.
	//
	if ( $lyrics_modal_background_color ) {
		echo wp_kses_post( sprintf( '
			%1$s .vi-modal {
				background-color: %2$s;
			}
		', esc_html( $id ), VideoIgniter()->sanitizer->rgba_color( $lyrics_modal_background_color ) ) );
	}

	if ( $lyrics_modal_text_color ) {
		echo wp_kses_post( sprintf( '
			%1$s .vi-modal,
			%1$s .vi-modal-dismiss,
			%1$s .vi-modal-dismiss:hover {
				color: %2$s;
			}
		', esc_html( $id ), VideoIgniter()->sanitizer->rgba_color( $lyrics_modal_text_color ) ) );
	}

	$css = ob_get_clean();

	return $css;
}

function videoigniter_player_block_render_callback( $attributes ) {
	$attributes = wp_parse_args( $attributes, videoigniter_player_block_defaults() );

	$unique_id  = $attributes['uniqueId'];
	$player_id  = $attributes['playerId'];
	$class_name = $attributes['className'];

	if ( empty( $player_id ) ) {
		return esc_html__( 'Select a playlist from the block settings.', 'videoigniter' );
	}

	$block_id = 'videoigniter-block-' . $unique_id;
	$block_classes = array_merge( array(
		'videoigniter-block',
		$block_id,
	), explode( ' ', $class_name ) );

	ob_start();

	$css = videoigniter_player_block_generate_styles( $attributes );
	if ( trim( $css ) ) {
		?>
		<style>
			<?php echo wp_kses_post( $css ); ?>
		</style>
		<?php
	}

	?>
	<div id="<?php echo esc_attr( $block_id ); ?>" class="<?php echo esc_attr( implode( ' ', $block_classes ) ); ?>">
		<?php echo do_shortcode( sprintf( '[vi_playlist id="%s"]', esc_attr( $player_id ) ) ); ?>
	</div>
	<?php

	$response = ob_get_clean();

	return $response;
}

