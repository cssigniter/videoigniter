<?php
/**
 * Class VideoIgniter_Playlist_Widget
 *
 * Creates a playlist widget for VideoIgniter.
 *
 * @since NewVersion
 */
class VideoIgniter_Playlist_Widget extends WP_Widget {
	/**
	 * Default widget settings.
	 *
	 * @var array $defaults
	 *
	 * @since NewVersion
	 */
	protected $defaults = array(
		'title'    => '',
		'playlist' => '',
	);

	/**
	 * Constructs a new instance of the class.
	 *
	 * @since NewVersion
	 */
	public function __construct() {
		$widget_ops  = array( 'description' => esc_html__( 'Displays a single VideoIgniter Playlist.', 'videoigniter' ) );
		$control_ops = array();
		parent::__construct( 'videoigniter-playlist', $name = esc_html__( 'VideoIgniter - Playlist', 'videoigniter' ), $widget_ops, $control_ops );
	}

	/**
	 * A widget function that displays a playlist.
	 *
	 * @since NewVersion
	 *
	 * @param array $args     An array of arguments.
	 * @param array $instance An array of instance data.
	 */
	public function widget( $args, $instance ) {
		$instance = wp_parse_args( (array) $instance, $this->defaults );

		$title = apply_filters( 'widget_title', empty( $instance['title'] ) ? '' : $instance['title'], $instance, $this->id_base );

		$playlist = $instance['playlist'];

		echo $args['before_widget'];

		if ( $title ) {
			echo $args['before_title'] . $title . $args['after_title'];
		}

		$playlist = (int) $playlist;
		$post     = get_post( $playlist );

		if ( ! empty( $post ) && VideoIgniter()->post_type === $post->post_type ) {
			echo do_shortcode(
				sprintf( '[vi_playlist id="%s"]',
					$playlist
				)
			);
		}

		echo $args['after_widget'];
	}

	/**
	 * Updates the instance of the class with new values provided in $new_instance.
	 *
	 * @since NewVersion
	 *
	 * @param array $new_instance The new instance values.
	 * @param array $old_instance The old instance values.
	 *
	 * @return array The updated instance.
	 */
	public function update( $new_instance, $old_instance ) {
		$instance = $old_instance;

		$instance['title']    = sanitize_text_field( $new_instance['title'] );
		$instance['playlist'] = (int) $new_instance['playlist'];

		return $instance;
	}

	/**
	 * Displays the form for editing the widget settings.
	 *
	 * @since NewVersion
	 *
	 * @param array $instance The current widget instance settings.
	 */
	public function form( $instance ) {
		$instance = wp_parse_args( (array) $instance, $this->defaults );

		$title    = $instance['title'];
		$playlist = $instance['playlist'];
		?>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>">
				<?php esc_html_e( 'Title:', 'videoigniter' ); ?>
			</label>
			<input
				type="text"
				class="widefat"
				id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"
				name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>"
				value="<?php echo esc_attr( $title ); ?>"
			/>
		</p>

		<p>
			<label for="<?php echo esc_attr( $this->get_field_name( 'playlist' ) ); ?>">
				<?php esc_html_e( 'Playlist:', 'videoigniter' ); ?>
			</label>
			<?php
				$this->dropdown_posts( array(
					'post_type'            => VideoIgniter()->post_type,
					'selected'             => $playlist,
					'class'                => 'widefat posts_dropdown',
					'show_option_none'     => '&nbsp;',
					'select_even_if_empty' => true,
				), $this->get_field_name( 'playlist' ) );
			?>
		</p>
		<?php
	}

	/**
	 * Generates the function comment for the dropdown_posts function.
	 *
	 * @since NewVersion
	 *
	 * @param array  $args an array of arguments (optional).
	 * @param string $name the name of the dropdown (optional, default: 'post_id').
	 *
	 * @return string the HTML output of the dropdown.
	 */
	public function dropdown_posts( $args = array(), $name = 'post_id' ) {
		$defaults = array(
			'depth'                 => 0,
			'post_parent'           => 0,
			'selected'              => 0,
			'echo'                  => 1,
			//'name'                  => 'page_id', // With this line, get_posts() doesn't work properly.
			'id'                    => '',
			'class'                 => '',
			'show_option_none'      => '',
			'show_option_no_change' => '',
			'option_none_value'     => '',
			'post_type'             => 'post',
			'post_status'           => 'publish',
			'suppress_filters'      => false,
			'numberposts'           => -1,
			'select_even_if_empty'  => false, // If no posts are found, an empty <select> will be returned/echoed.
		);

		$r = wp_parse_args( $args, $defaults );

		$depth                 = $r['depth'];
		$echo                  = $r['echo'];
		$id                    = $r['id'];
		$class                 = $r['class'];
		$show_option_none      = $r['show_option_none'];
		$show_option_no_change = $r['show_option_no_change'];
		$option_none_value     = $r['option_none_value'];
		$select_even_if_empty  = $r['select_even_if_empty'];

		$hierarchical_post_types = get_post_types( array( 'hierarchical' => true ) );
		if ( in_array( $r['post_type'], $hierarchical_post_types, true ) ) {
			$pages = get_pages( $r );
		} else {
			$pages = get_posts( $r );
		}

		$output = '';
		// Back-compat with old system where both id and name were based on $name argument.
		if ( empty( $id ) ) {
			$id = $name;
		}

		if ( ! empty( $pages ) || true === $select_even_if_empty ) {
			$output = "<select name='" . esc_attr( $name ) . "' id='" . esc_attr( $id ) . "' class='" . esc_attr( $class ) . "'>\n";
			if ( $show_option_no_change ) {
				$output .= "\t<option value=\"-1\">$show_option_no_change</option>";
			}
			if ( $show_option_none ) {
				$output .= "\t<option value=\"" . esc_attr( $option_none_value ) . "\">$show_option_none</option>\n";
			}
			if ( ! empty( $pages ) ) {
				$output .= walk_page_dropdown_tree( $pages, $depth, $r );
			}
			$output .= "</select>\n";
		}

		$output = apply_filters( 'videoigniter_playlist_widget_dropdown_posts', $output, $name, $r );

		if ( $echo ) {
			echo wp_kses( $output, array(
				'select' => array(
					'class' => true,
					'id'    => true,
					'name'  => true,
				),
				'option' => array(
					'value'    => true,
					'selected' => true,
				),
			) );
		}

		return $output;
	}
}
