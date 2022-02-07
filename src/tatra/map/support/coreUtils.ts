import { props } from "../props";
import { configProps } from "./configProps";
import { Layer, LayerSource } from "../obj/Layer";
import { Coord } from "../obj/Coord";
import { Feature } from 'ol';
import { Polygon } from "ol/geom";
import { ScaleLine } from "ol/control";
import { IConfigDef } from "../defs/ConfigDef";
import { layerStyle } from "../handlers/layerStyle";
//import Units from "ol/proj/Units";
import { hash } from "../hash";
import { mapUtils } from "../mapUtils";

export class coreUtils {
        
    public static filesLoading     : number = 0;
        
    // first read the config file properties
    // overwrite with hash properties if present
    public static setConfigProps (config : IConfigDef) {
        props.config = config;
        if (props.config && props.config.properties) {
            for (let k in props.config.properties) {
                configProps[k] = props.config.properties[k];
            }
        }
    }

    public static loadConfigFile (file : string, data : any) {
        if (props.data[file]) {
            for (var i=0; i< data.layers.length; i++) {
                props.data[file].layers.push(data.layers[i]);
            }
        } else {
            props.data[file] = data;
        }
    }
    public static loadLayers  () {
        if (! props.config) { return;}
        for (let i = 0; i < props.config.layers.length; i++) {
            let layer = props.config.layers[i];
            let visible = false;

            // map information from layers.json onto layers in the application config
            // this way default values are inherited from layers.json, but application can override defaults 
            // for example visibility is set to true instead of default false
            if (props.data.layers) {
                for (let j=0; j < props.data.layers.layers.length; j++) {
                    let _l = props.data.layers.layers[j];
                    if (_l.id == layer.id || (layer.cloneId != "" && layer.cloneId == _l.id )) {
/*                        let properties = Object.keys(_l);
                        for (let k = 0; k < properties.length; k++) {
                            let key = properties[k];
                            let value = _l[key];
                            if (Array.isArray(value)) {
                                value = _l[key].slice(0);
                            }
                            if (!layer[key]) {
                                layer[key] = value;
                            }
                        }*/
                        Layer.duplicateProperties(_l, layer);                        
                        break;
                    }
                }                
            }
            
            // now create layer object from configuration
            let lo = new Layer();
            
            let properties = Object.keys(layer);
            let url = "";
            for (let k = 0; k < properties.length; k++) {
                let key = properties[k];
                let value = layer[key];                
                switch (key) {
                    case "props" :
                        lo.source = new LayerSource();
                        for (let key2 in layer.props) {
                            lo.source[key2] = {};
                            if (layer.props[key2] === Object(layer.props[key2]) && !Array.isArray(layer.props[key2])) {
                                let props2 = layer.props[key2];                                
                                for (let key3 in props2) {
                                    if (typeof props2[key3] === 'object') {
                                        lo.source[key2][key3] = props2[key3].slice(0);
                                    } else {
                                        lo.source[key2][key3] = props2[key3];
                                    }
                                }
                            } else {
                                lo.source[key2] = layer.props[key2];
                            }
                        }
                        break;
                    case "parser" :
                        try {           
                            if (layerStyle['_'+layer.parser]) {
                                lo.parser = layerStyle['_'+layer.parser];
                            }                 
                        }
                        catch (e) {console.log('parser ' + layer.parser + ' is not defined');}
                        break;
                    case "visible" :
                        visible = value;
                        break;
                    case "url":
                        url = value;
                        break;
                    default:
                        lo[key] = value;
                }
            }
            this.adjustImageryTemplate(lo);
            if (url != "") { 
                if (! lo.source) { lo.source = new LayerSource();}
                lo.source.url = url.slice(0);
            }

            if (lo.id == "") { lo.id = lo.category + i; }
            if (lo.title == "") { lo.title = lo.id; }
            if (!lo.icon && props.config.properties.icons) { lo.icon = props.config.properties.icons; }
            this.setDefaultColor(lo);

            if (lo.serversLimit) {
                let found = false;
                for (let s = 0; s < lo.serversLimit.length; s++) {
                    if (lo.serversLimit[s] == props.server) {
                        found = true;
                    }
                }
                if (! found) { continue;}
            }

            props.layers.push(lo);
            
            // apply visibility after the layer has been added
            if (lo.category == 'label') {
                lo._visible = visible;
            } else if (visible) {
                lo.initVisibility = visible;
            }
        }
        if (configProps.allowHashProps) {
            hash.parse();
        }
        this.setLayerInitialVisibility();

    }

    private static adjustImageryTemplate (lo : Layer) {
        if (lo.cloneId != 'imagery_template') {
            return;
        }
        let ms = ['2km', '1km', '500m', '250m', '125m', '62.5m','31.25m','15.625m'];
        if (lo.cloneLevel >=6 && lo.cloneLevel<=13 && lo.source && lo.source.tileGrid) {
            let start = lo.cloneLevel;
            let end = (13 - lo.cloneLevel);
            (lo.source.tileGrid["resolutions"] as Array <number>).splice(start, end);    
            (lo.source.tileGrid["matrixIds"] as Array <number>).splice(start, end);    
            lo.source.matrixSet = ms[lo.cloneLevel - 6];
            lo.maxLevel = lo.cloneLevel + .5;
            lo.source.format = lo.cloneFormat;
            if (lo.cloneHasTime) {
                lo.source.url += 'TIME=*TIME*';
            } else {
                lo.noDateRefresh = true;
            }
        }
        
    }

    private static setLayerInitialVisibility() {
        for (let i = 0; i < props.layers.length; i++) {
            props.layers[i].visible = props.layers[i].initVisibility;
        }
    }

    public static setDefaultColor (lo : Layer) {
        if (lo.color) {
            let arr = [];
            for (let j = 0; j< lo.color.length; j++) {
                arr.push(lo.color[j]);
            }
            lo.defaultColor = arr;
        }
    }

    public static parseUrlHash () {
        let str = window.location.hash;
        if (!(str && str != '')) {
            return;
        }
        let hash = str.substr(1);
        let pars = hash.split(';');
        let zoomSet = false;
        let cExt = [0, 0];
        let cZoom = configProps.minZoom;
        for (let i=0; i<pars.length; i++) {
            let arr = pars[i].split(':');
            if (arr.length == 2) {
                let PAR = decodeURIComponent(arr[1]);
                switch (arr[0]) {
                    case 'l':
                        configProps.layers = PAR;
                        break;
                    case 't':
                        configProps.tab = PAR;
                        break;
                    // zoom level
                    case 'z':
                        let z = PAR;
                        if (parseInt(z) >= configProps.minZoom && parseInt(z) <= configProps.maxZoom) { configProps.zoom = parseInt(z); }
                        break;
                    // center point
                    case 'c':
                        let points = PAR.split(',');
                        if (points.length == 2) {
                            let x = Number(points[0]);
                            let y = Number(points[1]);
                            if (coreUtils.checkValidLatLon(x, false) && coreUtils.checkValidLatLon(y, true)) { 
                                configProps.center = [x,y];
                            }
                            zoomSet = true;
                        }
                        break;
                    // date / dates
                    case 'd':
                        configProps.dates = PAR;
                        break;
                    // interest
                    case 'i':
                        if (arr[1].startsWith("POLYGON")) {
                            let str = PAR.replace("POLYGON((", "");
                            str = str.replace("))", "");
                            let coord = str.split(',');
                            let valid = 0;
                            let sumx = 0;
                            let sumy = 0;
                            let min = [180, 180];
                            let max = [-180,-180];
                            if (coord.length >=3) {
                                for (let p=0; p<coord.length; p++) {
                                    let point = coord[p].split(' ');
                                    if (point.length == 2) {
                                        if (coreUtils.checkValidLatLon(point[0], false) && coreUtils.checkValidLatLon(point[1], true)) {
                                            valid ++;
                                            if (p != coord.length -1 ) {
                                                sumx += parseFloat(point[0]);
                                                sumy += parseFloat(point[1]);
                                                if (parseFloat(point[0]) < min[0]) { min[0] = parseFloat(point[0]); }
                                                if (parseFloat(point[1]) < min[1]) { min[1] = parseFloat(point[1]); }
                                                if (parseFloat(point[0]) > max[0]) { max[0] = parseFloat(point[0]); }
                                                if (parseFloat(point[1]) > max[1]) { max[1] = parseFloat(point[1]); }
                                            }
                                        }
                                    }
                                }
                                if (valid == coord.length) {
                                    configProps.aoiType= "drawPolygon";
                                    configProps.aoi = coord;
                                    cExt = [sumx / (valid-1), sumy / (valid-1)];
                                    cZoom = coreUtils.getZoomLevel(min[0] - max[0], min[1] - max[1]);
                                }
                            }
                        } else {
                            let points = PAR.split(',');
                            if (points.length == 4) {
                                if (coreUtils.checkValidLatLon(points[0], false) && coreUtils.checkValidLatLon(points[2], false) &&
                                    coreUtils.checkValidLatLon(points[1], true) && coreUtils.checkValidLatLon(points[3], true)) {
                                    configProps.aoiType= "classicBox";
                                    configProps.aoi = points;
                                    let sumx = parseFloat(points[0]) + parseFloat(points[2]);
                                    let sumy = parseFloat(points[1]) + parseFloat(points[3]);
                                    let difx = parseFloat(points[0]) - parseFloat(points[2]);
                                    let dify = parseFloat(points[1]) - parseFloat(points[3]);
                                    cZoom = coreUtils.getZoomLevel(difx, dify);
                                    cExt = [sumx / 2, sumy / 2];
                                }
                            }
                        }
                        break;
                        
                }
            }
        }
        if (!zoomSet) {
            configProps.center = cExt;   
            configProps.zoom = cZoom;
        }
    }

    public static updateFromHash () {
        //coreUtils.parseUrlHash();
        hash.parse();
        if (props.map) {              
            props.map.getView().setCenter( configProps.center);
            props.map.getView().setZoom( configProps.zoom);
            coreUtils.setAOI();
        }
    }

    public static getZoomLevel (difx : number, dify : number) {
        let z1 = Math.round(Math.log(Math.abs(360.0/difx)) / Math.log(2));
        let z2 = Math.round(Math.log(Math.abs(180.0/dify)) / Math.log(2));
        let z = (z1 > z2) ? z2 : z1;
        if (z < configProps.minZoom) { z = configProps.minZoom; }
        if (z > configProps.maxZoom) { z = configProps.maxZoom; }
        return z;
    }

    public static setAOI () {
        let lys = ['classicBox','drawPolygon'];
        let lo = null;
        for (let i=0; i<lys.length; i++) {
            lo = mapUtils.getLayerById(lys[i]);
            if (lo && lo._layer) { lo.boxSource.clear(); }
        }
        if (configProps.aoiType && configProps.aoi) {
            switch (configProps.aoiType) {
                case 'classicBox':
                    lo = mapUtils.getLayerById('classicBox');
                    if (lo) {
                        let points = configProps.aoi;
                        let coord = new Coord(points[0], points[1], points[2], points[3]);
                        lo.isSelect = false;
                        lo.visible = true;
                        lo.addFeature(coord);
                    }
                    break;
                case 'drawPolygon':
                    lo = mapUtils.getLayerById('drawPolygon');
                    if (lo) {
                        lo.isSelect = false;
                        lo.visible = true;
                        let coords = [];

                        for (let i=0; i< configProps.aoi.length; i++) {
                            let arr = configProps.aoi[i].split(' ');
                            coords.push([ parseFloat(arr[0]), parseFloat(arr[1]) ]);
                        }

                        let feature = new Feature({
                            geometry: new Polygon([coords])
                        });
                        lo.boxSource.addFeature(feature);
                    }
                    break;
            }
        }
    }
    
    public static checkValidLatLon (value : string, lat : boolean) {
        let val = parseFloat(value);
        if (lat) {
            if (val >= -90.0 && val<= 90.0) return true;
        } else {
            if (val >= -180.0 && val<= 180.0) return true;
        }
        return false;
    }
    
    public static addScaleLine () {
        props.scaleLineControlKM = new ScaleLine();
        props.scaleLineControlMI = new ScaleLine();
        props.scaleLineControlKM.setUnits("metric");
        props.scaleLineControlMI.setUnits("us");
        props.map.addControl(props.scaleLineControlKM);
        props.map.addControl(props.scaleLineControlMI);
        let els = document.getElementsByClassName("ol-scale-line");
        if (els.length == 2) {
            els[1].classList.add('ol-scale-lineMI');
        }
        for (let i = 1; i < els.length; i++) {
//            els[i].addEventListener('click', coreUtils.scaleLineClick);
        } 
    }
    
    public static setIEfunctions () {
        if (!String.prototype.startsWith) {
            String.prototype.startsWith = function(search, pos) {
                return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
            };
        }
        if (!String.prototype.includes) {
            String.prototype.includes = function(search, start) {
                'use strict';
                if (typeof start !== 'number') {
                  start = 0;
                }
                
                if (start + search.length > this.length) {
                  return false;
                } else {
                  return this.indexOf(search, start) !== -1;
                }
             };
        }
    }
}


(function () {
    if ( typeof window.CustomEvent === "function" ) return false; //If not IE
  
    function CustomEvent ( event, params ) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
        return evt;
    }
  
    CustomEvent.prototype = window.Event.prototype;
  
    window.CustomEvent = CustomEvent;
})();
