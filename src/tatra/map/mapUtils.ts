import { props } from "./props";
import { DragPan } from 'ol/interaction';
import { format } from 'ol/coordinate';
import { MousePosition } from 'ol/control';
import { tools } from "./tools";
import { Coord } from "./obj/Coord";
import { configProps } from "./support/configProps";
import { Map, Feature, View } from 'ol';
import { flatpickr } from "../aux/flatpickr";
import { events } from "./events";
import { Layer } from "./obj/Layer";
import { ColorPalette } from "./obj/ColorPalette";
import RasterSource from "ol/source/Raster";
import { WKT } from "ol/format";
import { identifyGeoJSON } from "./handlers/identifyGeoJSON";

//utils
export class mapUtils {

    public static featureLabelAuto : boolean = true;

    public static getLayerById (id : string) {
        for (let i = 0; i < props.layers.length; i++) {
            if (props.layers[i].id == id) {
                return props.layers[i];
            }
        }
        return null;
    }

    public static updateImageryLayers (date:Date) {
	    for (let i=0; i<props.layers.length; i++) {
            let lo =props.layers[i];
            if (!lo) { continue; }
            lo.time = date;
            if (lo.handler && (lo.handler == "imagery" || lo.handler == "orbits") && ! lo.noDateRefresh) {
                lo.refresh();
            }
        }
        events.dispatch(events.EVENT_LAYER_DATE_UPDATE);
//	    ui.setInfoStatement();
    }

    public static setBasemap (id : string) {
        let update = false;
        for (let i = 0; i < props.layers.length; i++) {
            let layer = props.layers[i];
            if (layer.category != "basemap") {
                continue;
            }
            if (layer.visible && id != layer.id) {
                layer.visible = false;
            }
        }
        for (let i = 0; i < props.layers.length; i++) {
            let layer = props.layers[i];
            if (layer.category != "basemap") {
                continue;
            }
            if (id == layer.id || (id == layer.parent && ! layer.isLabel)) {
                layer.visible = true;
                props.currentBasemap = id;
                update = true;
                if (layer.id == id) {
                    (document.getElementById('map') as HTMLDivElement).style.background = layer.styleBackground;
                }
            }
        }
        this.setCountryLabel();
        if (update) { events.dispatch(events.EVENT_BASEMAP_CHANGE); }
    }

    public static setMapCursor(type?:string | null) {
        let el = document.getElementById('map') as HTMLDivElement;
        if (el) {
            let _type = (type) ? type : 'default';
            el.style.cursor = _type;
        }
    }

    public static setOverlay (id : string) {
        for (let i = 0; i < props.layers.length; i++) {
            let layer = props.layers[i];
            if (layer.category != "overlay") {
                continue;
            }
            if (id == layer.id) {
                layer.visible = !layer._visible;
                this.setLabel(id);
            }
            if (id == layer.id && layer.isLabel) {
            	this.setCountryLabel();
            }
        }
    }

    public static setCountryLabel () {
    	let basemap = null;
    	let basemapLabel = null;
    	let overlay = null;
    	for (let i = 0; i < props.layers.length; i++) {
            let layer = props.layers[i];
            if (layer.category == "basemap" && layer.visible && ! layer.parent) {
            	basemap = layer;
            }
            if (basemap && layer.category == "basemap" && basemap.id == layer.parent && layer.isLabel) {
            	basemapLabel = layer;
            }
            if (layer.category == "overlay" && layer.isLabel) {
            	overlay = layer;
            }
        }

    	if (!basemap || !overlay) { return; }

    	if (basemap.isLabel) {
//    		overlay._visible = false;
    		if (overlay._layer) {
        		overlay._layer.setVisible(false);
    		}
    		// update overlay menu
    	} else if (basemapLabel) {
    		basemapLabel.visible = overlay._visible;
    		if (overlay._layer) {
        		overlay._layer.setVisible(false);
    		}
    	} else {
    		overlay.visible =  overlay._visible;
    	}
    }

    public static setLabel (id : string) {
        for (let i = 0; i < props.layers.length; i++) {
            let layer = props.layers[i];
            if (layer.category != "label") {
                continue;
            }
            if (layer.parent == id) {
                let lo = this.getLayerById(id);
                if (lo) {
                    if (lo.visible) {
                        layer.enableLabel();
                    } else {
                        layer.disableLabel();
                    }
                }
            }
        }
    }

    public static formatPolygon (f:Feature) : string {
        let format = new WKT();
        return format.writeFeature(f);
    }

    public static getCoordinates (type : string) {
        let str = "";
        let data = tools.getTool("selection").data;
        if (!data || data.length == 0) {
            if (type == "simple") {
                return this.formatValues(this.getDefaultCoordinateValues());
            } else {
                return this.formatValuesForSearch(this.getDefaultCoordinateValues());
            }
        }
        let coord = this.getSelectedExtent();
        if (type == "simple") {
            str = this.formatValues(coord);
        } else {
            str = this.formatValuesForSearch(coord);
        }
        if (str == "") {
            if (type == "simple") {
                return this.formatValues(this.getDefaultCoordinateValues());
            } else {
                return this.formatValuesForSearch(this.getDefaultCoordinateValues());
            }
        }
        return str;
    }
    
    public static getDefaultCoordinateValues () {
        return new Coord();
    }

    public static formatValuesForSearch(coord : Coord) {
        let arr = [coord.west.toString(), coord.north.toString(), coord.east.toString(), coord.south.toString()];
        for (let i = 0; i < arr.length; i++) {
            let s = arr[i].toString();
            let pos = s.indexOf(".");
            if (pos <= 0) {
                pos = s.length;
            }
            if (s.length > (pos + 3)) {
                arr[i] = s.substring(0, (pos + 3));
            } else {
                arr[i] = s;
            }
        }
        return "x" + arr[0] + "y" + arr[1] + ",x" + arr[2] + "y" + arr[3];
    }
    
    public static formatValues (coord : Coord) {
        let arr = [coord.west.toString(), coord.north.toString(), coord.east.toString(), coord.south.toString()];
        for (let i = 0; i < arr.length; i++) {
            let s = arr[i].toString();
            let pos = s.indexOf(".");
            if (pos <= 0) {
                pos = s.length;
            }
            if (s.length > (pos + 3)) {
                arr[i] = s.substring(0, (pos + 3));
            } else {
                arr[i] = s;
            }
        }
        return arr.join(", ");
    }
    
    public static setPrecision(coord : Coord, precision : number) {
        let arr = [coord.west, coord.north, coord.east, coord.south,];
        for (let i = 0; i < arr.length; i++) {
            let s = arr[i].toString();
            let pos = s.indexOf(".");
            pos++;
            if (pos <= 1) {
                pos = s.length;
            }
            if (s.length > (pos + precision)) {
                arr[i] = Number(s.substring(0, (pos + precision)));
            } else {
                arr[i] = Number(s);
            }
        }
        coord.west = arr[0];
        coord.north = arr[1];
        coord.east = arr[2];
        coord.south = arr[3];
    }
    public static useDragPan( enabled: boolean) {
        let dragPan;
        props.map.getInteractions().forEach(function(interaction) {
            if (interaction instanceof DragPan) {
                dragPan = interaction;
            }
        });

        if (dragPan) {
            dragPan.setActive(enabled);
        //    if (!enabled) {
//                props.map.removeInteraction(dragPan);
        //    }
        }
    }
    public static clearElement (id:string) {
        let el = document.getElementById(id);
        if (!el) { return; }
        while (el.hasChildNodes()) {
            el.removeChild(el.lastChild as ChildNode);
        }
        return el;
    }
    public static setInfoBar () {
        let el = document.getElementById("lmvInfoBar");
        if (!el) {
            return;
        }
        let template = "Lat: {y}&deg;, Lon: {x}&deg;";
        let mousePositionControl = new MousePosition({
            coordinateFormat: function(coord) {
                return format(coord, template, configProps.locationDecimals);
            },
            projection: "EPSG:4326",
            className: "mouseCursorPosition",
            target: document.getElementById("lmvMousePosition"),
            undefinedHTML: "&nbsp;",
        });
        props.map.addControl(mousePositionControl);
        props.map.on("pointermove", function(evt) {
            if (evt.dragging) {
                return;
            }
            let pixel = (props.map as Map).getEventPixel(evt.originalEvent);
            mapUtils.displayFeatureInfo(pixel);
    		if (props.config.components["infoBar"]["featurePixel"] == "enabled") {
                console.log("need pixel translation");
    			//mapUtils.displayPixelRange(pixel);
    		}
        });
    }
    public static displayFeatureInfo (pixel : Array <number>) {
        let id = "";
        let feature = (props.map as Map).forEachFeatureAtPixel(pixel, function(feature, layer) {
            if (layer) { id = layer.get("id"); }
            return feature;
        });
        let info = document.getElementById("lmvFeatureInfo1") as HTMLDivElement;
        if (feature) {
            if (id == "selCountry" || id == "selCountry2") {
                info.innerHTML = feature.get("name");
//                info.innerHTML = feature.get("CNTRY_NAME");
            } else if (id == "selTile") {
                let h = feature.get("h");
                let v = feature.get("v");
                info.innerHTML = "H: " + h + ", V: " + v;
            } else if (id == "selSite") {
                let si = feature.get("site_name_full");
                if (!si || si == "") {
                    si = "N/A";
                }
                let network = feature.get("Network");
                id = feature.get("Site_Id");
                let str = si + " [" + id + "] - " + network;
                str = str.substring(0, 40);
                info.innerHTML = str;
            }
        } else {
            if (this.featureLabelAuto) {
                info.innerHTML = "&nbsp;";
            }
        }
    }
/*    public static displayPixelRange (pixel : Array <number>) {
        let canvasContext = $('.ol-unselectable')[0].getContext('2d');
        let coef = window.devicePixelRatio;
        let data = canvasContext.getImageData(pixel[0] * coef, pixel[1] * coef, 1, 1).data;
        //console.log('rgb(' + data[0] + ',' + data[1] + ','+ data[2] + ')');
        let c = document.getElementById("lmvFeatureInfoPixelLegend");
        let ctx = c.getContext("2d");
        let imgData = ctx.createImageData(15, 15);
        for (let i = 0; i < imgData.data.length; i += 4) {
          imgData.data[i + 0] = data[0];
          imgData.data[i + 1] = data[1];
          imgData.data[i + 2] = data[2];
          imgData.data[i + 3] = data[3];
        }
        ctx.putImageData(imgData, 0, 0);
        if (props.config.components["infoBar"]["featurePixelFormat"]) {
        	let func = props.config.components["infoBar"]["featurePixelFormat"];
        	eval(func +'(' + data[0] +', '+data[1] + ',' +data[2] + ')');
        }
    }*/
    public static setFeatureInfo(id : string, text : string) {
    	let el = document.getElementById('lmvFeatureInfo' + id);
    	if (el) {
    		el.innerHTML = text;
    	}
    }
    public static setImageryInfo () {
        let txt = document.getElementById('lmvFeatureInfo2');
        if (! txt ) { return; }
        for (let i=0; i<props.layers.length; i++) {
            let lyr = props.layers[i];
            if (lyr.handler && lyr.visible && lyr.handler == "imagery" && lyr.category == "basemap") {
                txt.innerHTML = lyr.title + ' ' + flatpickr.formatDate(lyr.time, 'M d Y');
                return;
            }
        }
        txt.innerHTML = '&nbsp;';
    }
    public static getIEVersion () : number {
        let sAgent = window.navigator.userAgent;
        let Idx = sAgent.indexOf("MSIE");
        // If IE, return version number.
        if (Idx > 0) {
            return parseInt(sAgent.substring(Idx + 5, sAgent.indexOf(".", Idx)));
        }
        // If IE 11 then look for Updated user agent string.
        else if (navigator.userAgent.match(/Trident\/7\./)) {
            return 11;
        } else { //It is not IE
            return 0;
        }
    }

    public static zoomTo(x : number, y: number, level : number) {
        if (level < 2 || level > 14) { return; }
        let view = props.map.getView();
        view.setCenter([x,y]);
        view.setZoom(level);
        identifyGeoJSON.hide();
    }

    public static tile2coord (x : number, y : number, z : number) : string {
        return this.tile2long(x,z) + ',' + this.tile2lat(y+1,z) + ',' + this.tile2long(x+1,z) + ',' + this.tile2lat(y,z);
    }

    public static tile2long (x : number, z : number) : number {
        return (x/Math.pow(2,z+1)*360-180);
    }

    public static tile2lat (y : number, z : number) : number {
        return ((Math.pow(2,z) - y)/Math.pow(2,z)*180-90);
    }

    public static padNum (num : number, size : number) : string {
        let s = "000000000" + num.toString();
        return s.substr(s.length-size);
    }

    // in some instances javascript reads json directly, otherwise parse is needed
    public static parseJSON (result : string) {
        let str;
        try {
            str = JSON.parse(result);
        } catch (e) {
            str = result;
        }
        return str;
    }

    public static readColorMap (lo : Layer) {
        if (navigator.userAgent.indexOf("Firefox") == -1 && lo.initData) {
            var arr = lo.initData.split("..");
            if (arr.length == 2) {
                let a1 = Number(arr[0]);
                let a2 = Number(arr[1]);
                lo.variableRange["coloring"] = [a1, a2];
            }
        }
        if (lo.paletteUrl) {
//            ajax.get(lo.paletteUrl as string, null, (data:any) => this.processColorMap(lo, data));
            fetch(lo.paletteUrl)
            .then(response => {
                if (response.status == 404) {
                    throw new TypeError("No palette.");
                }
                return response.text();
            })
            .then (data => {
                mapUtils.processColorMap(lo, data);                
            })
            .catch(error => {});
        }
	}

	private static processColorMap (lo : Layer, data : any) {
        let cp = new ColorPalette();
        cp.ingest(data);
        if (!props.colorPalettes[cp.id]) {
            props.colorPalettes[cp.id] = cp;
        }
        lo.colorPaletteId = cp.id;
        this.prepareColors(lo);
        events.dispatch(events.EVENT_COLOR_PALETTE_LOADED);
    }
    
    public static prepareColors (lo : Layer) {
        if (! lo.colorPaletteId) { return; }
        props.colorLookup[lo.id] = {};
        let cp = props.colorPalettes[lo.colorPaletteId];
        let start = (lo.variableRange && lo.variableRange["coloring"]) ? lo.variableRange["coloring"][0] : 1;
        let end = (lo.variableRange && lo.variableRange["coloring"]) ? lo.variableRange["coloring"][1] : cp.values.length;
        for (let i=0; i < cp.values.length; i++) {

            if (cp.values[i].ref >= start && cp.values[i].ref <= end) {
                let c1 = parseInt(cp.values[i].color.substring(0,2), 16);
                let c2 = parseInt(cp.values[i].color.substring(2,4), 16);
                let c3 = parseInt(cp.values[i].color.substring(4,6), 16);
                let c4 = parseInt(cp.values[i].color.substring(6,8), 16);
                let val = `${c1},${c2},${c3},${c4}`;
                if (i >= start && i <=end) {
                // c2 = val;            // this will need to reference alternate color
                }
                props.colorLookup[lo.id][val] = cp.values[i].ref;
            }
        }
    }

    public static generateColorPaletteLegend(divId: string, cp : ColorPalette, width : number, height:number, min:number, max:number) {
        let c = document.getElementById(divId) as HTMLCanvasElement;
		if (c) {
			let ctx = c.getContext("2d");
			if (ctx && cp.values.length > 0) {
                let step = width / cp.values.length;
				for (let i=0; i<cp.values.length; i++) {
					if (cp.values[i].ref >= min && cp.values[i].ref <= max) {
						let c1 = parseInt(cp.values[i].color.substring(0,2), 16);
						let c2 = parseInt(cp.values[i].color.substring(2,4), 16);
						let c3 = parseInt(cp.values[i].color.substring(4,6), 16);
						ctx.beginPath();
						ctx.fillStyle = `rgb(${c1},${c2},${c3})`;
						ctx.fillRect(i*step, 0, step+1, height);
                    }
				}
			}
		}
    }

    public static analyticsTrack (val : string) {}

/*    public static analyticsTrack (val) {
        if (props.analytics && props.analyticsToolEvent) {
            let _evt = props.analyticsToolEvent;
            let obj = {'event' : _evt};
            obj[_evt] = {'id' : val};
            dataLayer.push(obj);
        }
    }*/
}
