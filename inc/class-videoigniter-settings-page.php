<?php
class VideoIgniter_Settings {
	protected $settings = false;

	public function __construct() {
		add_action( 'init', array( $this, 'init' ) );

		add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
		add_action( 'admin_init', array( $this, 'settings_init' ) );
	}

	public function init() {
		$this->settings = get_option( 'videoigniter_settings', array() );
		$this->settings = $this->validate_settings( $this->settings );
	}

	public function add_admin_menu() {
		add_submenu_page( 'edit.php?post_type=vi_playlist', esc_html__( 'VideoIgniter Settings', 'videoigniter' ), esc_html__( 'Settings', 'videoigniter' ), 'manage_options', 'vi_settings', array( $this, 'options_page' ) );
	}

	public function settings_sanitize( $settings ) {
		$new_settings = array();

		$new_settings['accent-color'] = isset( $settings['accent-color'] ) ? sanitize_hex_color( $settings['accent-color'] ) : '';
		$new_settings['branding-image-id'] = isset( $settings['branding-image-id'] ) ? VideoIgniter_Sanitizer::intval_or_empty( $settings['branding-image-id'] ) : '';
		// TODO sanitize
		$new_settings['branding-image-position'] = isset( $settings['branding-image-position'] ) ? $settings['branding-image-position'] : 'bottom-right';

		return $new_settings;
	}

	public function settings_init() {
		register_setting( 'videoigniter', 'videoigniter_settings', array( $this, 'settings_sanitize' ) );

		add_settings_section(
			'videoigniter_settings',
			__( 'VideoIgniter Settings', 'videoigniter' ),
			array( $this, 'settings_section_callback' ),
			'videoigniter'
		);

		add_settings_field(
			'videoigniter_accent_color',
			sprintf('%s <span>%s</span>', __('Accent color', 'videoigniter'), __('The primary color of the player', 'videoigniter')),
			array( $this, 'color_input_render' ),
			'videoigniter',
			'videoigniter_settings',
			array( 'id' => 'accent-color' )
		);

		add_settings_field(
			'videoigniter_branding_image_id',
			sprintf('%s <span>%s</span>', __('Branding Image', 'videoigniter'), __('Transparent .pngs of your logo work best', 'videoigniter')),
			array( $this, 'branding_image_render' ),
			'videoigniter',
			'videoigniter_settings',
			array( 'id' => 'branding-image-id' )
		);

		add_settings_field(
			'videoigniter_branding_image_position',
			sprintf('%s <span>%s</span>', __('Branding Image Position', 'videoigniter'), __('Position of the brand logo relative to the player', 'videoigniter')),
			array( $this, 'branding_image_position_render' ),
			'videoigniter',
			'videoigniter_settings',
			array( 'id' => 'branding-image-position', 'description' => 'hello' )
		);
	}

	public function settings_section_callback() {
		?>
		<h3><?php esc_html_e( 'Player Branding', 'videoigniter' ); ?></h3>
		<?php
	}

	public function color_input_render( $args ) {
		$id = $args['id'];
		?>
			<input
				id="videoigniter_settings-<?php echo esc_attr( $id ); ?>"
				type="text"
				name="videoigniter_settings[<?php echo esc_attr( $id ); ?>]"
				class="videoigniter-color-picker"
				value="<?php echo esc_attr( $this->settings[ $id ] ); ?>"
			>
		<?php
	}

	public function branding_image_render( $args ) {
		// TODO anastis: what is happening here?
		$id        = $args['id'];
		$image_id  = $this->settings[ $id ];
		// TODO anastis: simplif this.
		$image_src = $image_id ? wp_get_attachment_image_src( $image_id, 'full' )[0] : '';

		$field_classes = array( 'vi-settings-image-upload' );

		if ( ! empty( $image_id ) ) {
			$field_classes[] = 'vi-settings-image-upload-has-image';
		}

		$field_classes = implode( ' ', $field_classes );
		?>
			<div class="<?php echo esc_attr( $field_classes ); ?>">
				<div class="vi-settings-image-upload-placeholder">
					<img src="<?php echo $image_src; ?>" alt="">
					<a href="#" class="vi-settings-image-upload-dismiss">&times;</a>
				</div>

				<button type="button" class="button vi-settings-image-upload-button">
					<?php esc_html_e( 'Upload Image', 'videoigniter' ); ?>
				</button>
				<input
					id="videoigniter_settings-<?php echo esc_attr( $id ); ?>"
					type="hidden"
					name="videoigniter_settings[<?php echo esc_attr( $id ); ?>]"
					class="videoigniter-branding-image-id"
					value="<?php echo esc_attr( $image_id ); ?>"
				>
			</div>
		<?php
	}

	public function branding_image_position_render( $args ) {
		$id       = $args['id'];
		$selected = $this->settings[ $id ];
		// TODO anastis: Break this into a defaults function. Use it to sanitize branding-image-position
		$options  = array(
			'top-left'     => __( 'Top Left', 'videoigniter' ),
			'top-right'    => __( 'Top Right', 'videoigniter' ),
			'bottom-left'  => __( 'Bottom Left', 'videoigniter' ),
			'bottom-right' => __( 'Bottom Right', 'videoigniter' ),
		);
		?>
			<select
				id="videoigniter_settings-<?php echo esc_attr( $id ); ?>"
				name="videoigniter_settings[<?php echo esc_attr( $id ); ?>]"
				class="videoigniter-branding-image-position"
			>
				<?php foreach ( $options as $value => $label ) : ?>
					<option
						value="<?php echo esc_attr( $value ); ?>"
						<?php echo selected( $selected, $value, false ); ?>>
						<?php echo esc_html( $label ); ?>
					</option>
				<?php endforeach; ?>
			</select>
		<?php
	}

	public function options_page() {
		?>
		<div class="wrap">
			<div class="videoigniter-settings-container">
				<div class="videoigniter-settings-content">
					<div class="videoigniter-settings-header">
						<div class="videoigniter-settings-logo">
							<a href="https://www.cssigniter.com/plugins/videoigniter?utm_source=dashboard-settings&utm_medium=link&utm_content=videoigniter&utm_campaign=logo" target="_blank" class="videoigniter-settings-logo">
								<img
									src="<?php echo esc_url( VideoIgniter()->plugin_url() . 'assets/images/videoigniter-logo.svg' ); ?>"
									alt="<?php esc_attr_e( 'VideoIgniter Logo', 'videoigniter' ); ?>"
								>
							</a>
						</div>

						<div class="videoigniter-settings-upgrade-notice">
		<?php if ( apply_filters( 'videoigniter_metabox_tracks_show_upgrade_button', true ) ) : ?>
							<a class="vi-settings-button" href="https://www.cssigniter.com/plugins/videoigniter?utm_source=dashboard-settings&utm_medium=link&utm_content=videoigniter&utm_campaign=upgrade-pro" target="_blank">
								<?php esc_html_e( 'Upgrade to Pro', 'videoigniter' ); ?>
							</a>
			<?php endif; ?>
						</div>
					</div>

					<div class="videoigniter-settings-main">
						<form action="options.php" method="post" class="videoigniter-settings-form">
							<?php
								settings_fields( 'videoigniter' );
								do_settings_sections( 'videoigniter' );
								submit_button();
							?>
						</form>
					</div>

					<div class="videoigniter-settings-footer">
						<ul class="videoigniter-settings-nav">
							<?php
								$links = apply_filters( 'videoigniter_metabox_tracks_footer_links', array(
									'support'       => array(
										'title' => __( 'Support', 'videoigniter' ),
										'url'   => 'https://wordpress.org/support/plugin/videoigniter',
									),
									'documentation' => array(
										'title' => __( 'Documentation', 'videoigniter' ),
										'url'   => 'https://www.cssigniter.com/docs/videoigniter/',
									),
									'rate_plugin'   => array(
										'title' => __( 'Rate this plugin', 'videoigniter' ),
										'url'   => 'https://wordpress.org/support/view/plugin-reviews/videoigniter',
									),
								) );

								foreach ( $links as $link ) {
									if ( empty( $link['url'] ) || empty( $link['title'] ) ) {
										continue;
									}

									echo sprintf( '<li><a href="%s" target="_blank">%s</a></li>',
										esc_url( $link['url'] ),
										esc_html( $link['title'] )
									);
								}
							?>
						</ul>
					</div>
				</div>
			</div>
		</div>
		<?php
	}

	public function default_settings() {
		return array(
			'accent-color'            => '#ff0000',
			'branding-image-id'       => '',
			'branding-image-position' => 'bottom-right',
		);
	}

	public function get_settings() {
		return $this->validate_settings( $this->settings );
	}

	/**
	 * Makes sure there are no undefined indexes in the settings array.
	 * Use before using a setting value. Eliminates the need for isset() before using.
	 *
	 * @param $settings
	 *
	 * @return array
	 */
	public function validate_settings( $settings ) {
		$defaults = $this->default_settings();

		$settings = wp_parse_args( $settings, $defaults );

		return $settings;
	}
}
