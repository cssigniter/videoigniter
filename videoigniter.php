<?php
/**
 * Plugin Name: VideoIgniter
 * Plugin URI: https://www.cssigniter.com/plugins/videoigniter/
 * Description: VideoIgniter lets you create video playlists and embed them in your WordPress posts, pages or custom post types and serve your video content in style!
 * Author: The CSSIgniter Team
 * Author URI: https://www.cssigniter.com
 * Version: 1.0.1
 * Requires at least: 6.4
 * Requires PHP: 7.0
 * Text Domain: videoigniter
 * Domain Path: languages
 * License: GPLv2 or later
 * License URI: http://www.gnu.org/licenses/gpl-2.0.html
 *
 * VideoIgniter is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * any later version.
 *
 * VideoIgniter Downloads is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with VideoIgniter. If not, see <http://www.gnu.org/licenses/>.
 *
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}


/**
 * VideoIgniter class.
 */
class VideoIgniter {

	/**
	 * VideoIgniter version.
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $version = null;

	/**
	 * Instance of this class.
	 *
	 * @var VideoIgniter
	 *
	 * @since 1.0.0
	 */
	protected static $instance = null;

	/**
	 * Sanitizer instance.
	 *
	 * @var VideoIgniter_Sanitizer
	 *
	 * @since 1.0.0
	 */
	public $sanitizer = null;

	/**
	 * Settings page instance.
	 *
	 * @var VideoIgniter_Settings
	 *
	 * @since 1.0.0
	 */
	public $settings_page = null;

	/**
	 * Playlist post type name.
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $post_type = 'vi_playlist';

	/**
	 * VideoIgniter Instance.
	 *
	 * Instantiates or reuses an instance of VideoIgniter.
	 *
	 * @see VideoIgniter()
	 *
	 * @since 1.0.0
	 *
	 * @return VideoIgniter - Single instance.
	 */
	public static function instance(): VideoIgniter {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * VideoIgniter constructor. Intentionally left empty so that instances can be created without
	 * re-loading of resources (e.g. scripts/styles), or re-registering hooks.
	 * http://wordpress.stackexchange.com/questions/70055/best-way-to-initiate-a-class-in-a-wp-plugin
	 * https://gist.github.com/toscho/3804204
	 *
	 * @since 1.0.0
	 */
	public function __construct() {}

	/**
	 * Kickstarts plugin loading.
	 *
	 * @since 1.0.0
	 */
	public function plugin_setup() {
		if ( is_null( $this->version ) ) {
			if ( ! function_exists( 'get_plugin_data' ) ) {
				include_once ABSPATH . 'wp-admin/includes/plugin.php';
			}
			$plugin_data = get_plugin_data( __FILE__ );

			$this->version = $plugin_data['Version'];
		}

		load_plugin_textdomain( 'videoigniter', false, dirname( self::plugin_basename() ) . '/languages' );

		require_once untrailingslashit( $this->plugin_path() ) . '/inc/class-videoigniter-sanitizer.php';
		$this->sanitizer = new VideoIgniter_Sanitizer();

		// Initializations needed in every request.
		$this->init();

		// Initializations needed in admin requests.
		$this->admin_init();

		// Initializations needed in frontend requests.
		$this->frontend_init();

		do_action( 'videoigniter_loaded' );
	}

	/**
	 * Registers actions that need to be run on both admin and frontend
	 *
	 * @since 1.0.0
	 */
	protected function init() {
		add_action( 'init', array( $this, 'register_post_types' ) );
		add_action( 'init', array( $this, 'register_scripts' ) );
		add_action( 'init', array( $this, 'register_image_sizes' ) );
		add_action( 'init', array( $this, 'register_shortcodes' ) );
		add_action( 'widgets_init', array( $this, 'register_widgets' ) );

		require_once untrailingslashit( $this->plugin_path() ) . '/inc/class-videoigniter-settings-page.php';
		$this->settings_page = new VideoIgniter_Settings();

		require_once 'block/block.php';

		do_action( 'videoigniter_init' );
	}

	/**
	 * Registers actions that need to be run on admin only.
	 *
	 * @since 1.0.0
	 */
	protected function admin_init() {
		if ( ! is_admin() ) {
			return;
		}

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
		add_action( 'add_meta_boxes', array( $this, 'add_meta_boxes' ) );
		add_action( 'save_post', array( $this, 'save_post' ) );

		add_filter( "manage_{$this->post_type}_posts_columns", array( $this, 'filter_posts_columns' ) );
		add_action( "manage_{$this->post_type}_posts_custom_column", array( $this, 'add_custom_columns' ), 10, 2 );

		add_filter( 'block_categories_all', array( $this, 'block_categories' ), 10, 2 );

		add_filter( 'wp_check_filetype_and_ext', array( $this, 'register_file_extensions' ), 10, 5 );
		add_filter( 'upload_mimes', array( $this, 'register_mime_times' ) );

		add_action( 'enqueue_block_assets', array( $this, 'enqueue_editor_assets' ) );

		do_action( 'videoigniter_admin_init' );
	}

	/**
	 * Registers actions that need to be run on frontend only.
	 *
	 * @since 1.0.0
	 */
	protected function frontend_init() {
		if ( is_admin() ) {
			return;
		}

		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

		do_action( 'videoigniter_frontend_init' );
	}

	/**
	 * Returns the filename suffix to be used when enqueuing scripts and styles.
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	private function scripts_styles_suffix() {
		$suffix = '.min';

		if ( ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ) {
			$suffix = '';
		}

		/**
		 * Filters the filename suffix used for scripts and styles.
		 *
		 * @since 1.0.0
		 *
		 * @param string $suffix
		 */
		return apply_filters( 'videoigniter_scripts_styles_suffix', $suffix );
	}

	/**
	 * Register (but not enqueue) all scripts and styles to be used throughout the plugin.
	 *
	 * @since 1.0.0
	 */
	public function register_scripts() {
		$suffix = $this->scripts_styles_suffix();

		wp_register_style( 'videojs', untrailingslashit( $this->plugin_url() ) . "/assets/css/vendor/video-js{$suffix}.css", array(), $this->version );
		wp_register_style( 'videoigniter', untrailingslashit( $this->plugin_url() ) . "/assets/css/style{$suffix}.css", array( 'videojs' ), $this->version );

		wp_register_script( 'videojs', untrailingslashit( $this->plugin_url() ) . "/assets/js/vendor/video.core{$suffix}.js", array(), $this->version, true );
		wp_register_script( 'videojs-http-streaming', untrailingslashit( $this->plugin_url() ) . "/assets/js/vendor/videojs-http-streaming{$suffix}.js", array( 'videojs' ), $this->version, true );
		wp_register_script( 'videojs-playlist', untrailingslashit( $this->plugin_url() ) . "/assets/js/vendor/videojs-playlist{$suffix}.js", array( 'videojs' ), $this->version, true );
		wp_register_script( 'videojs-playlist-ui', untrailingslashit( $this->plugin_url() ) . "/assets/js/vendor/videojs-playlist-ui{$suffix}.js", array( 'videojs' ), $this->version, true );
		wp_register_script( 'videojs-vimeo', untrailingslashit( $this->plugin_url() ) . "/assets/js/vendor/videojs-vimeo{$suffix}.js", array( 'videojs' ), $this->version, true );
		wp_register_script( 'videojs-youtube', untrailingslashit( $this->plugin_url() ) . "/assets/js/vendor/videojs-youtube{$suffix}.js", array( 'videojs' ), $this->version, true );
		wp_register_script( 'videojs-chapters', untrailingslashit( $this->plugin_url() ) . "/assets/js/chapters{$suffix}.js", array( 'videojs' ), $this->version, true );
		wp_register_script( 'videojs-overlays', untrailingslashit( $this->plugin_url() ) . "/assets/js/overlays{$suffix}.js", array( 'videojs' ), $this->version, true );
		wp_register_script( 'videoigniter', untrailingslashit( $this->plugin_url() ) . "/assets/js/scripts{$suffix}.js", array(
			// Additional dependencies are being added dynamically via $this->add_videoigniter_script_dependencies()
			'videojs',
		), $this->version, true );

		wp_register_style( 'videoigniter-admin', untrailingslashit( $this->plugin_url() ) . "/assets/css/admin/admin-styles{$suffix}.css", array(), $this->version );
		wp_register_script( 'videoigniter-admin', untrailingslashit( $this->plugin_url() ) . "/assets/js/admin/videoigniter{$suffix}.js", array(), $this->version, true );

		wp_localize_script( 'videoigniter-admin', 'vi_scripts', array(
			'messages' => array(
				'confirm_clear_tracks'     => esc_html__( 'Do you really want to remove all videos? (This will not delete your video files).', 'videoigniter' ),
				'media_title_upload'       => esc_html__( 'Select or upload video media', 'videoigniter' ),
				'media_title_upload_cover' => esc_html__( 'Select a poster image', 'videoigniter' ),
				'media_title_upload_file'  => esc_html__( 'Select a file', 'videoigniter' ),
			),
		) );

		wp_register_style( 'videoigniter-admin-settings', untrailingslashit( $this->plugin_url() ) . "/assets/css/admin/settings{$suffix}.css", array(), $this->version );
		wp_register_script( 'videoigniter-admin-settings', untrailingslashit( $this->plugin_url() ) . "/assets/js/admin/settings{$suffix}.js", array(
			'wp-color-picker',
		), $this->version, true );
		wp_localize_script( 'videoigniter-admin-settings', 'vi_admin_settings', array(
			'messages' => array(
				'media_modal_title' => esc_html__( 'Choose image', 'videoigniter' ),
			),
		) );

		wp_register_script( 'videoigniter-block-editor', untrailingslashit( $this->plugin_url() ) . '/block/build/block.js', array(
			'wp-components',
			'wp-blocks',
			'wp-element',
			'wp-block-editor',
			'wp-data',
			'wp-date',
			'wp-i18n',
			'wp-compose',
			'wp-keycodes',
			'wp-html-entities',
			'wp-server-side-render',
			'videojs-http-streaming',
			'videojs-playlist',
			'videojs-playlist-ui',
			'videojs-vimeo',
			'videojs-youtube',
			'videojs-chapters',
			'videojs-overlays',
			'videoigniter',
		), $this->version, true );

		wp_register_style( 'videoigniter-block-editor', $this->plugin_url() . 'block/build/block.css', array(
			'wp-edit-blocks',
			'videoigniter',
		), $this->version );
	}

	/**
	 * Enqueues frontend scripts and styles.
	 *
	 * @since 1.0.0
	 */
	public function enqueue_scripts() {
		wp_enqueue_style( 'videoigniter' );

		$settings = $this->settings_page->get_settings();
		if ( ! empty( $settings['accent-color'] ) ) {
			wp_add_inline_style( 'videoigniter', sprintf( '.vi-player-wrap { --vi-player-color-primary: %s; }', $settings['accent-color'] ) );
		}

		wp_enqueue_script( 'videoigniter' );
	}

	/**
	 * Appends script dependencies on the 'videoigniter' script according to a playlist's requirements.
	 *
	 * Dependencies must only be added, as different playlists may have different requirements on the same page.
	 *
	 * @param int $post_id Post/playlist ID.
	 *
	 * @since 1.0.0
	 */
	public function add_videoigniter_script_dependencies( int $post_id ) {
		$videoigniter = wp_scripts()->registered['videoigniter'];

		if ( ! $this->is_playlist( $post_id ) ) {
			return;
		}

		$tracks = $this->get_post_meta( $post_id, '_videoigniter_tracks', array() );
		if ( empty( $tracks ) ) {
			$tracks = array();
		}

		if ( count( $tracks ) > 1 ) {
			$videoigniter->deps[] = 'videojs-playlist';
			$videoigniter->deps[] = 'videojs-playlist-ui';
		}

		foreach ( $tracks as $track ) {
			$track     = wp_parse_args( $track, self::get_default_track_values() );
			$track_url = $track['track_url'];

			if ( $this->is_youtube( $track_url ) ) {
				$videoigniter->deps[] = 'videojs-youtube';
			}

			if ( $this->is_vimeo( $track_url ) ) {
				$videoigniter->deps[] = 'videojs-vimeo';
			}

			if ( $this->is_streaming( $track_url ) ) {
				$videoigniter->deps[] = 'videojs-http-streaming';
			}

			// Do not output any subtitles, chapters, or overlays, as they're controlled by Pro and may appear messed up without it.
			if ( class_exists( 'VideoIgniter_Pro' ) ) {
				if ( ! empty( $track['chapters_url'] ) ) {
					$videoigniter->deps[] = 'videojs-chapters';
				}

				if ( ! empty( $track['overlays'] ) ) {
					$videoigniter->deps[] = 'videojs-overlays';
				}
			}
		}

		$videoigniter->deps = array_unique( $videoigniter->deps );
	}

	/**
	 * Enqueues admin scripts and styles.
	 *
	 * @since 1.0.0
	 *
	 * @param string $hook The current admin page.
	 */
	public function enqueue_admin_scripts( $hook ) {
		$screen = get_current_screen();
		if ( is_null( $screen ) ) {
			return;
		}

		if ( 'post' === $screen->base && $screen->post_type === $this->post_type ) {
			wp_enqueue_media();
			wp_enqueue_style( 'videoigniter-admin' );
			wp_enqueue_script( 'videoigniter-admin' );
		}

		if ( 'vi_playlist_page_vi_settings' === $hook ) {
			wp_enqueue_style( 'wp-color-picker' );
			wp_enqueue_media();
			wp_enqueue_style( 'videoigniter-admin-settings' );
			wp_enqueue_script( 'videoigniter-admin-settings' );
		}
	}

	/**
	 * Enqueues editor scripts and styles.
	 *
	 * @since 1.0.0
	 */
	public function enqueue_editor_assets() {
		if ( ! is_admin() ) {
			return;
		}

		wp_enqueue_script( 'videoigniter-block-editor' );
		wp_enqueue_style( 'videoigniter-block-editor' );
	}

	/**
	 * Register VideoIgniter's block category
	 *
	 * @since 1.0.0
	 *
	 * @param array[] $block_categories Array of categories for block types.
	 *
	 * @return array
	 */
	public function block_categories( $block_categories ): array {
		return array_merge( $block_categories, array(
			array(
				'slug'  => 'videoigniter',
				'title' => __( 'VideoIgniter', 'videoigniter' ),
			),
		) );
	}

	/**
	 * Post types registration.
	 *
	 * @since 1.0.0
	 */
	public function register_post_types() {
		$labels = array(
			'name'               => esc_html_x( 'Playlists', 'post type general name', 'videoigniter' ),
			'singular_name'      => esc_html_x( 'Playlist', 'post type singular name', 'videoigniter' ),
			'menu_name'          => esc_html_x( 'VideoIgniter', 'admin menu', 'videoigniter' ),
			'all_items'          => esc_html_x( 'All Playlists', 'admin menu', 'videoigniter' ),
			'name_admin_bar'     => esc_html_x( 'Playlist', 'add new on admin bar', 'videoigniter' ),
			'add_new'            => esc_html__( 'Add New Playlist', 'videoigniter' ),
			'add_new_item'       => esc_html__( 'Add New Playlist', 'videoigniter' ),
			'edit_item'          => esc_html__( 'Edit Playlist', 'videoigniter' ),
			'new_item'           => esc_html__( 'New Playlist', 'videoigniter' ),
			'view_item'          => esc_html__( 'View Playlist', 'videoigniter' ),
			'search_items'       => esc_html__( 'Search Playlists', 'videoigniter' ),
			'not_found'          => esc_html__( 'No playlists found', 'videoigniter' ),
			'not_found_in_trash' => esc_html__( 'No playlists found in the trash', 'videoigniter' ),
		);

		$args = array(
			'labels'          => $labels,
			'singular_label'  => esc_html_x( 'Playlist', 'post type singular name', 'videoigniter' ),
			'public'          => false,
			'show_ui'         => true,
			'capability_type' => 'post',
			'hierarchical'    => false,
			'has_archive'     => false,
			'show_in_rest'    => true,
			'supports'        => array( 'title' ),
			'menu_icon'       => 'dashicons-video-alt3',
		);

		register_post_type( $this->post_type, $args );
	}


	/**
	 * Registers metaboxes for the vi_playlist post type.
	 *
	 * @since 1.0.0
	 */
	public function add_meta_boxes() {
		add_meta_box( 'vi-meta-box-tracks', esc_html__( 'Videos', 'videoigniter' ), array( $this, 'metabox_tracks' ), $this->post_type, 'normal', 'high' );
		add_meta_box( 'vi-meta-box-settings', esc_html__( 'Settings', 'videoigniter' ), array( $this, 'metabox_settings' ), $this->post_type, 'normal', 'high' );
		add_meta_box( 'vi-meta-box-shortcode', esc_html__( 'Shortcode', 'videoigniter' ), array( $this, 'metabox_shortcode' ), $this->post_type, 'side', 'default' );
	}

	/**
	 * Echoes the Tracks metabox markup.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_Post $object Post object.
	 * @param array   $box    Metabox args.
	 */
	public function metabox_tracks( $object, $box ) {
		$tracks = $this->get_post_meta( $object->ID, '_videoigniter_tracks', array() );

		wp_nonce_field( basename( __FILE__ ), $object->post_type . '_nonce' );

		$this->metabox_tracks_header();
		?>
		<div class="vi-container">
			<?php $this->metabox_tracks_field_controls( 'top', $object->ID ); ?>

			<?php $container_classes = apply_filters( 'videoigniter_metabox_tracks_container_classes', array( 'vi-fields-container' ) ); ?>

			<div class="<?php echo esc_attr( implode( ' ', $container_classes ) ); ?>">
				<?php
				if ( ! empty( $tracks ) ) {
					foreach ( $tracks as $track ) {
						$this->metabox_tracks_repeatable_track_field( $track );
					}
				} else {
					$this->metabox_tracks_repeatable_track_field();
				}
				?>
			</div>

			<?php $this->metabox_tracks_field_controls( 'bottom', $object->ID ); ?>
		</div>
		<?php
		$this->metabox_tracks_footer();
	}

	/**
	 * Echoes the Tracks metabox header.
	 *
	 * @since 1.0.0
	 */
	protected function metabox_tracks_header() {
		?>
		<div class="vi-header vi-brand-module">
			<a href="https://www.cssigniter.com/plugins/videoigniter?utm_source=dashboard&utm_medium=link&utm_content=videoigniter&utm_campaign=logo" target="_blank" class="vi-logo">
				<img
					src="<?php echo esc_url( $this->plugin_url() . 'assets/images/videoigniter-logo.svg' ); ?>"
					alt="<?php esc_attr_e( 'VideoIgniter Logo', 'videoigniter' ); ?>"
				>
			</a>

			<?php if ( apply_filters( 'videoigniter_metabox_tracks_show_upgrade_button', true ) ) : ?>
				<div class="vi-brand-module-actions">
					<a href="https://www.cssigniter.com/plugins/videoigniter?utm_source=dashboard&utm_medium=link&utm_content=videoigniter&utm_campaign=upgrade-pro" class="vi-btn vi-btn-green" target="_blank">
						<?php esc_html_e( 'Upgrade to Pro', 'videoigniter' ); ?>
					</a>
				</div>
			<?php endif; ?>
		</div>
		<?php
	}

	/**
	 * Echoes the Tracks metabox footer.
	 *
	 * @since 1.0.0
	 */
	protected function metabox_tracks_footer() {
		do_action( 'videoigniter_metabox_tracks_field_footer_before' );
		?>
		<div class="vi-footer vi-brand-module">
			<div class="vi-row">
				<div class="vi-col-left">
					<ul class="vi-list-inline vi-footer-links">
						<?php
						$links = apply_filters( 'videoigniter_metabox_tracks_footer_links', array(
							// TODO: Change support link when free is published in wp.org
							'support'       => array(
								'title' => __( 'Support', 'videoigniter' ),
								'url'   => 'https://www.cssigniter.com/support-hub/',
							),
							'documentation' => array(
								'title' => __( 'Documentation', 'videoigniter' ),
								'url'   => 'https://www.cssigniter.com/docs/videoigniter/',
							),
// TODO: Enable rating link when free is published in wp.org
//							'rate_plugin'   => array(
//								'title' => __( 'Rate this plugin', 'videoigniter' ),
//								'url'   => 'https://wordpress.org/support/view/plugin-reviews/videoigniter',
//							),
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

				<div class="vi-col-right">
					<?php
						$url = 'https://www.cssigniter.com/plugins/videoigniter?utm_source=dashboard&utm_medium=link&utm_content=videoigniter&utm_campaign=footer-link';
						/* translators: %s is a URL. */
						$copy = sprintf( __( 'Thank you for creating with <a href="%s" target="_blank">VideoIgniter</a>', 'videoigniter' ),
							esc_url( $url )
						);
					?>
					<div class="vi-brand-module-actions">
						<p class="vi-note"><?php echo wp_kses( $copy, array( 'a' => array( 'href' => true, 'target' => true ) ) ); ?></p>
					</div>
				</div>
			</div>
		</div>
		<?php
		do_action( 'videoigniter_metabox_tracks_field_footer_after' );
	}

	/**
	 * Generates the repeatable track's metabox field markup.
	 *
	 * @since 1.0.0
	 *
	 * @param array $track Single track array.
	 */
	protected function metabox_tracks_repeatable_track_field( $track = array() ) {
		$track = wp_parse_args( $track, self::get_default_track_values() );

		$title       = $track['title'];
		$description = $track['description'];
		$track_url   = $track['track_url'];
		$cover_id    = $track['cover_id'];

		$cover_url  = (string) wp_get_attachment_image_url( (int) $cover_id, 'thumbnail' );
		$cover_data = $cover_url ? wp_prepare_attachment_for_js( (int) $cover_id ) : '';

		$uid = uniqid();

		$field_classes = apply_filters( 'videoigniter_metabox_track_classes', array( 'vi-field-repeatable' ), $track_url );
		?>
		<div class="<?php echo esc_attr( implode( ' ', $field_classes ) ); ?>" data-uid="<?php echo esc_attr( $uid ); ?>">
			<div class="vi-field-head">

				<?php do_action( 'videoigniter_metabox_tracks_repeatable_track_field_before_title' ); ?>

				<span class="vi-field-title"><?php echo wp_kses( $title, array() ); ?></span>

				<button type="button" class="vi-field-toggle button-link">
					<span class="screen-reader-text">
						<?php esc_html_e( 'Toggle track visibility', 'videoigniter' ); ?>
					</span>
					<span class="toggle-indicator"></span>
				</button>
			</div>

			<div class="vi-field-container">
				<?php do_action( 'videoigniter_metabox_tracks_repeatable_track_fields_before', $track, $uid ); ?>

				<div class="vi-field-track-fields">
					<?php do_action( 'videoigniter_metabox_tracks_repeatable_track_fields_start', $track, $uid ); ?>

					<vi-image-field>
						<div class="vi-field-image">
							<a href="#" class="vi-field-image-upload">
								<span class="vi-field-image-upload-dismiss">
									<span class="screen-reader-text">
										<?php esc_html_e( 'Remove Cover Image', 'videoigniter' ); ?>
									</span>
									<span class="dashicons dashicons-no-alt"></span>
								</span>

								<?php if ( ! empty( $cover_url ) ) : ?>
									<img src="<?php echo esc_url( $cover_url ); ?>" alt="<?php echo esc_attr( $cover_data['alt'] ); ?>">
								<?php else : ?>
									<img src="#" alt="">
								<?php endif; ?>

								<div class="vi-field-image-placeholder">
									<span class="vi-field-image-placeholder-label">
										<?php esc_html_e( 'Upload Poster', 'videoigniter' ); ?>
									</span>
								</div>
							</a>

							<input
								type="hidden"
								id="vi_playlist_tracks-<?php echo esc_attr( $uid ); ?>-cover_id"
								name="vi_playlist_tracks[<?php echo esc_attr( $uid ); ?>][cover_id]"
								value="<?php echo esc_attr( $cover_id ); ?>"
							/>
						</div>
					</vi-image-field>

					<div class="vi-field-split">
						<div class="vi-form-field">
							<label
								for="vi_playlist_tracks-<?php echo esc_attr( $uid ); ?>-title"
								class="screen-reader-text">
								<?php esc_html_e( 'Title', 'videoigniter' ); ?>
							</label>
							<input
								type="text"
								id="vi_playlist_tracks-<?php echo esc_attr( $uid ); ?>-title"
								class="vi-track-title"
								name="vi_playlist_tracks[<?php echo esc_attr( $uid ); ?>][title]"
								placeholder="<?php esc_attr_e( 'Title', 'videoigniter' ); ?>"
								value="<?php echo esc_attr( $title ); ?>"
							/>
						</div>
						<div class="vi-form-field">
							<label
								for="vi_playlist_tracks-<?php echo esc_attr( $uid ); ?>-description"
								class="screen-reader-text">
								<?php esc_html_e( 'Description', 'videoigniter' ); ?>
							</label>
							<textarea
								id="vi_playlist_tracks-<?php echo esc_attr( $uid ); ?>-description"
								class="vi-track-description"
								name="vi_playlist_tracks[<?php echo esc_attr( $uid ); ?>][description]"
								placeholder="<?php esc_attr_e( 'Description', 'videoigniter' ); ?>"
							><?php echo esc_attr( $description ); ?></textarea>
						</div>

						<?php do_action( 'videoigniter_metabox_tracks_repeatable_track_fields_column_1', $track, $uid ); ?>
					</div>

					<div class="vi-field-split">
						<div class="vi-form-field">
							<label
								for="vi_playlist_tracks-<?php echo esc_attr( $uid ); ?>-track_url"
								class="screen-reader-text">
								<?php esc_html_e( 'Video file or stream', 'videoigniter' ); ?>
							</label>

							<div class="vi-form-field-addon">
								<input
									type="text"
									id="vi_playlist_tracks-<?php echo esc_attr( $uid ); ?>-track_url"
									class="vi-track-url"
									name="vi_playlist_tracks[<?php echo esc_attr( $uid ); ?>][track_url]"
									placeholder="<?php esc_attr_e( 'Video file or stream', 'videoigniter' ); ?>"
									value="<?php echo esc_url( $track_url ); ?>"
								/>
								<button type="button" class="button vi-track-url-upload">
									<?php esc_html_e( 'Upload', 'videoigniter' ); ?>
								</button>

								<?php do_action( 'videoigniter_metabox_tracks_repeatable_track_field_after_track_upload_button' ); ?>
							</div>
						</div>

						<?php do_action( 'videoigniter_metabox_tracks_repeatable_track_fields_column_2', $track, $uid ); ?>
					</div>

					<?php do_action( 'videoigniter_metabox_tracks_repeatable_track_fields_end', $track, $uid ); ?>
				</div>

				<button type="button" class="button vi-remove-field">
					<span class="dashicons dashicons-dismiss"></span>
					<?php esc_html_e( 'Remove Video', 'videoigniter' ); ?>
				</button>

				<?php do_action( 'videoigniter_metabox_tracks_repeatable_track_fields_after', $track, $uid ); ?>
			</div>
		</div>
		<?php
	}

	/**
	 * Generates the tracks field controls markup.
	 *
	 * @since 1.0.0
	 *
	 * @param string $location Location of controls. May be 'top' or 'bottom'.
	 * @param int    $post_id  Post ID of the current post.
	 */
	protected function metabox_tracks_field_controls( $location, $post_id ) {
		?>
		<div class="vi-field-controls-wrap">
			<div class="vi-field-controls">
				<button type="button" class="button vi-add-field vi-add-field-<?php echo esc_attr( $location ); ?>">
					<span class="dashicons dashicons-plus-alt"></span>
					<?php esc_html_e( 'Add Video', 'videoigniter' ); ?>
				</button>

				<?php do_action( 'videoigniter_metabox_tracks_field_controls', $location, $post_id ); ?>

				<button type="button" class="button vi-remove-all-fields">
					<span class="dashicons dashicons-dismiss"></span>
					<?php esc_html_e( 'Clear Playlist', 'videoigniter' ); ?>
				</button>
			</div>

			<div class="vi-field-controls-visibility">
				<a href="#" class="vi-fields-expand-all">
					<?php esc_html_e( 'Expand All', 'videoigniter' ); ?>
				</a>
				<a href="#" class="vi-fields-collapse-all">
					<?php esc_html_e( 'Collapse All', 'videoigniter' ); ?>
				</a>
			</div>
		</div>
		<?php
	}

	/**
	 * Generates the Settings metabox markup.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_Post $object Post object.
	 * @param array   $box    Metabox args.
	 */
	public function metabox_settings( $object, $box ) {
		$layout                 = $this->get_post_meta( $object->ID, '_videoigniter_playlist_layout', 'right' );
		$show_fullscreen_toggle = $this->get_post_meta( $object->ID, '_videoigniter_show_fullscreen_toggle', 1 );
		$show_playback_speed    = $this->get_post_meta( $object->ID, '_videoigniter_show_playback_speed', 0 );
		$volume                 = $this->get_post_meta( $object->ID, '_videoigniter_volume', 100 );

		wp_nonce_field( basename( __FILE__ ), $object->post_type . '_nonce' );
		?>
		<div class="vi-module vi-module-settings">
			<h3 class="vi-form-field-group-title"><?php esc_html_e( 'Player &amp; Video listing', 'videoigniter' ); ?></h3>

			<div class="vi-form-field">
				<div class="vi-playlist-layout-message vi-info-box"></div>
				<label for="_videoigniter_playlist_layout">
					<?php esc_html_e( 'Playlist layout', 'videoigniter' ); ?>
				</label>

				<select
					class="widefat vi-form-select-playlist-layout"
					id="_videoigniter_playlist_layout"
					name="_videoigniter_playlist_layout"
				>
					<?php foreach ( $this->get_playlist_layouts() as $player_key => $playlist_layout ) : ?>
						<option
							value="<?php echo esc_attr( $player_key ); ?>"
							data-no-support="<?php echo esc_attr( implode( ', ', $playlist_layout['no-support'] ) ); ?>"
							data-info="<?php echo esc_attr( $playlist_layout['info'] ); ?>"
							<?php selected( $layout, $player_key ); ?>
						>
							<?php echo wp_kses( $playlist_layout['label'], 'strip' ); ?>
						</option>
					<?php endforeach; ?>
				</select>
			</div>

			<div class="vi-form-field">
				<input
					type="checkbox"
					class="vi-checkbox"
					id="_videoigniter_show_fullscreen_toggle"
					name="_videoigniter_show_fullscreen_toggle"
					value="1" <?php checked( $show_fullscreen_toggle, true ); ?>
				/>

				<label for="_videoigniter_show_fullscreen_toggle">
					<?php esc_html_e( 'Show fullscreen toggle', 'videoigniter' ); ?>
				</label>
			</div>

			<div class="vi-form-field">
				<input
					type="checkbox"
					class="vi-checkbox"
					id="_videoigniter_show_playback_speed"
					name="_videoigniter_show_playback_speed"
					value="1" <?php checked( $show_playback_speed, true ); ?>
				/>

				<label for="_videoigniter_show_playback_speed">
					<?php esc_html_e( 'Show playback speed controls', 'videoigniter' ); ?>
				</label>
			</div>

			<div class="vi-form-field">
				<label for="_videoigniter_volume">
					<?php esc_html_e( 'Starting volume', 'videoigniter' ); ?>
				</label>

				<input
					type="number"
					min="0"
					max="100"
					step="10"
					id="_videoigniter_volume"
					class="vi-input"
					name="_videoigniter_volume"
					placeholder="<?php esc_attr_e( '0-100', 'videoigniter' ); ?>"
					value="<?php echo esc_attr( $volume ); ?>"
				/>

				<p class="vi-field-help">
					<?php esc_html_e( 'Enter a value between 0 and 100 in increments of 10.', 'videoigniter' ); ?>
				</p>
			</div>

			<?php do_action( 'videoigniter_metabox_settings_group_player_track_listing_fields', $object, $box ); ?>
		</div>
		<?php
	}

	/**
	 * Generates the Shortcode metabox markup.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_Post $object Post object.
	 * @param array   $box    Metabox args.
	 */
	public function metabox_shortcode( $object, $box ) {
		?>
		<div class="vi-module vi-module-shortcode">
			<div class="vi-form-field">
				<label for="vi_shortcode">
					<?php esc_html_e( 'Grab the shortcode', 'videoigniter' ); ?>
				</label>

				<input
					type="text"
					class="code"
					id="vi_shortcode"
					name="vi_shortcode"
					value="<?php echo esc_attr( sprintf( '[vi_playlist id="%s"]', $object->ID ) ); ?>"
				/>

			</div>
		</div>
		<?php
	}

	/**
	 * Returns the available playlist layouts and their associated information.
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_playlist_layouts() {
		// Each playlist layout has a number of settings that it might not support.
		// Provide every setting that's not supported based on the `name` attribute of each setting input
		// (input, select, textarea), *without the _videoigniter_ prefix* in the `no-support` array.
		// To allow support for every setting simply set `no-support` to an empty array.

		$playlist_layouts = array(
			'right'  => array(
				'label'      => __( 'Right', 'videoigniter' ),
				'no-support' => array(),
				'info'       => '',
			),
			'left'   => array(
				'label'      => __( 'Left', 'videoigniter' ),
				'no-support' => array(),
				'info'       => '',
			),
			'bottom' => array(
				'label'      => __( 'Bottom', 'videoigniter' ),
				'no-support' => array(),
				'info'       => '',
			),
		);

		return apply_filters( 'videoigniter_playlist_layouts', $playlist_layouts );
	}

	/**
	 * Returns the available playlist skip options
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_playlist_skip_options(): array {
		$skip_options = array(
			'0'  => array(
				'label' => __( 'Disabled', 'videoigniter' ),
				'info'  => '',
			),
			'5'  => array(
				'label' => __( '5 seconds', 'videoigniter' ),
				'info'  => '',
			),
			'10' => array(
				'label' => __( '10 seconds', 'videoigniter' ),
				'info'  => '',
			),
			'30' => array(
				'label' => __( '30 seconds', 'videoigniter' ),
				'info'  => '',
			),
		);

		return apply_filters( 'videoigniter_playlist_skip_options', $skip_options );
	}

	/**
	 * Returns the available overlay positions
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public static function get_track_overlay_positions(): array {
		$overlay_positions = array(
			'top-left'      => array(
				'label' => __( 'Top left', 'videoigniter' ),
				'info'  => '',
			),
			'top-center'    => array(
				'label' => __( 'Top center', 'videoigniter' ),
				'info'  => '',
			),
			'top-right'     => array(
				'label' => __( 'Top right', 'videoigniter' ),
				'info'  => '',
			),
			'middle-left'   => array(
				'label' => __( 'Middle left', 'videoigniter' ),
				'info'  => '',
			),
			'middle-center' => array(
				'label' => __( 'Middle center', 'videoigniter' ),
				'info'  => '',
			),
			'middle-right'  => array(
				'label' => __( 'Middle right', 'videoigniter' ),
				'info'  => '',
			),
			'bottom-left'   => array(
				'label' => __( 'Bottom left', 'videoigniter' ),
				'info'  => '',
			),
			'bottom-center' => array(
				'label' => __( 'Bottom center', 'videoigniter' ),
				'info'  => '',
			),
			'bottom-right'  => array(
				'label' => __( 'Bottom Right', 'videoigniter' ),
				'info'  => '',
			),
		);

		return apply_filters( 'videoigniter_track_overlay_positions', $overlay_positions );
	}

	/**
	 * Saves the current post's meta into the database.
	 *
	 * @since 1.0.0
	 *
	 * @param int $post_id Post ID of the post being saved.
	 *
	 * @return false|void
	 */
	public function save_post( $post_id ) {
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) { return false; }
		if ( isset( $_POST['post_view'] ) && 'list' === $_POST['post_view'] ) { return false; }
		if ( ! isset( $_POST['post_type'] ) || $_POST['post_type'] !== $this->post_type ) { return false; }
		if ( ! isset( $_POST[ $this->post_type . '_nonce' ] ) || ! wp_verify_nonce( $_POST[ $this->post_type . '_nonce' ], basename( __FILE__ ) ) ) { return false; }
		$post_type_obj = get_post_type_object( $this->post_type );
		if ( ! current_user_can( $post_type_obj->cap->edit_post, $post_id ) ) { return false; }


		// phpcs:disable WordPress.Security.ValidatedSanitizedInput
		if ( isset( $_POST['vi_playlist_tracks'] ) ) {
			update_post_meta( $post_id, '_videoigniter_tracks', $this->sanitizer::metabox_playlist( $_POST['vi_playlist_tracks'], $post_id ) );
		}

		if ( isset( $_POST['_videoigniter_playlist_layout'] ) ) {
			update_post_meta( $post_id, '_videoigniter_playlist_layout', $this->sanitizer::playlist_layout( $_POST['_videoigniter_playlist_layout'] ) );
		}

		if ( isset( $_POST['_videoigniter_volume'] ) ) {
			update_post_meta( $post_id, '_videoigniter_volume', (int) $_POST['_videoigniter_volume'] );
		}

		update_post_meta( $post_id, '_videoigniter_show_fullscreen_toggle', isset( $_POST['_videoigniter_show_fullscreen_toggle'] ) );
		update_post_meta( $post_id, '_videoigniter_show_playback_speed', isset( $_POST['_videoigniter_show_playback_speed'] ) );
		// phpcs:enable


		do_action( 'videoigniter_save_post', $post_id );
	}

	/**
	 * Returns the default values for a track.
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public static function get_default_track_values(): array {
		return apply_filters( 'videoigniter_default_track_values', array(
			'cover_id'    => '',
			'title'       => '',
			'description' => '',
			'track_url'   => '',
		) );
	}

	/**
	 * Returns the default values for a subtitle record.
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public static function get_default_track_subtitle_values(): array {
		return apply_filters( 'videoigniter_default_track_subtitle_values', array(
			'url'     => '',
			'label'   => '',
			'srclang' => '',
			'caption' => '',
		) );
	}

	/**
	 * Returns the default values for an overlay record.
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public static function get_default_track_overlay_values(): array {
		return apply_filters( 'videoigniter_default_track_overlay_values', array(
			'url'        => '',
			'title'      => '',
			'text'       => '',
			'image_id'   => '',
			'start_time' => '',
			'end_time'   => '',
			'position'   => 'top-left',
		) );
	}

	/**
	 * Registers image sizes needed by the plugin.
	 *
	 * @since 1.0.0
	 */
	public function register_image_sizes() {
		add_image_size( 'videoigniter_cover', 1920, 1080, true );
	}

	/**
	 * Registers the plugin's widgets.
	 *
	 * @since 1.0.0
	 */
	public function register_widgets() {
		$widgets = apply_filters( 'videoigniter_register_widgets', array(
			'VideoIgniter_Playlist_Widget' => $this->plugin_path() . '/widget/class-videoigniter-playlist-widget.php',
		) );

		foreach ( $widgets as $class => $file ) {
			if ( ! is_readable( $file ) ) {
				continue;
			}
			require_once $file;
			register_widget( $class );
		}
	}

	/**
	 * Registers the plugin's shortcodes.
	 *
	 * @since 1.0.0
	 */
	public function register_shortcodes() {
		add_shortcode( 'vi_playlist', array( $this, 'shortcode_vi_playlist' ) );
	}

	/**
	 * Checks whether passed post object or ID is a VideoIgniter playlist.
	 *
	 * @since 1.0.0
	 *
	 * @param int|WP_Post $post Post ID or post object.
	 *
	 * @return bool
	 */
	public function is_playlist( $post ) {
		$_post = get_post( $post );

		if ( empty( $_post ) || is_wp_error( $_post ) || $_post->post_type !== $this->post_type ) {
			return false;
		}

		return true;
	}

	/**
	 * Returns a data attributes array for the given playlist.
	 *
	 * @since 1.0.0
	 *
	 * @param int $post_id Post ID.
	 *
	 * @return array
	 */
	public function get_playlist_data_attributes_array( $post_id ) {
		$post_id = (int) $post_id;

		if ( ! $this->is_playlist( $post_id ) ) {
			return array();
		}

		$settings           = $this->settings_page->get_settings();
		$branding_image_src = $settings['branding-image-id'] ? wp_get_attachment_image_url( $settings['branding-image-id'], 'full' ) : '';

		$attrs = array(
			'data-playlist-layout'         => $this->get_post_meta( $post_id, '_videoigniter_playlist_layout', 'right' ),
			'data-playlist'                => $this->get_playlist_json( $post_id ),
			'data-show-fullscreen-toggle'  => $this->convert_bool_string( $this->get_post_meta( $post_id, '_videoigniter_show_fullscreen_toggle', 1 ) ),
			'data-show-playback-speed'     => $this->convert_bool_string( $this->get_post_meta( $post_id, '_videoigniter_show_playback_speed', 0 ) ),
			'data-volume'                  => (int) $this->get_post_meta( $post_id, '_videoigniter_volume', 100 ),
			'data-branding-image'          => esc_url( $branding_image_src ),
			'data-branding-image-position' => esc_attr( $settings['branding-image-position'] ),
		);

		return apply_filters( 'videoigniter_get_playlist_data_attributes_array', $attrs, $post_id );
	}

	/**
	 * Determines whether the URL is a YouTube video.
	 *
	 * @since 1.0.0
	 *
	 * @param string $url The URL to check.
	 *
	 * @return bool
	 */
	public function is_youtube( $url ) {
		$pattern = '/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})$/';

		return (bool) preg_match( $pattern, $url );
	}

	/**
	 * Determines whether the URL is a Vimeo video.
	 *
	 * @since 1.0.0
	 *
	 * @param string $url The URL to check.
	 *
	 * @return bool
	 */
	public function is_vimeo( $url ) {
		$pattern = '/^(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/)?(\d+)(?:|\/\?[^\s]*)?$/';

		return (bool) preg_match( $pattern, $url );
	}

	/**
	 * Determines whether the URL is a streaming video.
	 *
	 * @since 1.0.0
	 *
	 * @param string $url The URL to check.
	 *
	 * @return bool
	 */
	public function is_streaming( $url ): bool {
		$streaming_extensions = array( 'm3u8', 'm3u', 'ts', 'mpd' );

		$file_ext = $this->get_url_extension( $url );

		$result = in_array( $file_ext, $streaming_extensions, true );

		return apply_filters( 'videoigniter_url_is_streaming', $result, $url, $file_ext, $streaming_extensions );
	}


	/**
	 * Determines whether the URL is a self hosted video.
	 *
	 * @since 1.0.1
	 *
	 * @param string $url The URL to check.
	 *
	 * @return bool
	 */
	public function is_self_hosted( $url ): bool {
		return ! $this->is_streaming( $url ) && ! $this->is_youtube( $url ) && ! $this->is_vimeo( $url );
	}

	/**
	 * Returns the MIME type of the URL.
	 *
	 * @since 1.0.0
	 *
	 * @param string $url The URL to check.
	 *
	 * @return string
	 */
	public function get_video_mime_type_from_url( $url ): string {
		$mime_types = array(
			'3gp'  => 'video/3gpp',
			'avi'  => 'video/x-msvideo',
			'flv'  => 'video/x-flv',
			'm3u8' => 'application/x-mpegURL',
			'm4v'  => 'video/x-m4v',
			'mkv'  => 'video/x-matroska',
			'mov'  => 'video/quicktime',
			'mp4'  => 'video/mp4',
			'mpd'  => 'application/dash+xml',
			'mpeg' => 'video/mpeg',
			'mpg'  => 'video/mpeg',
			'ogv'  => 'video/ogg',
			'webm' => 'video/webm',
			'wmv'  => 'video/x-ms-wmv',
		);

		$url = esc_url_raw( $url );
		if ( ! $url ) {
			return '';
		}

		if ( $this->is_youtube( $url ) ) {
			return 'video/youtube';
		}

		if ( $this->is_vimeo( $url ) ) {
			return 'video/vimeo';
		}

		$file_ext = $this->get_url_extension( $url );

		if ( array_key_exists( $file_ext, $mime_types ) ) {
			return $mime_types[ $file_ext ];
		}

		return '';
	}

	/**
	 * Returns the extension of the URL, if any.
	 *
	 * @since 1.0.0
	 *
	 * @param string $url The URL to check.
	 *
	 * @return string
	 */
	public function get_url_extension( $url ): string {
		$parsed_url = wp_parse_url( $url );
		$pathinfo   = ! empty( $parsed_url['path'] ) ? pathinfo( $parsed_url['path'] ) : array();
		$file_ext   = ! empty( $pathinfo['extension'] ) ? strtolower( $pathinfo['extension'] ) : '';

		return $file_ext;
	}

	/**
	 * Returns the JSON string for a specific playlist.
	 *
	 * @since 1.0.0
	 *
	 * @param int $playlist_id Post/playlist ID.
	 *
	 * @return string
	 */
	public function get_playlist_json( $playlist_id ): string {
		if ( ! $this->is_playlist( $playlist_id ) ) {
			return '';
		}

		$tracks = $this->get_post_meta( $playlist_id, '_videoigniter_tracks', array() );

		if ( empty( $tracks ) ) {
			$tracks = array();
		}

		$playlist = array();

		foreach ( $tracks as $track ) {
			$track            = wp_parse_args( $track, self::get_default_track_values() );
			$track_poster_url = (string) wp_get_attachment_image_url( (int) $track['cover_id'], 'videoigniter_cover' );

			$text_tracks = apply_filters( 'videoigniter_playlist_track_text_tracks', array(), $track );
			$overlays    = apply_filters( 'videoigniter_playlist_track_overlays', array(), $track );

			$playlist[] = array(
				'sources'     => array(
					array(
						'src'  => $track['track_url'],
						'type' => $this->get_video_mime_type_from_url( $track['track_url'] ),
					),
				),
				'poster'      => $track_poster_url,
				'thumbnail'   => $track_poster_url,
				'name'        => $track['title'],
				'description' => $track['description'],
				'textTracks'  => $text_tracks,
				'overlays'    => $overlays,
			);
		}

		return wp_json_encode( $playlist, JSON_PRETTY_PRINT );
	}

	/**
	 * Returns the main track's markup.
	 *
	 * @since 1.0.0
	 *
	 * @param int $playlist_id Post/playlist ID.
	 *
	 * @return string
	 */
	public function render_main_video_track( $playlist_id ): string {
		if ( ! $this->is_playlist( $playlist_id ) ) {
			return '';
		}

		$tracks = $this->get_post_meta( $playlist_id, '_videoigniter_tracks', array() );

		if ( empty( $tracks ) ) {
			$tracks = array();
		}

		$main_track       = wp_parse_args( $tracks[0], self::get_default_track_values() );
		$track_poster_url = (string) wp_get_attachment_image_url( (int) $main_track['cover_id'], 'videoigniter_cover' );

		$subtitles     = array();
		$overlay_array = array();

		// Do not output any subtitles, chapters, or overlays, as they're controlled by Pro and may appear messed up without it.
		if ( class_exists( 'VideoIgniter_Pro' ) ) {
			$subtitles = ! empty( $main_track['subtitles'] ) ? $main_track['subtitles'] : array();

			if ( ! empty( $main_track['overlays'] ) ) {
				foreach ( $main_track['overlays'] as $overlay ) {
					$overlay = wp_parse_args( $overlay, self::get_default_track_overlay_values() );

					$overlay_array[] = array(
						'title'     => $overlay['title'],
						'text'      => $overlay['text'],
						'url'       => $overlay['url'],
						'startTime' => $overlay['start_time'],
						'endTime'   => $overlay['end_time'],
						'imageUrl'  => (string) wp_get_attachment_image_url( (int) $overlay['image_id'], 'thumbnail' ),
						'position'  => $overlay['position'],
					);
				}
			}
		}

		ob_start();
		?>
		<video
			class="video-js vjs-fluid vi-player"
			controls
			preload="auto"
			<?php if ( ! empty ( $track_poster_url ) ) : ?>
			poster="<?php echo esc_attr( $track_poster_url ); ?>"
			<?php endif; ?>
			data-overlays="<?php echo esc_attr( wp_json_encode( $overlay_array ) ); ?>"
			data-title="<?php echo esc_attr( $main_track['title'] ); ?>"
			data-description="<?php echo esc_attr( $main_track['description'] ); ?>"
		>
			<source
				src="<?php echo esc_attr( $main_track['track_url'] ); ?>"
				type="<?php echo esc_attr( $this->get_video_mime_type_from_url( $main_track['track_url'] ) ); ?>"
			/>

			<?php // Only render tracks if we're not in playlist mode. ?>
			<?php if ( count( $tracks ) === 1 ) : ?>
				<?php if ( class_exists( 'VideoIgniter_Pro' ) ) : ?>
					<?php if ( ! empty( $main_track['chapters_url'] ) ) : ?>
						<track kind="chapters" src="<?php echo esc_url( $main_track['chapters_url'] ); ?>" />
					<?php endif; ?>

					<?php foreach ( $subtitles as $subtitle ) : ?>
						<?php
							$subtitle   = wp_parse_args( $subtitle, self::get_default_track_subtitle_values() );
							$is_caption = ! empty( $subtitle['caption'] );
						?>
						<track
							kind="<?php echo esc_attr( $is_caption ? 'captions' : 'subtitles' ); ?>"
							src="<?php echo esc_url( $subtitle['url'] ); ?>"
							srclang="<?php echo esc_attr( $subtitle['srclang'] ); ?>"
							label="<?php echo esc_attr( $subtitle['label'] ); ?>"
						/>
					<?php endforeach; ?>
				<?php endif; ?>
			<?php endif; ?>
		</video>
		<?php

		return ob_get_clean();
	}

	/**
	 * Returns the output of the [vi_playlist] shortcode.
	 *
	 * @since 1.0.0
	 *
	 * @param array  $atts    The shortcode attributes.
	 * @param string $content Content, when used with a shortcode closing tag.
	 * @param string $tag     The shortcode name used to reach this function.
	 *
	 * @return string
	 */
	public function shortcode_vi_playlist( $atts, $content, $tag ): string {
		$atts = shortcode_atts( array(
			'id'    => '',
			'class' => '',
		), $atts, $tag );

		$id         = (int) $atts['id'];
		$class_name = $atts['class'];

		if ( ! $this->is_playlist( $id ) ) {
			return '';
		}

		$this->add_videoigniter_script_dependencies( $id );

		$post = get_post( $id );

		$params = apply_filters( 'videoigniter_shortcode_data_attributes_array', $this->get_playlist_data_attributes_array( $id ), $id, $post );
		$params = array_filter( $params, array( $this->sanitizer, 'array_filter_empty_null' ) );
		$params = $this->sanitizer::html_data_attributes_array( $params );

		$data = '';
		foreach ( $params as $attribute => $value ) {
			$data .= sprintf( '%s="%s" ', sanitize_key( $attribute ), esc_attr( $value ) );
		}

		$player_classes = array_merge( array(
			'vi-player-wrap',
		), explode( ' ', $class_name ) );

		$track_markup    = $this->render_main_video_track( $id );
		$tracks          = $this->get_post_meta( $id, '_videoigniter_tracks', array() );
		$playlist_layout = $this->get_post_meta( $id, '_videoigniter_playlist_layout', 'right' );

		$output = sprintf(
			'<div id="videoigniter-%s" class="%s" %s>%s</div>',
			esc_attr( $id ),
			esc_attr( implode( ' ', $player_classes ) ),
			$data,
			$track_markup
		);

		if ( count( $tracks ) > 1 ) {
			$output = sprintf(
				'<div id="videoigniter-%s" class="%s" %s>
							<div class="vi-playlist vi-playlist-layout-%s">
								<div class="vi-playlist-main">%s</div>
								<div class="vi-playlist-nav">
									<div class="vjs-playlist"></div>
								</div>
							</div>
						</div>',
				esc_attr( $id ),
				esc_attr( implode( ' ', $player_classes ) ),
				$data,
				$playlist_layout,
				$track_markup
			);
		}

		return $output;
	}

	/**
	 * Returns a textual representation of a boolean value.
	 *
	 * @since 1.0.0
	 *
	 * @param bool $value Value to convert to string.
	 *
	 * @return string
	 */
	public function convert_bool_string( $value ): string {
		if ( $value ) {
			return 'true';
		}

		return 'false';
	}

	/**
	 * Filters the table columns on the post listing screen.
	 *
	 * @since 1.0.0
	 *
	 * @param array $columns Array of table columns.
	 *
	 * @return array
	 */
	public function filter_posts_columns( $columns ): array {
		$date = $columns['date'];
		unset( $columns['date'] );

		$columns['shortcode'] = __( 'Shortcode', 'videoigniter' );
		$columns['date']      = $date;

		return $columns;
	}

	/**
	 * Renders the cell value of a custom table column on the post listing screen.
	 *
	 * @since 1.0.0
	 *
	 * @param string $column  Column slug.
	 * @param int    $post_id Post ID.
	 */
	public function add_custom_columns( $column, $post_id ) {
		if ( 'shortcode' === $column ) {
			?>
			<input type="text" class="code" value="<?php echo esc_attr( sprintf( '[vi_playlist id="%s"]', $post_id ) ); ?>">
			<?php
		}
	}

	/**
	 * Returns an array of all playlist post objects.
	 *
	 * @since 1.0.0
	 *
	 * @param string $orderby WP_Query compatible order by clause. Default 'date'.
	 * @param string $order WP_Query compatible order clause. Default 'DESC'.
	 *
	 * @return array
	 */
	public function get_all_playlists( $orderby = 'date', $order = 'DESC' ): array {
		$q = new WP_Query( array(
			'post_type'      => $this->post_type,
			'posts_per_page' => - 1,
			'orderby'        => $orderby,
			'order'          => $order,
		) );

		return $q->posts;
	}

	/**
	 * Filters the "real" file type of the given file.
	 *
	 * @since 1.0.0.
	 *
	 * @param array         $wp_check_filetype_and_ext {
	 *     Values for the extension, mime type, and corrected filename.
	 *
	 *     @type string|false $ext             File extension, or false if the file doesn't match a mime type.
	 *     @type string|false $type            File mime type, or false if the file doesn't match a mime type.
	 *     @type string|false $proper_filename File name with its correct extension, or false if it cannot be determined.
	 * }
	 * @param string        $file                      Full path to the file.
	 * @param string        $filename                  The name of the file (may differ from $file due to
	 *                                                 $file being in a tmp directory).
	 * @param string[]|null $mimes                     Array of mime types keyed by their file extension regex, or null if
	 *                                                 none were provided.
	 * @param string|false  $real_mime                 The actual mime type or false if the type cannot be determined.
	 *
	 * @return array
	 */
	public function register_file_extensions( $wp_check_filetype_and_ext, $file, $filename, $mimes, $real_mime ): array {
		if ( false !== strpos( $filename, '.vtt' ) ) {
			$wp_check_filetype_and_ext['ext']  = 'vtt';
			$wp_check_filetype_and_ext['type'] = 'text/vtt';
		}

		return $wp_check_filetype_and_ext;
	}

	/**
	 * Registers additional MIME types required by the plugin.
	 *
	 * @param array $mimes Array of allowed MIME types.
	 *
	 * @return array
	 */
	public function register_mime_times( $mimes ): array {
		$mimes['vtt'] = 'text/vtt';

		return $mimes;
	}

	/**
	 * Returns a post meta value, or a default one if the meta key doesn't exist.
	 *
	 * @since 1.0.0
	 *
	 * @param int    $post_id Post ID.
	 * @param string $key     Meta key.
	 * @param mixed  $default Default value to fallback to.
	 *
	 * @return mixed
	 */
	public function get_post_meta( $post_id, $key, $default = '' ) {
		$keys = get_post_custom_keys( $post_id );

		$value = $default;

		if ( is_array( $keys ) && in_array( $key, $keys, true ) ) {
			$value = get_post_meta( $post_id, $key, true );
		}

		return $value;
	}

	/**
	 * Plugin activation hook.
	 *
	 * @since 1.0.0
	 */
	public function plugin_activated() {
		if ( ! current_user_can( 'activate_plugins' ) ) {
			return;
		}

		$this->register_post_types();

		do_action( 'videoigniter_activated' );

		flush_rewrite_rules();
	}

	/**
	 * Plugin deactivation hook.
	 *
	 * @since 1.0.0
	 */
	public function plugin_deactivated() {
		if ( ! current_user_can( 'activate_plugins' ) ) {
			return;
		}

		unregister_post_type( $this->post_type );

		do_action( 'videoigniter_deactivated' );

		flush_rewrite_rules();
	}

	/**
	 * Returns the basename of the plugin.
	 *
	 * @since 1.0.0
	 */
	public static function plugin_basename() {
		return plugin_basename( __FILE__ );
	}

	/**
	 * Returns the plugin's URL.
	 *
	 * @since 1.0.0
	 */
	public function plugin_url() {
		return plugin_dir_url( __FILE__ );
	}

	/**
	 * Returns the plugin's paths.
	 *
	 * @since 1.0.0
	 */
	public function plugin_path() {
		return plugin_dir_path( __FILE__ );
	}
}


/**
 * Main instance of VideoIgniter.
 *
 * Returns the working instance of VideoIgniter. No need for globals.
 *
 * @since 1.0.0
 *
 * @return VideoIgniter
 */
function VideoIgniter() {
	return VideoIgniter::instance();
}

add_action( 'plugins_loaded', array( VideoIgniter(), 'plugin_setup' ) );
register_activation_hook( __FILE__, array( VideoIgniter(), 'plugin_activated' ) );
register_deactivation_hook( __FILE__, array( VideoIgniter(), 'plugin_deactivated' ) );
