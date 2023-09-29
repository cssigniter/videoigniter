import { Fragment, useEffect, useRef } from 'wp.element';
import { __ } from 'wp.i18n';
import { useSelect } from 'wp.data';
import { SelectControl, PanelBody } from 'wp.components';
import { InspectorControls } from 'wp.blockEditor';
import ServerSideRender from 'wp.serverSideRender';

import useUniqueId from './hooks/useUniqueId';
import LoadingResponsePlaceholder from './components/LoadingResponsePlaceholder';
import VideoIgniterPlaylistStyles from './styles';
import BackgroundControl from './components/BackgroundControl';
import PopoverColorControl from './components/PopOverColorControl/PopoverColorControl';
import { videoIgniterColors } from './index';

const VideoIgniterPlayerEdit = ({
  attributes,
  setAttributes,
  className,
  clientId,
}) => {
  const { uniqueId, playerId } = attributes;
  const ref = useRef(null);

  useUniqueId({ attributes, setAttributes, clientId });

  useEffect(() => {
    if (!playerId || !ref.current) {
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      mutations.forEach(mutation => {
        if (!mutation.addedNodes) {
          return;
        }

        const player = ref.current.querySelector(`#videoigniter-${playerId}`);

        if (player) {
          window.__CI_VIDEOIGNITER_MANUAL_INIT__(player);
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
      <div
        ref={ref}
        id={`videoigniter-block-${uniqueId}`}
        className={className}
      >
        <VideoIgniterPlaylistStyles attributes={attributes} />

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

      <InspectorControls>
        <PanelBody title={__('Settings')} initialOpen>
          <SelectControl
            label={__('Playlist')}
            value={playerId}
            options={[
              {
                label: __('Select a playlist'),
                value: null,
              },
              ...(playlists || []).map(playlist => ({
                label: playlist.title.raw,
                value: playlist.id,
              })),
            ]}
            onChange={value => setAttributes({ playerId: value })}
          />
        </PanelBody>

        <PanelBody title={__('Player Appearance')}>
          <BackgroundControl
            attributes={attributes}
            setAttributes={setAttributes}
            attributeKey="backgroundImage"
            label={__('Background Image')}
          />

          {videoIgniterColors.map(color => {
            return (
              <PopoverColorControl
                label={color.label}
                value={attributes[color.key] || window.viColors[color.key]}
                defaultValue={window.viColors[color.key] || undefined}
                onChange={value => {
                  setAttributes({
                    [color.key]: value,
                  });
                }}
              />
            );
          })}
        </PanelBody>
      </InspectorControls>
    </Fragment>
  );
};

export default VideoIgniterPlayerEdit;
