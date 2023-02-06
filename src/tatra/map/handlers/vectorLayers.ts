import { createXYZ } from 'ol/tilegrid';
import { applyBackground, applyStyle } from 'ol-mapbox-style';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import { Layer } from '../obj/Layer';
import { Style } from "ol/style";
import { EsriJSON } from "ol/format";

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

        let format = new EsriJSON();

        lo._layer = new VectorTileLayer({
            declutter: true,
            source: new VectorTileSource({
                projection: 'EPSG:4326',
                tileGrid: tileGrid,
                format : format,
            }),
            style : style
        });

    }
}