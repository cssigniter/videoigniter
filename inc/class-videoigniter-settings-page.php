<?php
class VideoIgniter_Settings {
	protected $settings = false;

	public function __construct() {
		add_action( 'init', array( $this, 'init' ) );

		add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
		add_action( 'admin_init', array( $this, 'settings_init' ) );
	}

	public function init() {
		$this->settings = get_option( 'videoigniter_settings' );
		$this->settings = $this->validate_settings( $this->settings );
	}

	public function add_admin_menu() {
		add_submenu_page( 'edit.php?post_type=vi_playlist', esc_html__( 'VideoIgniter Settings', 'videoigniter' ), esc_html__( 'Settings', 'videoigniter' ), 'manage_options', 'vi_settings', array( $this, 'options_page' ) );
	}

	public function settings_sanitize( $settings ) {
		$new_settings = array();

		$new_settings['background-color'] = isset( $settings['background-color'] ) ? sanitize_hex_color( $settings['background-color'] ) : '';

		$new_settings['text-color'] = isset( $settings['text-color'] ) ? sanitize_hex_color( $settings['text-color'] ) : '';

		$new_settings['accent-color'] = isset( $settings['accent-color'] ) ? sanitize_hex_color( $settings['accent-color'] ) : '';

		return $new_settings;
	}

	public function settings_init() {
		register_setting( 'videoigniter', 'videoigniter_settings', array( $this, 'settings_sanitize' ) );

		add_settings_section(
			'videoigniter_settings_colors',
			__( 'VideoIgniter Settings', 'videoigniter' ),
			array( $this, 'settings_section_callback' ),
			'videoigniter'
		);

		add_settings_field(
			'videoigniter_bg_color',
			__( 'Background color', 'videoigniter' ),
			array( $this, 'color_input_render' ),
			'videoigniter',
			'videoigniter_settings_colors',
			array( 'id' => 'background-color' )
		);

		add_settings_field(
			'videoigniter_text_color',
			__( 'Text color', 'videoigniter' ),
			array( $this, 'color_input_render' ),
			'videoigniter',
			'videoigniter_settings_colors',
			array( 'id' => 'text-color' )
		);

		add_settings_field(
			'videoigniter_accent_color',
			__( 'Accent color', 'videoigniter' ),
			array( $this, 'color_input_render' ),
			'videoigniter',
			'videoigniter_settings_colors',
			array( 'id' => 'accent-color' )
		);
	}

	public function settings_section_callback() {
		?>
		<h2><?php esc_html_e( 'Colors', 'videoigniter' ); ?></h2>
		<p><?php esc_html_e( 'Modify the color scheme of the player.', 'videoigniter' ); ?></p>
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

	public function options_page() {
		?>
		<div class="wrap">
			<div class="videoigniter-settings-container">
				<div class="videoigniter-settings-content">
					<form action="options.php" method="post" class="videoigniter-settings-form">
					<?php
					settings_fields( 'videoigniter' );
					do_settings_sections( 'videoigniter' );
					submit_button();
					?>
					</form>
				</div>

			</div>
		</div>
		<?php
	}

	/**
	 * Makes sure there are no undefined indexes in the settings array.
	 * Use before using a setting value. Eleminates the need for isset() before using.
	 *
	 * @param $settings
	 *
	 * @return array
	 */
	public function validate_settings( $settings ) {
		$defaults = array(
			'background-color' => '#ffffff',
			'text-color'       => '#ffffff',
			'accent-color'     => '#ffffff',
		);

		$settings = wp_parse_args( $settings, $defaults );

		return $settings;
	}
}

new VideoIgniter_Settings();
