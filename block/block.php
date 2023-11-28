<?php
/**
 * Block-related functions.
 */

add_action( 'init', 'videoigniter_player_block_init' );
/**
 * Registers the plugin's blocks.
 *
 * @since NewVersion
 */
function videoigniter_player_block_init() {
	register_block_type( 'videoigniter/player', array(
		'attributes'      => array(
			'uniqueId'  => array(
				'type' => 'string',
			),
			'playerId'  => array(
				'type' => 'string',
			),
			'className' => array(
				'type'    => 'string',
				'default' => '',
			),
		),
		'render_callback' => 'videoigniter_player_block_render_callback',
	) );
}

/**
 * Returns the Player block's default values.
 *
 * @since NewVersion
 *
 * @return array
 */
function videoigniter_player_block_defaults(): array {
	return array(
		'uniqueId' => false,
		'playerId' => false,
	);
}

/**
 * Renders the Player block.
 *
 * @param array $attributes Array of block attributes.
 *
 * @return string
 */
function videoigniter_player_block_render_callback( $attributes ): string {
	$attributes = wp_parse_args( $attributes, videoigniter_player_block_defaults() );

	$unique_id  = $attributes['uniqueId'];
	$player_id  = $attributes['playerId'];
	$class_name = $attributes['className'];

	if ( empty( $player_id ) ) {
		return '<div class="videoigniter-block-placeholder">' . esc_html__( 'Select a playlist from the block settings.', 'videoigniter' ) . '</div>';
	}

	$block_id      = 'videoigniter-block-' . $unique_id;
	$block_classes = array_merge( array(
		'videoigniter-block',
		$block_id,
	), explode( ' ', $class_name ) );

	ob_start();

	?>
	<div id="<?php echo esc_attr( $block_id ); ?>" class="<?php echo esc_attr( implode( ' ', $block_classes ) ); ?>">
		<?php echo do_shortcode( sprintf( '[vi_playlist id="%s"]', esc_attr( $player_id ) ) ); ?>
	</div>
	<?php

	return ob_get_clean();
}

