jQuery(document).ready(function ($) {
  // Initialize color pickers
  $('.videoigniter-color-picker').wpColorPicker();

  // Initialize image uploads
  const imageUploads = document.querySelectorAll('.vi-settings-image-upload');
  const handler = 'vi-settings-image-upload';

  imageUploads.forEach(imageUpload => {
    const button = imageUpload.querySelector('button');
    const input = imageUpload.querySelector('input');
    const previewImage = imageUpload.querySelector('img');
    const dismiss = imageUpload.querySelector(
      '.vi-settings-image-upload-dismiss',
    );

    button.addEventListener('click', () => {
      let mediaManager = wp.media.frames[handler];

      if (mediaManager) {
        mediaManager.open();
        return;
      }

      mediaManager = wp.media({
        title: vi_admin_settings.messages.media_modal_title,
        multiple: false,
        library: {
          type: 'image',
        },
      });

      mediaManager.open();

      mediaManager.on('select', () => {
        const attachment = mediaManager
          .state()
          .get('selection')
          .first()
          .toJSON();
        input.value = attachment.id;
        previewImage.src = attachment.url;
        imageUpload.classList.add('vi-settings-image-upload-has-image');
      });
    });

    dismiss.addEventListener('click', event => {
      event.preventDefault();
      previewImage.src = '';
      input.value = '';
      imageUpload.classList.remove('vi-settings-image-upload-has-image');
    });
  });
});
