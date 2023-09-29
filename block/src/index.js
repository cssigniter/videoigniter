import { __ } from 'wp.i18n';
import { registerBlockType } from 'wp.blocks';

import VideoIgniterPlayerEdit from './edit';
import PlayerBlockIcon from './block-icon';

registerBlockType('videoigniter/player', {
  title: __('VideoIgniter Player'),
  description: __('Display your VideoIgniter player'),
  icon: PlayerBlockIcon,
  category: 'videoigniter',
  keywords: [__('playlist'), __('videoigniter'), __('player')],
  attributes: {
    uniqueId: {
      type: 'string',
    },
    playerId: {
      type: 'string',
    },
    className: {
      type: 'string',
      default: '',
    },
  },
  edit: VideoIgniterPlayerEdit,
  save: () => null,
});
