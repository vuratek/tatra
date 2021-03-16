import { Layer, LayerSource } from "../obj/Layer";
import { props } from "../props";
import { Vector as VectorSrc, TileWMS, ImageStatic, ImageWMS, WMTS as WMTSSrc, TileImage } from "ol/source";
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import ImageLayer from 'ol/layer/Image';
import VectorLayer from 'ol/layer/Vector';
import VectorTileSrc from 'ol/source/VectorTile';
import VectorTileLayer from 'ol/layer/VectorTile';
import { events } from "../events";
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { GeoJSON, MVT, EsriJSON } from "ol/format";
import { unByKey } from "ol/Observable";
import { get as projGet } from "ol/proj";
import { layerStyle} from "./layerStyle";
import { ajax } from "../../ajax";
import TileGrid from "ol/tilegrid/TileGrid";
import {getWidth} from 'ol/extent';
import {get as getProjection} from 'ol/proj';
import { Feature, Graticule } from "ol";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import { mapUtils } from "../mapUtils";
import RasterSource from "ol/source/Raster";

export class layer {
        
    public static addLayer (lo : Layer) {

        switch (lo.type) {
        case "wms":
            this.addWMSLayer(lo);
            break;
        case "wmts":
            this.addWMTSLayer(lo);
            break;
        case "tile_wms":
            this.addTile_WMSLayer(lo);
            break;
        case "vector_tile":
            this.addVectorTileLayer(lo);
            break;
        case "xyz":
            this.addXYZLayer(lo);
            break;
        case "xyz_vector":
            this.addXYZVectorLayer(lo);
            break;
        case "geojson":
        case "esrigeojson":
            this.addGeoJsonLayer(lo);
            break;
        case "custom_symbol":
            this.addCustomSymbolLayer(lo);
            break;
        case "static_image":
            this.addStaticImageLayer(lo);
            break;
        case "graticule":
            this.addGraticule(lo);
            break;
        case "boxLayer":
        case "manualLayer":
        case "drawLayer":
        case "drawPolygonLayer":
        case "drawClassicLayer":
            this.addBoxLayer(lo);
            break;
        default:
            console.log("ERROR : Unrecognized layer type " + lo.type);
            return;
        }
        if (lo._layer) {
            let index = 0;
            lo.alpha = lo.alpha;    // apply stored alpha
            if (lo.limitExtent) {
                lo._layer.setExtent(lo.limitExtent);
            }
            
            for (let i = 0; i < props.layers.length; i++) {
                let layer = props.layers[i];
                if (layer.id == lo.id) {
                    //console.log("inserting layer "+layer.id+" at " + index);
                    props.map.getLayers().insertAt(index, lo._layer);
                    lo._layer.set("id", lo.id);
                    break;
                }
                if (layer._layer) {
                    index++;
                }
            }
        }
    }
    
    public static removeLayer (lo : Layer) {
        for (let i = 0; i < props.layers.length; i++) {
            if (lo.id == props.layers[i].id) {
            	if (lo._layer) {
    				props.map.removeLayer(lo._layer);            		
            	}
                lo._layer = null;
                props.layers.splice(i, 1);
                return;
            }
        }
    }
    
    public static addWMTSLayer (lo : Layer) {

        let input = [];
        // parse layer object properties from config; and set open layers layer object
        let properties = Object.keys(lo.source);
        for (let i = 0; i < properties.length; i++) {
            let key = properties[i];
            let value = lo.source[key];
            if (key == 'layer' && lo.replace) {
                for (let i=0; i< lo.replace.length / 2; i++) {
                    if (lo.replace[i*2] == "layer") {
                        value = lo.replace[i*2 + 1];
                    }
                }    
            }

            // tileGrid needs to be parse as function declaration is needed
            if (key == "tileGrid") {
                let properties2 = Object.keys(value);
                let input2 = [];
                for (let j = 0; j < properties2.length; j++) {
                    let key2 = properties2[j];
                    let value2 = value[key2];
                    input2[key2] = value2;
                }
                input[key] = new WMTSTileGrid(input2);
            } else if (key == "tileLoadFunction") {
            	let all = value.join("");
            	all = all.replace ("#id#", lo.id);
                input[key] = eval("(" + all + ")"); // needs () around the function definition
            } else {
                input[key] = value;
            }
        }
        input["crossOrigin"] = "anonymous";
        input["imageSmoothing"] = false;

        if (navigator.userAgent.indexOf("Firefox") == -1 && lo.paletteUrl) {        
            let lyr = new RasterSource({
                sources: [
                    new TileLayer({
                        source: new WMTSSrc(input),
                    }) ],
                operation: function (pixels, data) {
                  let pixel = pixels[0];
                  if (data["colors"]) {
                      let lookup = `${pixel[0]},${pixel[1]},${pixel[2]},${pixel[3]}`;
                      if (data["colors"][lookup]) {
                        return pixel;
                    } else {
                        pixel[3]=0;
                    }
                  }
                  return pixel;
                },
                lib: {
                },
              });
            lo._layer = new ImageLayer({
                source: lyr,
            });
            lyr.on('beforeoperations', function (event) {
                var data = event.data;
                data["colors"] = props.colorLookup[lo.id];
/*                let canvases = document.querySelectorAll('.ol-layer canvas');
                for (let i=0; i<canvases.length; i++) {
                    let canvas = canvases[i] as HTMLCanvasElement;
                    let context = canvas.getContext('2d');
                    if (context) {
                        context.imageSmoothingEnabled = false;
                    }
                }*/
            });
        } else {
            lo._layer = new TileLayer({
                source: new WMTSSrc(input)
            });
        }
        if (lo.paletteUrl) {
            mapUtils.readColorMap(lo);
        }
    }
    
    public static addTile_WMSLayer (lo : Layer) {
        let input = [];
        // parse layer object properties from config; and set open layers layer object

        let properties = Object.keys(lo.source);
        for (let i = 0; i < properties.length; i++) {
            let key = properties[i];
            let value = lo.source[key];
            if (key == "imageLoadFunction" || key == "tileLoadFunction") {
                input[key] = eval("(" + value.join("") + ")");
            } else {
                input[key] = value;
            }
        }
        input["crossOrigin"] = "anonymous";
        
        lo._layer = new TileLayer({
            source: new TileWMS(input),
        });
    }
    
    public static addVectorTileLayer (lo : Layer) {
        let input = [];
        // parse layer object properties from config; and set open layers layer object

        let properties = Object.keys(lo.source);
        for (let i = 0; i < properties.length; i++) {
            let key = properties[i];
            let value = lo.source[key];
            input[key] = value;
        }
        input["crossOrigin"] = "anonymous";
        input["format"] = new MVT();
        lo._layer = new VectorTileLayer({
            source: new VectorTileSrc (input)
        });

        if (lo.style) {
            ajax.get(lo.style, null, (data : any) => this.setLayerStyle(data, lo));
        }
    }

    public static setLayerStyle (data : any, lo : Layer) {
        lo.styleJSON = data;
        lo.applyStyle();
    }
    
    public static addWMSLayer(lo : Layer) {        
        let input : any = [];
        // parse layer object properties from config; and set open layers layer object

        let properties = Object.keys(lo.source as LayerSource);
        for (let i = 0; i < properties.length; i++) {
            let key = properties[i];
            if (lo.source) {
                let value = (lo.source as any)[key];
                if (key == "imageLoadFunction") {
                    input[key] = eval("(" + value.join("") + ")");
                } else {
                    input[key] = value;
                }
            }
        }
        input["crossOrigin"] = "anonymous";
        lo._layer = new ImageLayer({
            extent: lo.extent,
            source: new ImageWMS(input)
          });
    }

    public static refreshGeoJsonLayer (lo:Layer) {
        if (!lo._layer) { return;}
        this._GeoJsonRefresh(lo);
        lo.refresh();
    }

    private static _GeoJsonRefresh(lo : Layer) {
        if (!lo._layer) { return; }
        let source = lo._layer.getSource();
        let listenerKey = source.on("change", function(e) {
            e;
            if (source.getState() == "ready") {
                let f = e.target.getFeatures() as Array<Feature>;
                if (f.length == 0) {
                    return;
                }
                unByKey(listenerKey);
                let counter = 0;
                for (let feature in f) {
                    if (! f[feature].get("__id")) {
                        f[feature].setProperties({"__id" : f[feature].getId()});
                    }                    

                    f[feature].setId(lo.id + '--' + counter);
                    counter ++;
                }
                events.dispatchLayer(events.EVENT_GEOJSON_LOADED, lo.id);
            }
        });
    }
    
    public static addGeoJsonLayer (lo : Layer) {
        if (!lo.source) { return;}
        let options = {};
        if (lo.source && lo.jsonHandler) {
            let func = eval(`${lo.jsonHandler}(lo)`);
        }
        if (lo.type == "esrigeojson") {
            options = {
                url: lo.source.url,
                format: new EsriJSON(),
            }
        } else {
            options = {
                url: lo.source.url,
                format: new GeoJSON(),
            }
        }
        let source = new VectorSrc(options);
        let func = layerStyle['_' + lo.source.style];
        lo._layer = new VectorLayer({
            source: source,
            style: func,
        });
        this._GeoJsonRefresh(lo);
    }

    public static updateGeoJsonLayer (lo : Layer) {
        if (!lo.source || !lo._layer) { return;}
        if (lo.jsonHandler) {
            let str = (lo.source.url) ? lo.source.url.slice(0) : '';
            let func = eval(`${lo.jsonHandler}(lo)`);

            if (str == lo.source.url) {
                return;
            }
        }

        let options = {
            url: lo.source.url as string,
            format: new GeoJSON(),
        }
        let source = new VectorSrc(options);
        lo._layer.setSource( source);
    }

    public static addGraticule (lo:Layer) {
        lo._layer = new Graticule({
            // the style to use for the lines, optional.
            strokeStyle: new Stroke({
              color: 'rgba(255,255,255,0.8)',
              width: 2,
              lineDash: [0.5, 4],
            }),
            intervals: [90, 45, 30, 20, 10, 5, 2, 1, 0.5, 0.25, 0.166667, 0.03333, 0.01667, 0.0083333, 0.00416667, 0.002, 0.001],
            lonLabelPosition : 0.92,
            latLabelPosition: 0.07,
            showLabels: true,
            wrapX: false,
          })
    }

    public static addXYZLayer (lo : Layer) {
        layer.setXYZTypeLayer(lo, 'xyz');
        //(lo._layer.getSource() as XYZ).setTileUrlFunction(() => layer.test());
    }


    public static addXYZVectorLayer (lo : Layer) {
        layer.setXYZTypeLayer(lo, 'xyz_vector');
    }
    
    private static setXYZTypeLayer (lo : Layer, type:string) {
        let input : any = [];
        // parse layer object properties from config; and set open layers layer object
        let properties = Object.keys(lo.source as LayerSource);
        let func = null;
        for (let i = 0; i < properties.length; i++) {
            let key = properties[i];
            let value = (lo.source as any)[key];
            // tileGrid needs to be parse as function declaration is needed
            if (key == "projection") {
                input[key] = projGet(value);
            } else if (key == "tileUrlFunction") {
            	let all = value.join("");
                all = all.replace ("#id#", lo.id);
                func = eval("(" + all + ")");
//                input[key] = eval("(" + all + ")"); // needs () around the function definition
            } else {
                input[key] = value;
            }
        }
        input["crossOrigin"] = "anonymous";
        if (type == "xyz_vector") {
            input["format"] = new EsriJSON();
            if (func) {
                input["loader"] = func;
            }
            let projExtent = getProjection('EPSG:4326').getExtent();
            let startResolution = getWidth(projExtent) / 512;
            let resolutions = new Array(14);
            for (let i = 0; i < resolutions.length; i++) {
                resolutions[i] = startResolution / Math.pow(2, i);
            }
            input["tileGrid"] = new TileGrid({
                extent: projGet('EPSG:4326').getExtent(),
                resolutions: resolutions,
                tileSize: 512,
            });
            let func = layerStyle['_' + lo.source.style];
            lo._layer = new VectorTileLayer({
                source: new VectorTileSrc (input),
                style: func
            });
            //console.log((lo._layer.getSource() as VectorTileSrc).getTileGrid());
//            (lo._layer.getSource() as VectorTileSrc).setTileLoadFunction(func);

        } else {
            lo._layer = new TileLayer({
                source: new XYZ(input),
            });
        }
        if (func) {
            (lo._layer.getSource() as XYZ).setTileUrlFunction(func);
            //ajax.get(lo.style as string, null, (data : any) => this.setLayerStyle(data, lo));
        }        
    //(lo._layer.getSource() as XYZ).setTileUrlFunction(() => layer.test());
    }
    
    public static addBoxLayer (lo : Layer) {
        lo.boxSource = new VectorSrc();
        if (lo.source && lo.source.style) {
            let func = layerStyle['_' + lo.source.style];
            lo._layer = new VectorLayer({
                source: lo.boxSource,
                style: func
            });
        } else {
            lo._layer = new VectorLayer({
                source: lo.boxSource,
            });
        }
    }
    
    public static addStaticImageLayer (lo : Layer) {
        lo._layer = new ImageLayer({
            opacity: 1,
            source: new ImageStatic({
                url: lo.source.url,
                imageSize: lo.source.imageSize,
                imageExtent: lo.source.imageExtent,
            })
        });
//        imageSize: lo.source.imageSize,
//        imageExtent: lo.sourceImageExtent,
    }
    
    public static addCustomSymbolLayer (lo : Layer) {
/*        let source = new VectorSrc(
            {
                wrapX: true,                                
                loader :  function(extent, resolution, projection) {
                    $.ajax({
                        url: lo.source.url,
                        success: function (result) {
                            lo.parser(result, lo);
                        }                                       
                    });
                }
            });
        
        let func = 'layerStyle.' + lo.symbol + 'SymbolStyle';
        lo._layer = new VectorLayer({
            source: source,
            style: eval(func)
         });    */
    }
    
    public static inRange (lo : Layer) {
        let level = props.map.getView().getZoom();
        if (level < lo.minLevel) return false;
        if (lo.maxLevel >=0 && level > lo.maxLevel) return false;
        return true;
    }
}
