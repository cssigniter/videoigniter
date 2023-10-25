/* global wp vi_scripts */

var VideoIgniter = (function () {
	var $ = jQuery;

	if (!vi_scripts) {
		return;
	}

	var el = {
		$trackContainer: $(".vi-fields-container"),
		trackFieldClassName: ".vi-field-repeatable",
		$addTrackButtonTop: $(".vi-add-field-top"),
		$addTrackButtonBottom: $(".vi-add-field-bottom"),
		removeFieldButtonClassName: ".vi-remove-field",
		$removeAllTracksButton: $(".vi-remove-all-fields"),
		$batchUploadButton: $(".vi-add-field-batch"),
		videoUploadButtonClassName: ".vi-track-url-upload",
		fieldTitleClassName: ".vi-field-title",
		trackTitleClassName: ".vi-track-title",
		trackDescriptionClassName: ".vi-track-description",
		trackUrlClassName: ".vi-track-url",
		fieldHeadClassName: ".vi-field-head",
		fieldCollapsedClass: "vi-collapsed",
		customElements: 'vi-subtitles-field,vi-overlays-field',
		$expandAllButton: $(".vi-fields-expand-all"),
		$collapseAllButton: $(".vi-fields-collapse-all"),
		$shortcodeInputField: $("#vi_shortcode")
	};

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
		const imageField = $field.find('vi-image-field').get(0);

		if (imageField) {
			imageField.clear();
		}
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
				if ($this.attr("id")) {
					$this.attr("id", $this.attr("id").replace(fieldHash, newHash));
				}

				if ($this.attr("name")) {
					$this.attr("name", $this.attr("name").replace(fieldHash, newHash));
				}

				$this.val("");
			});
		$field.find("label").each(function () {
			var $this = $(this);
			$this.attr("for", $this.attr("for").replace(fieldHash, newHash));
		});
		$field.find(el.fieldTitleClassName).text("");
		$field.find(el.customElements).remove();
		$field.find('vi-repeatable-fields').each(function () {
			var $this = $(this);
			$this.attr('data-name', $this.data('name').replace(fieldHash, newHash));
		})
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
	 * Shortcode select on click
	 */
	el.$shortcodeInputField.on("click", function () {
		$(this).select();
	});

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
	 * Export public methods and variables
	 */
	return {
		elements: el,
		collapseField: collapseField,
		expandField: expandField,
		isFieldCollapsed: isFieldCollapsed,
		isTrackFieldEmpty: isTrackFieldEmpty,
		resetField: resetField,
		resetCoverImage: resetCoverImage,
		getNewTrackField: getNewTrackField,
		removeElement: removeElement,
		populateTrackField: populateTrackField,
		wpMediaInit: wpMediaInit,
		uuid: uuid,
	};
})();

// Expose the VideoIgniter instance as a global
if (!window.VideoIgniter) {
	window.VideoIgniter = VideoIgniter;
}

class VideoIgniterImageField extends HTMLElement {
	constructor() {
		super();

		this.elements = {
			triggerElement: this.querySelector('.vi-field-image-upload'),
			dismissElement: this.querySelector('.vi-field-image-upload-dismiss'),
			image: this.querySelector('img'),
			placeholder: this.querySelector('.vi-field-image-placeholder'),
			input: this.querySelector('input'),
		}
		this.changeEvent = new Event('change', {
			bubbles: true,
			cancelable: true,
		});
	}

	connectedCallback() {
		this.elements.triggerElement.addEventListener('click', event => {
			event.preventDefault();
			this.handleMediaUpload();
		});

		this.elements.dismissElement.addEventListener('click', event => {
			event.preventDefault();
			event.stopImmediatePropagation();
			this.clear();
		});

		if (this.elements.input.value) {
			this.populateData();
		}
	}

	handleMediaUpload() {
		VideoIgniter.wpMediaInit({
			handler: "vi-upload-image",
			title: vi_scripts.messages.media_title_upload_file,
			type: 'image',
			onMediaSelect: (media) => {
				this.populateData(media.id, media.url);
			},
		});
	}

	populateData(imageId, imageUrl) {
		if (imageId != null) {
			this.elements.input.value = imageId;
			this.elements.input.dispatchEvent(this.changeEvent);
		}

		if (imageUrl) {
			this.elements.image.src = imageUrl;
		}

		this.elements.placeholder.style.display = 'none';
		this.elements.dismissElement.style.display = 'block';
		this.elements.image.style.display = 'inline-block';
	}

	clear() {
		this.elements.input.value = "";
		this.elements.placeholder.style.display = 'block';
		this.elements.dismissElement.style.display = 'none';
		this.elements.image.style.display = 'none';
	}
}

customElements.define('vi-image-field', VideoIgniterImageField);

class VideoIgniterFileUploadField extends HTMLElement {
	constructor() {
		super();

		this.elements = {
			input: this.querySelector('input'),
			button: this.querySelector('button'),
		}

		this.mimeType = this.dataset.mimeType;
		this.changeEvent = new Event('change', {
			bubbles: true,
			cancelable: true,
		});
	}

	connectedCallback() {
		this.elements.button.addEventListener('click', () => {
			this.handleMediaUpload();
		});
	}

	handleMediaUpload() {
		VideoIgniter.wpMediaInit({
			handler: 'vi-file-upload',
			title: vi_scripts.messages.media_title_upload_file,
			type: this.mimeType || undefined,
			onMediaSelect: (media) => {
				this.elements.input.value = media.url;
				this.elements.input.dispatchEvent(this.changeEvent);
			},
		})
	}
}

customElements.define('vi-file-upload-field', VideoIgniterFileUploadField);

// Repeatable fields
class VideoIgniterRepeatableFields extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		this.component = this.dataset.component;
		this.dataName = this.dataset.name;
		this.container = this.querySelector('.vi-repeatable-fields-content');

		this.addEventListener('click', (event) => {
			if (event.target.classList.contains('vi-fields-add-button')) {
				this.addField();
			}
		});

		this.createDataInput();
	}

	addField() {
		const newField = document.createElement(this.component);
		this.container.appendChild(newField);
	}

	createDataInput() {
		const input = document.createElement('input');
		input.type = 'hidden';
		input.name = this.dataName;
		this.appendChild(input);
		this.input = input;
	}

	serializeData() {
		const childFields = this.container.querySelectorAll(this.component);

		const data = [...childFields].map(field => {
			const inputs = [...field.querySelectorAll('input, textarea, select')].filter(input => input !== this.input);

			return [...inputs].reduce((acc, input) => {
				if (input.type === 'checkbox' && input.checked) {
					acc[input.getAttribute('name')] = '1';
				} else {
					acc[input.getAttribute('name')] = input.value;
				}

				return acc;
			}, {});
		});

		this.input.value = JSON.stringify(data);
	}
}

customElements.define('vi-repeatable-fields', VideoIgniterRepeatableFields);

class VideoIgniterRepeatableField extends HTMLElement {
	constructor() {
		super();

		try {
			this.data = JSON.parse(this.dataset.data);
		} catch {
			this.data = null;
		}
	}

	connectedCallback() {
		this.parent = this.closest('vi-repeatable-fields');
		const templateContent = document.getElementById(this.getTemplateId()).content;
		this.appendChild(document.importNode(templateContent, true));
		this.makeUnique();
		this.populateData();
		this.parent.serializeData();

		this.querySelector('.vi-fields-remove-button').addEventListener('click', () => {
			this.remove();
			this.parent.serializeData();
		});


		this.querySelectorAll('input, textarea, select').forEach(element => {
			element.addEventListener('change', () => {
				this.parent.serializeData();
			});
		});
	}

	makeUnique() {
		const id = VideoIgniter.uuid();
		this.querySelectorAll('input, textarea, select, label').forEach(element => {
			['id', 'for', 'name'].forEach(attr => {
				if (element.getAttribute(attr)) {
					element.setAttribute(attr, element.getAttribute(attr).replace('{uid}', id));
				}
			});
		});
	}

	getTemplateId() {
		return '';
	}

	populateData() {
		if (!this.data) {
			return;
		}

		const inputs = this.querySelectorAll('input, textarea, select');
		inputs.forEach(input => {
			const value = this.data[input.getAttribute('name')];

			if (value != null) {
				if (input.type === 'checkbox' && value === '1') {
					input.checked = 'true';
					return;
				}

				input.value = value;
			}
		});
	}
}
