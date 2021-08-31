import { configProps } from "../support/configProps";
import { Layer } from "../obj/Layer";
import { library } from "../../library";
import { VectorTile, Tile } from 'ol/layer';
import { props } from "../props";
import { Style } from "ol/style";
import { Point } from "ol/geom";
import TileGrid from "ol/tilegrid/TileGrid";
import { GeoJSON } from "ol/format";
import { TileJSON, VectorTile as VectorTileSrc } from "ol/source";
import View from 'ol/View';

import MVT from 'ol/format/MVT';
import {unByKey} from 'ol/Observable';
import VectorTileLayer from 'ol/layer/VectorTile';

import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Icon from 'ol/style/Icon';
import Text from 'ol/style/Text';
import Circle from 'ol/style/Circle';
//import RenderFeature from 'ol/render/Feature';

export class mapboxStyle {

    private static loaded : boolean = false;
    private static loading : boolean = false;
    
    public static apply ( lo : Layer ) {
        if (this.loaded) {
            this.loadStyle(lo);
        } else {
            if (! this.loading) {
                this.loading = true;
                window.ol = {};
                window.ol.style = {};
                window.ol.style.Style = Style;
                window.ol.style.Fill = Fill;
                window.ol.style.Stroke = Stroke;
                window.ol.style.Icon = Icon;
                window.ol.style.Text = Text;
                window.ol.style.Circle = Circle;
                window.ol.geom = {};
                window.ol.geom.Point = Point;
                window.ol.tilegrid = {};
                window.ol.tilegrid.TileGrid = TileGrid;
                window.ol.format = {};
                window.ol.format.GeoJSON = GeoJSON;
                window.ol.format.MVT = MVT;
                window.ol.layer = {}
//                window.ol.layer.TileLayer = Tile;
                window.ol.layer.Vector = VectorTileLayer;
                window.ol.source = {};
                window.ol.source.TileJSON = TileJSON;
                window.ol.source.Vector = VectorTileSrc;
                window.ol.Map = props.map;
                window.ol.View = View;
                window.ol.Observable = {};
                window.ol.Observable.unByKey = unByKey;
                if (configProps.mapbox) {
                    library.load(configProps.mapbox, () => this.callBack());
                }
            }
        }
    }

    private static loadStyle (lo : Layer) {
        olms.applyStyle(lo._layer, lo.styleJSON, "esri", null, (lo._layer as VectorTile).getSource().getTileGrid().getResolutions());
        lo._layer.setVisible(true);
        lo.notify(true);
    }
    private static callBack () {
        this.loaded = true;
        for (let i=0; i < props.layers.length; i++ ) {
            let lo = props.layers[i];
            if (lo.visible && lo.type == "vector_tile" && lo.styleJSON) {
                this.loadStyle (lo);
            }
        }
    }
}