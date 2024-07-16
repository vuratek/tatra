import { Layer, LayerSource } from "../obj/Layer";
import { props } from "../props";
import { Vector as VectorSrc, TileWMS, ImageStatic, ImageWMS, WMTS as WMTSSrc, GeoTIFF, Vector } from "ol/source";
import TileEventType from "ol/source/TileEventType";
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import ImageLayer from 'ol/layer/Image';
import VectorLayer from 'ol/layer/Vector';
import { events } from "../events";
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { GeoJSON, EsriJSON } from "ol/format";
import { unByKey } from "ol/Observable";
import { get as projGet } from "ol/proj";
import { layerStyle} from "./layerStyle";
import { Feature, Graticule } from "ol";
import Stroke from "ol/style/Stroke";
import { mapUtils } from "../mapUtils";
import RasterSource from "ol/source/Raster";
//import { GeoTIFFImage } from "geotiff";
import WebGLTile from 'ol/layer/WebGLTile';
import { GeoTIFF as GeoTIFFImage, fromUrl, fromUrls, fromArrayBuffer, fromBlob } from 'geotiff';
import { vectorLayers } from "./vectorLayers";
import { tileUrlHandler } from "./tileUrlHandler";
import { WebGLStyle } from "ol/style/webgl";
import { Point } from "ol/geom";
import WebGLPointsLayer from "ol/layer/WebGLPoints";

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
        case "mvt":
            this.addXYZVectorLayer(lo);
            break;
        case "esri_vector_tile":
            vectorLayers.addESRILayer(lo);
            break;
        case "geotiff" :
            this.addGeoTIFFLayer(lo);
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
        case "csv":
            this.addCSVLayer(lo);
            break;
        case "webglpoints":
            this.addWebGLPointsLayer(lo);
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
        case "label":       // non-layer that is used for displaying information
            return;
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

        let input = {};
        // parse layer object properties from config; and set open layers layer object
        let properties = (lo.source) ? Object.keys(lo.source) : [];
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
                let input2 = {};
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
        if (lo.source && lo.source.tileUrlHandler) {
            let func2 = tileUrlHandler.getTileLoadHandler(lo.source.tileUrlHandler, lo.id);
            if (func2) {
                input["tileLoadFunction"] = func2;
            }
        }

        input["crossOrigin"] = "anonymous";
        input["imageSmoothing"] = false;

//        if (navigator.userAgent.indexOf("Firefox") == -1 && lo.paletteUrl || lo.paletteColorDef) {        
        if (lo.paletteUrl || lo.paletteColorDef) {        
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
                    } else if (data["bypass"]) {
                        if (data["bypass"] == "orange") {
                            // the if statement color relates to GIBS original coloring with values: 217, 95, 2
                            // color is changes due to close match with TSD and MODIS
                            if (pixel[0] > pixel[1]+70 && pixel[0]>pixel[2]+100 && pixel[0] >= 150) {
                                pixel[0] = 255;
                                pixel[1] = 184;
                                pixel[2] = 184;
                            } else {
                                pixel[3] = 0;
                            }
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
                if (lo.paletteColorDef) {
                    // hack to deal with firefox
                    data["bypass"] = lo.paletteColorDef;
                } else {
                    data["colors"] = props.colorLookup[lo.id];
                }
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
    
    public static addWMSLayer(lo : Layer) {        
        let input : any = [];
        // parse layer object properties from config; and set open layers layer object

        let properties = Object.keys(lo.source as LayerSource);
        for (let i = 0; i < properties.length; i++) {
            let key = properties[i];
            if (lo.source) {
                let value = (lo.source as any)[key];
                if (key == "imageLoadFunction") {
                    let all = value.join("");
                    all = all.replace ("#id#", lo.id);
                    input[key] = eval("(" + all + ")");
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
        if (!lo || !lo._layer) { return;}
//        this._GeoJsonRefresh(lo);
//        lo.refresh();
        let source = lo._layer.getSource();
        if (source) { 
            layer.setJsonFeatures(lo, source.getFeatures());
        }
    }

    private static setJsonFeatures(lo:Layer, f : Array <Feature>) {
        if (f.length == 0) {
            return;
        }
        let counter = 0;
        for (let feature in f) {
            if (! f[feature].get("__id")) {
                f[feature].setProperties({"__id" : f[feature].getId()});
            }
            if (lo.jsonSubsetHandler) {
                lo.jsonSubsetHandler(lo, f[feature]);
            }

            f[feature].setId(lo.id + '--' + counter);
            if (lo.icon && lo.icon.indexOf('color:') < 0) {
                f[feature].setProperties({"_icon" : lo.icon});
                f[feature].setProperties({"_scale" : lo.jsonIconRatio});
            }
            counter ++;
        }
    }

    private static _GeoJsonRefresh(lo : Layer) {
        if (!lo._layer) { return; }
        let source = lo._layer.getSource();        
/*        let listenerKey = source.on("change", function(e) {
            e;
            if (source.getState() == "ready") {
                let f = e.target.getFeatures() as Array<Feature>;
                if (f.length == 0) {
                    return;
                }
                //unByKey(listenerKey);
                layer.setJsonFeatures(lo, f);
                events.dispatchLayer(events.EVENT_GEOJSON_LOADED, lo.id);
            }
        });*/
        let listenerKey2 = source.on("featuresloadend", function(e) {
            e;
            if (source.getState() == "ready") {
                let f = e.target.getFeatures() as Array<Feature>;
                if (f.length == 0) {
                    return;
                } else if (lo.saveJSONData) {
                    lo.jsonData = [];
                    for (let i=0; i<f.length; i++) {
                        let p = f[i].getProperties();
                        let obj = {};
                        for (let key in p) {
                            obj[key] = p[key];
                        }
                        lo.jsonData.push(obj);
                    }
                }
                
                //unByKey(listenerKey2);
                layer.setJsonFeatures(lo, f);
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
            } else {
                input[key] = value;
            }
        }
        if (lo.source && lo.source.tileUrlHandler) {
            let func2 = tileUrlHandler.getTileUrlHandler(lo.source.tileUrlHandler, lo.id);
            if (func2) {
                func = func2;
            }
        }
        input["crossOrigin"] = "anonymous";
        if (type == "xyz_vector") {
            vectorLayers.addVectorLayer(lo, layerStyle['_' + lo.source.style]);
//            (lo._layer.getSource() as VectorTileSrc).setTileLoadFunction(func);
        } else {
            lo._layer = new TileLayer({
                source: new XYZ(input),
            });
        }
        if (lo._layer && func) {
            (lo._layer.getSource() as XYZ).setTileUrlFunction(func);
        }
        if ( lo._layer && lo.trackLoading) {
            (lo._layer.getSource() as XYZ).on(TileEventType.TILELOADSTART, function (e) {
                props.tileLoadActive[lo.id] = 1;
                events.dispatchLayer(events.EVENT_LAYER_LOAD_TRACK, lo.id);
            });
            (lo._layer.getSource() as XYZ).on(TileEventType.TILELOADEND, function (e) {
                props.tileLoadActive[lo.id] = 0;
                events.dispatchLayer(events.EVENT_LAYER_LOAD_TRACK, lo.id);
            });
        }

        if (lo._layer && lo.tileErrorUrl) {
            (lo._layer.getSource() as XYZ).on( TileEventType.TILELOADERROR, function (e) {
                layer.loadErrorTile(e, lo.tileErrorUrl as string, lo.showTileError);
            });
        }
          
    //(lo._layer.getSource() as XYZ).setTileUrlFunction(() => layer.test());
    }

    public static loadErrorTile(e, tileUrl : string, showTile : boolean) {
        if (showTile) {
            e.tile.src_ = tileUrl;
        } else {
            e.tile.src_ = '/images/empty_256.png';
        }
        e.tile.load();
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

    public static addGeoTIFFLayer (lo:Layer) {

//        min: min,
//        max: max,
        let source = new GeoTIFF({
            sources: [
              {
                url: lo.source.url,
                min: 200,
                max: 500,
                nodata: 0,
              }
            ]
        });

        lo._layer = new WebGLTile({
            opacity : lo.alpha,
            source: source,
        });
        let img = fromUrl('/tif/OMPS-NPP_NMTO3-L3-DAILY-Ozone-GeoTIFF_v2.1_2022m0101_2022m0103t015721.tif')
            .then(tiff => {
                //console.log(tiff);
                let image = tiff.getImage(0)
                .then (img => {
                    let tiepoint =img.getTiePoints();  
                    let data = img.readRasters().then
                    (mydata => {
                        let w = img.getWidth();
                        let h = img.getHeight();
                        let min = 1000;
                        let max = 0;
                        for (let i=0; i<mydata[0].length; i++) {
                            if (min > mydata[0][i] && mydata[0][i] > 0) {
                                min = mydata[0][i];
                            }
                            if (max < mydata[0][i]) {
                                max = mydata[0][i];
                            }
                        }
                        console.log(min, max);
                    });
                })
            });
    }
    
    public static addStaticImageLayer (lo : Layer) {
        lo._layer = new ImageLayer({
            opacity: 1,
            source: new ImageStatic({
                url: lo.source.url,
                imageSize: [lo.source.imageSize],
                imageExtent: lo.source.imageExtent,
            })
        });
//        imageSize: lo.source.imageSize,
//        imageExtent: lo.sourceImageExtent,
    }
    
    public static addCSVLayer (lo : Layer) {
        let func = layerStyle['_' + lo.source.style];
        lo._layer = new VectorLayer({
            source: new VectorSrc({
                wrapX: true,       
                format: new GeoJSON(),                         
                loader :  function(extent, resolution, projection) {
                    // call json handler 
                    if (lo.csvHandler) {
                        lo.csvHandler(lo);
                    }
                }
            }),
            style: eval(func)
         });
    }

    public static addWebGLPointsLayer (lo : Layer) {
         lo._layer = new WebGLPointsLayer({
            minZoom:lo.minLevel,
            source: new Vector({
                loader :  function(extent, resolution, projection) {
                    // call json handler 
                    if (lo.csvHandler) {
                        lo.csvHandler(lo);
                    }
                },
                wrapX: true,
            }),
            style: lo.styleJSON as WebGLStyle
        });
    }
    public static createFeature(lat : number, lon: number, props : any) : Feature {
        props["geometry"] = new Point([lon, lat]);
        return new Feature(props);
    }
    public static processWebGLPointsLayer(lo : Layer, points:Array<Feature>) {
        if (lo._layer) {
            let src = lo._layer.getSource();
            if (src) {
                (src as Vector).addFeatures(points);
                
            }   
        }
    }

    public static processGeoJsonString(lo:Layer, geojson : string) {
        if (lo._layer) {
            let src = lo._layer.getSource();
            if (src) {
                let features = src.getFormat().readFeatures(geojson); 
                (src as Vector).addFeatures(features);
                let f = (src as Vector).getFeatures();
                let counter = 0;
                for (let feature in f) {        
                    f[feature].setId(lo.id + '--' + counter);
                    counter ++;
                }
                events.dispatchLayer(events.EVENT_GEOJSON_LOADED, lo.id);
                layer.refreshGeoJsonLayer(lo);
            }
        }
    }
    
    public static inRange (lo : Layer) {
        let level = props.map.getView().getZoom();
        if (level && level < lo.minLevel) return false;
        if (level && lo.maxLevel >=0 && level > lo.maxLevel) return false;
        return true;
    }
}
