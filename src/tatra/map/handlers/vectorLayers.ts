import { createXYZ } from 'ol/tilegrid';
import { applyBackground, applyStyle } from 'ol-mapbox-style';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import { Layer } from '../obj/Layer';
import { Style } from "ol/style";
import { EsriJSON, MVT } from "ol/format";
import { VectorTile } from 'ol';

export class vectorLayers {

    public static addESRILayer (lo : Layer) {
        let url = lo.style;
        const tileGrid = createXYZ({
            extent: [-180, -90, 180, 90],
            tileSize: 512,
            maxResolution: 180 / 256,
            maxZoom: 22,
        });

        lo._layer = new VectorTileLayer({
            declutter: true,
            source: new VectorTileSource({
                projection: 'EPSG:4326',
                tileGrid: tileGrid,
            }),
        });

        applyStyle(lo._layer as VectorTileLayer, url, {
            resolutions: tileGrid.getResolutions(),
            transformRequest(url, type) {
            if (type === 'Source') {
                return new Request(
                url.replace('/VectorTileServer', '/VectorTileServer/')
                );
            }
            },
        });
        applyBackground(lo._layer as VectorTileLayer, url);
    }
    public static addVectorLayer (lo : Layer, style : Style) {

        const tileGrid = createXYZ({
            extent: [-180, -90, 180, 90],
            tileSize: 512,
            maxResolution: 180 / 256,
            maxZoom: 22,
        });
        
        let format = (lo.type == "mvt") ? new MVT({idProperty: lo.id})  : new EsriJSON({geometryName: lo.id});

        lo._layer = new VectorTileLayer({
            declutter: true,
            source: new VectorTileSource({
                projection: 'EPSG:4326',
                tileGrid: tileGrid,
                format : format,
            }),
            style : style
        });
        if (lo._layer && lo.cloneId == "eis-fire-tile") {
            let vectorSource = (lo._layer as VectorTileLayer).getSource();
            if (vectorSource) {
                vectorSource.on('tileloadend', function(evt) {
                    var z = evt.tile.getTileCoord()[0];
                    var features = (evt.tile as VectorTile).getFeatures();
                    for (let i=0; i<features.length; i++) {
                        let p = features[i].getProperties();
                        p[lo.id] = true;
                    }
                });
            }
        }

    }
}