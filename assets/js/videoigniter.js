/* eslint-env browser, jquery */
/* eslint-disable prefer-arrow-callback, prefer-template, func-names, no-var, object-shorthand, no-alert */
/* global wp vi_scripts */

jQuery(function ($) {
	// Return early if vi_scripts are not available
	if (!vi_scripts) {
		// eslint-disable-line camelcase
		return;
	}

	// eslint-disable-next-line vars-on-top
	var VideoIgniter = (function () {
		var el = {
			$trackContainer: $(".vi-fields-container"),
			trackFieldClassName: ".vi-field-repeatable",
			$addTrackButtonTop: $(".vi-add-field-top"),
			$addTrackButtonBottom: $(".vi-add-field-bottom"),
			removeFieldButtonClassName: ".vi-remove-field",
			$removeAllTracksButton: $(".vi-remove-all-fields"),
			$batchUploadButton: $(".vi-add-field-batch"),
			$trackDownloadUsesTrackUrlButton: $(".vi-use-track-url-download"),
			videoUploadButtonClassName: ".vi-upload",
			coverUploadButtonClassName: ".vi-field-upload-cover",
			coverRemoveClassName: ".vi-remove-cover",
			fieldTitleClassName: ".vi-field-title",
			trackTitleClassName: ".vi-track-title",
			trackDescriptionClassName: ".vi-track-description",
			trackLyricsClassName: ".vi-track-lyrics",
			trackUrlClassName: ".vi-track-url",
			trackDownloadUrlClassName: ".vi-track-download-url",
			trackDownloadUsesTrackUrlClassName: ".vi-track-download-uses-track-url",
			hasCoverClass: "vi-has-cover",
			fieldHeadClassName: ".vi-field-head",
			fieldCollapsedClass: "vi-collapsed",
			$expandAllButton: $(".vi-fields-expand-all"),
			$collapseAllButton: $(".vi-fields-collapse-all"),
			$shortcodeInputField: $("#vi_shortcode")
		};

		/**
		 * Generate a rfc4122 version 4 compliant UUID
		 * http://stackoverflow.com/a/2117523
		 *
		 * @returns {string} - UUID
		 */
		function uuid() {
			return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (
				c
			) {
				var r = (Math.random() * 16) | 0;
				var v = c === "x" ? r : (r & 0x3) | 0x8;
				return v.toString(16);
			});
		}

		/**
		 * Check if field is collapsed
		 *
		 * @param {Object} $field - jQuery object
		 * @returns {*|boolean}
		 */
		function isFieldCollapsed($field) {
			return $field.hasClass(el.fieldCollapsedClass);
		}

		/**
		 * Collapse a field
		 *
		 * @param {Object} $field - jQuery object
		 */
		function collapseField($field) {
			$field.addClass(el.fieldCollapsedClass);
		}

		/**
		 * Expand a field
		 *
		 * @param {Object} $field - jQuery object
		 */
		function expandField($field) {
			$field.removeClass(el.fieldCollapsedClass);
		}

		/**
		 * Resets the cover image placeholder state
		 *
		 * @param {Object} $field - the remove button jQuery object
		 */
		function resetCoverImage($field) {
			var $coverWrap = $field.find("." + el.hasCoverClass);

			$coverWrap
				.removeClass(el.hasCoverClass)
				.find("img")
				.attr("src", "")
				.attr("alt", "");
			$coverWrap
				.parent()
				.find("input")
				.val("");
		}

		/**
		 * Resets a form field
		 * - Clears input values
		 * - Clears thumbnail
		 *
		 * @param {object} $field - the field's jQuery object
		 * @param {string} [hash] - UUID or random hash
		 */
		function resetField($field, hash) {
			var fieldHash = $field.data("uid");
			var newHash = hash || uuid();

			$field.attr("data-uid", newHash);
			$field
				.find("input, textarea, select")
				.not(":button")
				.each(function () {
					var $this = $(this);
					$this.attr("id", $this.attr("id").replace(fieldHash, newHash));
					$this.attr("name", $this.attr("name").replace(fieldHash, newHash));
					$this.val("");
				});
			$field.find("label").each(function () {
				var $this = $(this);
				$this.attr("for", $this.attr("for").replace(fieldHash, newHash));
			});
			$field.find(el.fieldTitleClassName).text("");
			expandField($field);
			resetCoverImage($field);
		}

		/**
		 * Checks if a track field is clear of values
		 *
		 * @param {object} $field - Track field jQuery object
		 * @returns {boolean}
		 */
		function isTrackFieldEmpty($field) {
			var isEmpty = true;
			var $inputs = $field.find("input");
			$inputs.each(function () {
				if ($(this).val()) {
					isEmpty = false;
				}
			});

			return isEmpty;
		}

		/**
		 * Gets the first field from $trackContainer
		 * and appends it back after resetting it
		 *
		 * @param {string} [hash] - UUID or random hash
		 * @param {jQuery} [$container] - A jQuery element as the container
		 *
		 * return {Object} - jQuery object
		 */
		function getNewTrackField(hash, $container) {
			var newHash = hash || uuid();
			var $parent = $container || el.$trackContainer;

			var $clone = $parent
				.find(el.trackFieldClassName)
				.first()
				.clone()
				.hide()
				.show();
			resetField($clone, newHash);

			return $clone;
		}

		/**
		 * Removes an element (or many) from the DOM
		 * by fading it out first
		 *
		 * @param {Object} $el - jQuery object of the element(s) to be removed
		 * @param {Function} [callback] - Optional callback
		 */
		function removeElement($el, callback) {
			$el.fadeOut("fast", function () {
				$(this).remove();

				if (callback && typeof callback === "function") {
					callback();
				}
			});
		}

		/**
		 * Populates a track field
		 *
		 * @param {Object} $field - The field's jQuery object
		 * @param {Object} media - WP Media Manager media object
		 */
		function populateTrackField($field, media) {
			var $urlInput = $field.find(el.trackUrlClassName);
			var $titleInput = $field.find(el.trackTitleClassName);
			var $descriptionInput = $field.find(el.trackDescriptionClassName);
			var $fieldTitle = $field.find(el.fieldTitleClassName);

			if (media.url) {
				$urlInput.val(media.url);
			}

			if (media.title && $titleInput.val() === "") {
				$titleInput.val(media.title);
				$fieldTitle.text(media.title);
			}

			if (media.meta && media.meta.description && $descriptionInput.val() === "") {
				$descriptionInput.val(media.meta.description);
			}
		}

		/**
		 * Sets a cover image for the field
		 *
		 * @param $field - The field's jQuery object
		 * @param {Object} cover - Cover object
		 * @param {number} cover.id - Image ID
		 * @param {string} cover.url - Image URL
		 * @param {string} [cover.alt] - Image alt text
		 */
		function setTrackFieldCover($field, cover) {
			var $coverField = $field.find(el.coverUploadButtonClassName);

			if (!cover || !cover.url || !cover.id) {
				return;
			}

			$coverField
				.find("img")
				.attr("src", cover.url)
				.attr("alt", cover.alt || "");

			$coverField
				.addClass(el.hasCoverClass)
				.siblings("input")
				.val(cover.id);
		}

		/**
		 * Initializes the WordPress Media Manager
		 *
		 * @param {Object} opts - Options object
		 * @param {string} opts.handler - Handler identifier of the media frame,
		 * this allows multiple media manager frames with different functionalities
		 * @param {string} [opts.type] - Filter media manager by type (video, image etc)
		 * @param {string} [opts.title=Select Media] - Title of the media manager frame
		 * @param {boolean} [opts.multiple=false] - Accept multiple selections
		 * @param {Function} [opts.onMediaSelect] - Do something after media selection
		 */
		function wpMediaInit(opts) {
			if (!opts.handler) {
				throw new Error("Missing `handler` option");
			}

			/* eslint-disable */
			var multiple = opts.multiple || false;
			var title = opts.title || "Select media";
			var mediaManager = wp.media.frames[opts.handler];
			/* eslint-enable */

			if (mediaManager) {
				mediaManager.open();
				return;
			}

			mediaManager = wp.media({
				title: title,
				multiple: multiple,
				library: {
					type: opts.type
				}
			});

			mediaManager.open();

			mediaManager.on("select", function () {
				var attachments;
				var attachmentModels = mediaManager.state().get("selection");

				if (multiple) {
					attachments = attachmentModels.map(function (attachment) {
						return attachment.toJSON();
					});
				} else {
					attachments = attachmentModels.first().toJSON();
				}

				if (opts.onMediaSelect && typeof opts.onMediaSelect === "function") {
					opts.onMediaSelect(attachments);
				}
			});
		}

		/**
		 * Collapsible bindings
		 */
		el.$trackContainer.on("click", el.fieldHeadClassName, function (e) {
			var $this = $(this);
			var $parentField = $this.parents(el.trackFieldClassName);

			if (isFieldCollapsed($parentField)) {
				expandField($parentField);
			} else {
				collapseField($parentField);
			}

			e.preventDefault();
		});

		el.$expandAllButton.on("click", function (e) {
			var $this = $(this);
			var $container = $this
				.closest(".vi-container")
				.find(".vi-fields-container");

			expandField($container.find(el.trackFieldClassName));
			e.preventDefault();
		});

		el.$collapseAllButton.on("click", function (e) {
			var $this = $(this);
			var $container = $this
				.closest(".vi-container")
				.find(".vi-fields-container");

			collapseField($container.find(el.trackFieldClassName));
			e.preventDefault();
		});

		/**
		 * Field control bindings
		 * (Add, remove buttons etc)
		 */

		/* Bind track title to title input value */
		el.$trackContainer.on("keyup", el.trackTitleClassName, function () {
			var $this = $(this);
			var $fieldTitle = $this
				.parents(el.trackFieldClassName)
				.find(el.fieldTitleClassName);
			$fieldTitle.text($this.val());
		});

		/* Add Field Top */
		el.$addTrackButtonTop.on("click", function () {
			var $this = $(this);
			var $container = $this
				.closest(".vi-container")
				.find(".vi-fields-container");
			$container.prepend(getNewTrackField(undefined, $container));
		});

		/* Add Field Bottom */
		el.$addTrackButtonBottom.on("click", function () {
			var $this = $(this);
			var $container = $this
				.closest(".vi-container")
				.find(".vi-fields-container");

			$container.append(getNewTrackField(undefined, $container));
		});

		/* Remove Track */
		el.$trackContainer.on("click", el.removeFieldButtonClassName, function () {
			var $this = $(this);
			removeElement($this.parents(".vi-field-repeatable"));
		});

		/* Remove All Tracks */
		el.$removeAllTracksButton.on("click", function () {
			var $this = $(this);
			var $container = $this
				.closest(".vi-container")
				.find(".vi-fields-container");
			var $trackFields = $container.find(el.trackFieldClassName);

			if (window.confirm(vi_scripts.messages.confirm_clear_tracks)) {
				if ($trackFields.length > 1) {
					removeElement($trackFields.slice(1));
					resetField($trackFields);
				} else {
					resetField($trackFields);
				}
			}
		});

		/**
		 * Bind media uploaders
		 */

		/* Video upload */
		el.$trackContainer.on("click", el.videoUploadButtonClassName, function () {
			var $this = $(this);
			var $parentTrackField = $this.parents(el.trackFieldClassName);

			wpMediaInit({
				handler: "vi-video",
				title: vi_scripts.messages.media_title_upload,
				type: "video",
				onMediaSelect: function (media) {
					populateTrackField($parentTrackField, media);
				}
			});
		});

		/**
		 * Cover image upload
		 *
		 * Element `coverUploadButtonClassName` *must* have
		 * an `img` and `coverRemoveClassName` elements
		 * as children
		 */
		el.$trackContainer
			.on("click", el.coverUploadButtonClassName, function (e) {
				var $this = $(this);

				wpMediaInit({
					handler: "vi-cover",
					title: vi_scripts.messages.media_title_upload_cover,
					type: "image",
					onMediaSelect: function (media) {
						setTrackFieldCover($this.parents(el.trackFieldClassName), {
							id: media.id,
							url: media.sizes.thumbnail
									 ? media.sizes.thumbnail.url
									 : media.sizes.full.url,
							alt: media.alt
						});
					}
				});

				e.preventDefault();
			})
			/* Remove Image */
			.on("click", el.coverRemoveClassName, function (e) {
				var $this = $(this);
				resetCoverImage($this.parents(el.trackFieldClassName));
				e.stopPropagation();
				e.preventDefault();
			});

		/**
		 * Hide / show options based on player type
		 *
		 * Different player types support different kind of options.
		 * E.g. "Simple Player" doesn't support tracklist height, etc.
		 */
		var $settingsWrap = $(".vi-module-settings");
		var $typeSelect = $(".vi-form-select-playlist-layout");

		function getUnsupportedSettings($el) {
			var settingsString = $el.data("no-support");

			if (typeof settingsString !== "string") {
				return [];
			}

			return settingsString
				.replace(/\s/g, "") // remove all whitespace
				.split(",")
				.map(function (x) {
					return "_videoigniter_" + x;
				});
		}

		function filterUIBasedOnPlayerType($el) {
			var type = $el.val();

			// Reset styles
			var $shortcodeMetaBox = $("#vi-meta-box-shortcode");
			var $messageBox = $(".vi-playlist-layout-message");
			var info = $el.data("info");

			$shortcodeMetaBox.show();

			if (info) {
				$messageBox.text(info).show();
			} else {
				$messageBox.text("").hide();
			}

			// Player specific controls
			switch (type) {
				case "global-footer":
					$shortcodeMetaBox.hide();
					break;
				default:
					return;
			}
		}

		function filterSettings() {
			var $formFields;
			var $type = $typeSelect.find(":selected");
			var unsupportedSettings = getUnsupportedSettings($type);

			filterUIBasedOnPlayerType($type);

			if (unsupportedSettings.length === 0) {
				$formFields = $settingsWrap.find(".vi-form-field");
				$formFields.show();
				return;
			}

			$settingsWrap.find("input", "select", "textarea").each(function () {
				var $this = $(this);
				var $parent = $this.parents(".vi-form-field");
				if (unsupportedSettings.indexOf($this.attr("name")) > - 1) {
					$parent.hide();
				} else {
					$parent.show();
				}
			});
		}

		filterSettings();
		$typeSelect.on("change", filterSettings);

		/**
		 * Shortcode select on click
		 */
		el.$shortcodeInputField.on("click", function () {
			$(this).select();
		});

		/**
		 * Export public methods and variables
		 */
		return {
			elements: el,
			uuid: uuid,
			collapseField: collapseField,
			expandField: expandField,
			isFieldCollapsed: isFieldCollapsed,
			isTrackFieldEmpty: isTrackFieldEmpty,
			resetField: resetField,
			resetCoverImage: resetCoverImage,
			getNewTrackField: getNewTrackField,
			removeElement: removeElement,
			populateTrackField: populateTrackField,
			setTrackFieldCover: setTrackFieldCover,
			wpMediaInit: wpMediaInit
		};
	})();

	// Expose the VideoIgniter instance as a global
	if (!window.VideoIgniter) {
		window.VideoIgniter = VideoIgniter;
	}
});
