import { Fragment, useEffect, useRef } from 'wp.element';
import { __ } from 'wp.i18n';
import { useSelect } from 'wp.data';
import { SelectControl, PanelBody } from 'wp.components';
import { InspectorControls, useBlockProps } from 'wp.blockEditor';
import ServerSideRender from 'wp.serverSideRender';

import useUniqueId from './hooks/useUniqueId';
import LoadingResponsePlaceholder from './components/LoadingResponsePlaceholder';

const VideoIgniterPlayerEdit = ({ attributes, setAttributes, clientId }) => {
  const { uniqueId, playerId } = attributes;
  const ref = useRef(null);
  const blockProps = useBlockProps();

  useUniqueId({ attributes, setAttributes, clientId });

  useEffect(() => {
    if (!playerId || !ref.current) {
      return;
    }

    // The editor's canvas may be an iframe, where the player's scripts are
    // loaded separately. The player needs to be initialized by the script
    // that lives in the same window as the block's markup.
    const view = ref.current.ownerDocument.defaultView || window;
    let initialized = false;

    const observer = new view.MutationObserver((mutations, obs) => {
      mutations.forEach(mutation => {
        if (initialized || !mutation.addedNodes || !ref.current) {
          return;
        }

        const player = ref.current.querySelector(`#videoigniter-${playerId}`);
        const video = player && player.querySelector('.vi-player');
        const initPlayer =
          view.__CI_VIDEOIGNITER_MANUAL_INIT__ ||
          window.__CI_VIDEOIGNITER_MANUAL_INIT__;

        if (video && initPlayer) {
          initialized = true;
          initPlayer(video);
          obs.disconnect();
        }
      });
    });

    observer.observe(ref.current, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });

    // eslint-disable-next-line consistent-return
    return () => observer.disconnect();
  }, [playerId, ref.current]);

  const { playlists = [] } = useSelect(select => {
    const { getEntityRecords } = select('core');

    return {
      playlists: getEntityRecords('postType', 'vi_playlist', {
        per_page: -1,
      }),
    };
  });

  return (
    <Fragment>
      <div {...blockProps}>
        <div ref={ref} id={`videoigniter-block-${uniqueId}`}>
          <ServerSideRender
            key={uniqueId}
            block="videoigniter/player"
            attributes={{
              uniqueId,
              playerId,
            }}
            LoadingResponsePlaceholder={LoadingResponsePlaceholder}
          />
        </div>
      </div>

      <InspectorControls>
        <PanelBody title={__('Settings')} initialOpen>
          <SelectControl
            label={__('Playlist')}
            value={playerId}
            options={[
              {
                label: __('Select a playlist'),
                value: '',
              },
              ...(playlists || []).map(playlist => ({
                label: playlist.title.raw,
                value: playlist.id,
              })),
            ]}
            onChange={value => setAttributes({ playerId: value })}
          />
        </PanelBody>
      </InspectorControls>
    </Fragment>
  );
};

export default VideoIgniterPlayerEdit;
