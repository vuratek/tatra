import { Layer as olLayer, VectorTile } from 'ol/layer';
import { Vector } from 'ol/source';
import { Coord } from './Coord';
import { Circle, Polygon} from 'ol/geom';
import { Feature } from 'ol';
import { map } from '../../map';
import { layer } from '../handlers/layer';
import { events } from '../events';
import { mapboxStyle } from "../handlers/mapboxStyle";
//import { applyStyle } from 'ol-mapbox-style';

enum layerCategories {
    LAYER = "layer",
    BASEMAP = "basemap",
    OVERLAY = "overlay"
}

export interface IGRing {
    GRingLatitude1      : number;
    GRingLatitude2      : number;
    GRingLatitude3      : number;
    GRingLatitude4      : number;
    GRingLongitude1     : number;
    GRingLongitude2     : number;
    GRingLongitude3     : number;
    GRingLongitude4     : number;
}

export interface ILayerProps {
    maxZoom         : number;
    projection      : string;
    url             : string;
    tileSize        : TileSizes;
    tileUrlFunction : Array <string>;
    wrapX           : boolean;
}

enum TileSizes {
    regular = 256,
    large = 512
}

export class LayerSource {
    url         : string | null = null;
    wrapX       : boolean = true;
    imageSize   : number = 512;
    layer       : string | null = null;
    query       : string | null = null;
    imageExtent : Array <number> = [-180,-90,180,90];
    selectHandler : string | null = null;
    style        : string | null = null;
    format      : string | null = null;
    matrixSet   : string | null = null;
    templateUrl?    : string;
}

export interface IVariableRange {
    [key : string] : Array < number>;
}

export interface ILayerData {
    start?      : string;
    end?        : string;
    night?      : boolean;
    day?        : boolean;
    queryId?    : number;
}

export class Layer {
    public id               : string = "";
    public cloneId          : string = "";  // used for duplicate layers
    public title            : string = "";
    public _visible         : boolean = false;
    public initVisibility   : boolean = false;
    public type             : string = "wmts"; // WMTS, WMS, XYZ
    public _layer           : olLayer | null = null; // holds the actual layer once defined
    public source           : LayerSource | null = null;
    public _category        : string = layerCategories.LAYER; // basemap, layer or overlay
    public time             : Date = new Date();
    public _alpha           : number = 1;
    public clandestine      : boolean = false;
    public minDate          : string | null = null;
    public maxDate          : string | null = null;
    public minLevel         : number = -1;
    public maxLevel         : number = -1;
    public handler          : string = "";
    public tag              : string = ""; // optional to help identify layer group
    public hasVariable      : string = "";
    public info             : string | null = null;     // info-id for layerInfo modal if different from id
    public hasLegend        : boolean = false;
    public needsLegendIcon  : boolean = false;
    public variableRange    : IVariableRange = {};
    public symbol           : string = '';
    public props            : ILayerProps | null = null;
    public style            : string | null = null;
    public _tile            = null;
    public jsonHandler      : Function | null = null;
    public isSelect         : boolean = false;
    public isJSONIdentify   : boolean = false;
    public limitExtent      : [number, number, number, number] | null = null;
    public icon             : string | null = null;
    public iconLabel        : string | null = null;
    public iconMatrix       : Array <number> | null = null;
    public iconHasBorder    : boolean = true;
    public boxSource        : Vector | null = null;
    public parent           : string | null = null;
    public parser           : Function | null = null;
    public replace          : Array <string> | null = null;
    public data             : ILayerData = {};           // additional content related to layer (firms stores dates, satellite)
    public extent           : Array <number> = [-180, -90, 180, 90];
    public identifyUrl      : string | null = null;
    public identifyHandler  : string | null = null;
    public _refreshRate     : number = 0;       // value in mins
    public _lastRefresh     : number = 0;
    public styleJSON        : JSON | null = null;
    public isLabel          : boolean = false;
    public styleBackground  : string = '';
    public serversLimit     : Array <string> | null = null;
    public color            : Array <number> | null = null;
    public defaultColor     : Array <number> = [0, 0, 0, 0, 0, 0];
    public pixelSize        : number = 0;
    public altTitle1        : string | null = null;
    public altTitle2        : string | null = null;
 
    public addFeature (coord : Coord) {
        if (!this.boxSource) {
            return;
        }
        let ring = [
            [coord.west, coord.north,],
            [coord.east, coord.north,],
            [coord.east, coord.south,],
            [coord.west, coord.south,],
        ];
        let areaPolygon = new Polygon([ring,]);
        let areaFeature = new Feature(areaPolygon);
        this.boxSource.addFeature(areaFeature);
        return areaFeature;
    }
    
    public addCircleFeature (x : number, y : number, rad : number) {
        if (!this.boxSource) {
            return;
        }
        let circle = new Circle([x, y], rad);
        let areaFeature = new Feature(circle);
        this.boxSource.addFeature(areaFeature);
        return areaFeature;
    }

    public addFileFeature (file : IGRing) {
        if (!this.boxSource) {
            return;
        }
        let lon = [Number(file.GRingLongitude1), Number(file.GRingLongitude2), Number(file.GRingLongitude3), Number(file.GRingLongitude4),];
        if (Math.abs(lon[0] - lon[2]) > 180 || Math.abs(lon[1] - lon[3]) > 180) {
            for (let i = 0; i < lon.length; i++) {
                if (lon[i] < 0) {
                    lon[i] = lon[i] + 360.0;
                }
            }
        }
        let ring = [
            [lon[0], file.GRingLatitude1,],
            [lon[1], file.GRingLatitude2,],
            [lon[2], file.GRingLatitude3,],
            [lon[3], file.GRingLatitude4,],
            //			            [file.GRingLongitude1, file.GRingLatitude1], [file.GRingLongitude2, file.GRingLatitude2],
            //			            [file.GRingLongitude3, file.GRingLatitude3], [file.GRingLongitude4, file.GRingLatitude4]
        ];
        let areaPolygon = new Polygon([ring,]);
        let areaFeature = new Feature(areaPolygon);
        this.boxSource.addFeature(areaFeature);
        return areaFeature;
    }

    public removeFeature (feature : Feature) {
        if (!this.boxSource) {
            return;
        }
        this.boxSource.removeFeature(feature);
    }
    
    
    // called by parent layer to enable label layer
    // reset to original label layer state
    public enableLabel () {
        if (this._category == 'label') {
            this.visible = this._visible;
        }
    }
    
    // called by parent layer to disable label layer
    // preserve current label layer state
    public disableLabel () {
        if (this._category == 'label' && this._layer) {
            let vis = this._visible;
            this.visible = false;
            this._visible = vis;
        }
    }
    
    // called by UI to show label - validate against parent layer
    // make visible only if parent is visible
    public showLabel () {
        if (this._category == 'label' && this.parent) {
            let lo = map.getLayerById(this.parent);
            if (lo) {
                // if parent is not visible, label can't show up
                this.visible = lo.visible;
                this._visible = true;                   // override visible setting
            }
        }
    }
    
    // label not visible no matter the parent state
    public hideLabel () {
        if (this._category == 'label') {
            this.visible = false;
        }
    }
    
    public refresh () {
        if (this._refreshRate > 0 && this._layer && this.visible) {
            let nw = this.getCurrentTime();
            if (nw > (this.lastRefresh + this.refreshRate)) {
                this.lastRefresh = nw;
                if (this.source) {
                    if (this.source.url && this.source.url.indexOf('&_cch=')>= 0) {
                        let arr = this.source.url.split('&_cch=');
                        let arr2 = arr[1].split('&');
                        let str = '';
                        for (let i=1; i<arr2.length; i++) { str += '&' + arr2[i];}
                        this.source.url = arr[0] + '&_cch=' + this.lastRefresh + str;
                        
                    } else {
                        this.source.url += '&_cch=' + this.lastRefresh;
                    }
                                
                    this._layer.getSource().refresh();
                }
            }
        }
    }
    
    public getCurrentTime () : number {
        return Math.floor(Date.now() / (1000 * 60) - 1); // subtract one minute
    }
    
    public applyStyle () {
    	if (this.type == "vector_tile" && this.styleJSON) {
            mapboxStyle.apply(this);
//        	applyStyle(this._layer, this.styleJSON, "esri", null, (this._layer as VectorTile).getSource().getTileGrid().getResolutions());
        }	
    }

    public set visible(vis) {
        //loader.start();
    	let current = this._visible;
        if (this._layer) {
            this._layer.setVisible(vis); // set actual layer in open layers
            this.applyStyle();
        } else {
            if (vis) {
                layer.addLayer(this);
            }
        }
        this._visible = vis;
        if (vis && !current) { events.dispatchLayer(events.EVENT_LAYER_VISIBLE, this.id); }
        if (!vis && current) { events.dispatchLayer(events.EVENT_LAYER_HIDDEN, this.id); }
        this.lastRefresh = this.getCurrentTime();
    }

    public get visible() {
        return this._visible;
    }
    
    public set alpha (a) {
        if (a >=0 && a<=1) {
            this._alpha = a;
            if (this._layer) { this._layer.setOpacity(a); }
        }
    }
    
    public get alpha () {
        return this._alpha;
    }
    
    public set category (cat) {
        if (cat == 'basemap' || cat == 'overlay' || cat == 'layer' || cat == 'label') {
            this._category = cat;
        } else {
            console.log("Invalid category provided for lmv.obj.Layer: " + cat);
        }
    }
    
    public get category() {
        return this._category;
    }
    
    public set refreshRate (rate) {
        if (rate > 0) {
            this._refreshRate = rate;
            this.lastRefresh = this.getCurrentTime();
        }
    }
    
    public get refreshRate () {
        return this._refreshRate;
    }
    
    public set lastRefresh (val) {
        this._lastRefresh = val;
    }
    
    public get lastRefresh () {
        return this._lastRefresh;
    }

    public static duplicateProperties (input : Layer, output : Layer) {
        let properties = Object.keys(input);
        for (let k = 0; k < properties.length; k++) {
            let key = properties[k];
            let value = input[key];
            if (Array.isArray(value)) {
                value = input[key].slice(0);
            }
            if (!output[key]) {
                output[key] = value;
            }
        }
    }
}
