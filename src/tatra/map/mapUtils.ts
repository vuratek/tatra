import { props, VIEW_MODES } from "./props";
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
import { WKT } from "ol/format";
import { identifyGeoJSON } from "./handlers/identifyGeoJSON";
import { IMenuModuleLayers } from "./defs/ConfigDef";
import { utils } from "../utils";
import { ProductDates } from "./obj/ProductDates";
import { hash } from "./hash";
import { viewMode } from "./components/viewMode";

export interface ICoordinates {
    xmin : number;
    xmax : number;
    ymax : number;
    ymin : number;
}

export interface IPosition {
    x : number;
    y : number;
    zoom : number;
}

//utils
export class mapUtils {

    public static featureLabelAuto : boolean = true;

    public static getLayerById (id : string) : Layer | null {
        for (let i = 0; i < props.layers.length; i++) {
            if (props.layers[i].id == id) {
                return props.layers[i];
            }
        }
        return null;
    }

    public static onSystemDateUpdate() {
        props.time.quickTime = 0;
		if (flatpickr.formatDate(utils.getGMTTime(new Date()),'Y-m-d') == flatpickr.formatDate(props.time.date, 'Y-m-d')) {
			if (props.time.range == 0) { props.time.quickTime = 1; }
			else if (props.time.range == 1) { props.time.quickTime = 24; }
			else if (props.time.range == 6) { props.time.quickTime = 168; }
		}

        let date = props.time.imageryDate;
        let _short = flatpickr.formatDate(date, 'Y-m-d');
        let _full = flatpickr.formatDate(date, 'Y-m-d H:i');
	    for (let i=0; i<props.layers.length; i++) {
            let lo = props.layers[i];
//            if (!lo) { continue; }
            let refresh = false;
            // only time refresh layers that use time and when time has changed enough
            // so don't change daily when only hours or minutes changed
            if (lo.timeStep) {
                if (lo.timeStep == "30m") {
                    if (flatpickr.formatDate(lo.time, 'Y-m-d H:i') != _full) {
                        refresh = true;
                    }
                }
            } else {
                if (flatpickr.formatDate(lo.time, 'Y-m-d') != _short) {
                    refresh = true;
                }
            }
            lo.time = date;
            if (lo.visible && refresh && lo.hasTime === true) {
                lo.refresh();
            }
        }
    }

    public static updateImageryLayers (date:Date) {
	    for (let i=0; i<props.layers.length; i++) {
            let lo = props.layers[i];
            if (!lo) { continue; }
            lo.time = date;
            if (lo.handler && (lo.handler == "imagery" || lo.handler == "orbits" || lo.tag == "sentinel") && ! lo.noDateRefresh) {
                lo.refresh();            
            }
        }
        events.dispatch(events.EVENT_LAYER_DATE_UPDATE);
//	    ui.setInfoStatement();
    }

    public static isImageryOn () : boolean {
        for (let i=0; i<props.layers.length; i++) {
            let lo = props.layers[i];
            if (lo.visible && lo.hasTime === true) {
                return true;
            }
        }
        return false;
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
                this.restoreExclusiveLayer(layer.id);
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
        if (update && ! props.ignoreBasemapUpdate) { 
            // hide imagery layers so it is clear basemap was changed
            for (let i = 0; i < props.layers.length; i++) {
                if (props.layers[i].tag == "imagery" && props.layers[i].visible) {
                    props.layers[i].visible = false;
                }
            }
            this.processExclusiveLayer(props.currentBasemap);
            events.dispatch(events.EVENT_BASEMAP_CHANGE); 
        }
    }

    public static setMapCursor(type?:string | null) {
        let el = document.getElementById('map') as HTMLDivElement;
        if (el) {
            let _type = (type) ? type : 'default';
            el.style.cursor = _type;
        }
    }

    public static resetDynamicLayers() {
		if (!props.allowMultipleDynamicLayers) {
			let counter = 0;
			for (let i=props.layers.length-1; i>=0; i--) {
				let lo = props.layers[i];
				if (lo.category == 'dynamic' && lo.visible) {
					if (counter > 0) {
						lo.visible = false;
					}
					counter++;
				}
			}
			this.callUILayerUpdate(counter);
		}
	}

    public static setOverlay (id : string) {
        for (let i = 0; i < props.layers.length; i++) {
            let lo = props.layers[i];
            if (lo.category != "overlay") {
                continue;
            }
            if (id == lo.id) {
                lo.visible = !lo._visible;
                this.setLabel(id);
            }
            if (id == lo.id && lo.isLabel) {
            	this.setCountryLabel();
            }   
            this.processExclusiveLayer(id);
        }
    }

    public static restoreExclusiveLayer(targetId:string) {
        let counter= 0;
        let lo = this.getLayerById(targetId);
        if (lo && lo.exclusiveSaved) {
            let arr = lo.exclusiveSaved.split(',');
            for (let j=0; j<arr.length; j++) {
                let lo2 = this.getLayerById(arr[j]);
                if (lo2 && ! lo2.visible) {
                    lo2.visible = true;
                    counter++;
                }
            }
            lo.exclusiveSaved = null;
        }
        this.callUILayerUpdate(counter);
    }

    private static callUILayerUpdate(counter:number) {
        if (counter > 0) {
            events.dispatchLayer(events.EVENT_UI_LAYER_UPDATE, '');
        }
    }

    public static processExclusiveLayer(targetId:string) {
        let counter= 0;
        let lo = this.getLayerById(targetId);
        if (lo && lo.exclusive && lo.visible) {
            let arr = lo.exclusive.split(',');
            for (let j=0; j<arr.length; j++) {
                let lo2 = this.getLayerById(arr[j]);
                if (lo2 && lo2.visible) {
                    lo2.visible = false;
                    if (lo.exclusiveSaved) {
                        let arr = lo.exclusiveSaved.split(',');
                        arr.push(lo2.id);
                        lo.exclusiveSaved = arr.join(',');
                    } else {
                        lo.exclusiveSaved = lo2.id;
                    }
                    counter++;
                }
            }
        }
        this.callUILayerUpdate(counter);
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

    public static getDateTimeRange(separator : string = ',') : string {
        if (props.time.rangeMins != 0) {
            let start = flatpickr.formatDate(utils.addMinutes(props.time.date,-props.time.rangeMins), 'Y-m-d H:i');
            let end = flatpickr.formatDate(props.time.date, 'Y-m-d H:i');
            return start + separator + end;
        } 
        return flatpickr.formatDate(utils.addDay(props.time.date, - props.time.range),'Y-m-d') + separator + flatpickr.formatDate(props.time.date, 'Y-m-d');
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

    public static getColorStyle (lo : Layer, target : number = 0, isDefault : boolean = false) : string {
		let colors = (isDefault) ? lo.defaultColor : lo.color;
		if (colors) {
			if (target == 1) {
				return `rgb(${colors[3]},${colors[4]},${colors[5]})`;	
			}
			return `rgb(${colors[0]},${colors[1]},${colors[2]})`;
		}
		return '';
    }
    
    public static getLayerInfoRefLayer(layer_refs: IMenuModuleLayers[], id:string) : IMenuModuleLayers | null {
        if (layer_refs) {
            for (let i=0; i< layer_refs.length; i++) {
                if (layer_refs[i].id == id) {
                    return layer_refs[i];
                }
            }
        }
        return null;
    }

    public static addProductDate (id:string) : ProductDates {
        for (let i=0; i<props.productDates.length; i++) {
            if (props.productDates[i].id == id) {
                return props.productDates[i];
            }
        }
        let pd = new ProductDates(id);
        props.productDates.push(pd);
        return pd;
    }

    public static getProductDate (id:string) : ProductDates | null {
        for (let i=0; i<props.productDates.length; i++) {
            if (props.productDates[i].id == id) {
                return props.productDates[i];
            }
        }
        return null;
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
    public static setCoordPrecision (longitude:number, latitude:number, precision: number) : Array <number> {
        let _coord = new Coord();
        _coord.west = longitude;
        _coord.north = latitude;
        mapUtils.setPrecision(_coord, precision);
        return[_coord.west,_coord.north];
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
        let els = document.getElementsByClassName('mouseCursorPosition');
        if (els) {
            els[0].innerHTML = template.replace('{y}', '--.---').replace('{x}', '--.---');
        }
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
            if (lyr.handler && lyr.visible && lyr.handler == "imagery" && lyr.category == "dynamic") {
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
//        if (navigator.userAgent.indexOf("Firefox") == -1 && lo.initData) {
        if (lo.initData) {
            let arr = lo.initData.split("..");
            if (arr.length == 2) {
                let a1 = Number(arr[0]);
                let a2 = Number(arr[1]);
                lo.variableRange["coloring"] = [a1, a2];
            } else {
                let arr = lo.initData.split(",");
                let arr2 = [];
                for (let i=0; i<arr.length; i++) {
                    arr2.push(Number(arr[i]));
                }
                lo.variableRange["coloringSet"] = arr2;
            }
        }
        if (lo.paletteUrl) {
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
        
        if (lo.variableRange) {
            if (lo.variableRange["coloring"]) {
                this.setColoringRange(lo);
            }
            else if (lo.variableRange["coloringSet"]) {
                this.setColoringSet(lo);
            }
        }   
    }

    private static setColoringRange(lo : Layer) {
        props.colorLookup[lo.id] = {};
        if (! lo.colorPaletteId) { return; }
        let cp = props.colorPalettes[lo.colorPaletteId];
        let start = (lo.variableRange["coloring"]) ? lo.variableRange["coloring"][0] : 1;
        let end = (lo.variableRange["coloring"]) ? lo.variableRange["coloring"][1] : cp.values.length;
        for (let i=0; i < cp.values.length; i++) {
            if (cp.values[i].ref >= start && cp.values[i].ref <= end) {
                let val = this.getColorCombination(cp.values[i].color);
                if (i >= start && i <=end) {
                // c2 = val;            // this will need to reference alternate color
                }
                props.colorLookup[lo.id][val] = cp.values[i].ref;
            }
        }
    }

    private static setColoringSet(lo:Layer) {
        props.colorLookup[lo.id] = {};
        if (! lo.colorPaletteId) { return; }
        let cp = props.colorPalettes[lo.colorPaletteId];
        for (let i=0; i < cp.values.length; i++) {
            for (let j=0; j<lo.variableRange["coloringSet"].length; j++) {
                if (cp.values[i].ref == lo.variableRange["coloringSet"][j]) {
                    let val = this.getColorCombination(cp.values[i].color);
                    props.colorLookup[lo.id][val] = cp.values[i].ref;
                    break;
                }
            }
        }
    }

    private static getColorCombination(color:string):string {
        let c1 = parseInt(color.substring(0,2), 16);
        let c2 = parseInt(color.substring(2,4), 16);
        let c3 = parseInt(color.substring(4,6), 16);
        let c4 = parseInt(color.substring(6,8), 16);
        return `${c1},${c2},${c3},${c4}`;
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

    public static getMapExtent() : Array<number> | null {
        let z = props.map.getView().getZoom();
        let c = props.map.getView().getCenter();
        if (z && c) {
            return [c[0], c[1], z]; // lon, lat, zoom_level
        }
        return null;
    }

    public static getBaseLog( x : number, y : number ) {
        return Math.log(y+1) / Math.log(x+1);
    }

    public static computeZoomLevel(c : ICoordinates, maxZoom : number = 12):IPosition {
        let zoomx = this.getBaseLog((c.xmax - c.xmin), 360);
        let zoomy = this.getBaseLog((c.ymax - c.ymin), 180);        

        zoomx = Math.round(zoomx) + 2;
        zoomy = Math.round(zoomy) + 2;
        let zoom = (zoomx < zoomy) ? zoomy : zoomx;
        let x = (c.xmax - c.xmin) / 2 + c.xmin;
        let y = (c.ymax - c.ymin) / 2 + c.ymin;
        if (zoom == 0) {
            x = 0;
            y = 0;
        }
        if (zoom > maxZoom) { zoom = maxZoom;}
        return { x : x, y : y, zoom : zoom};
    
    }

    public static setInfoLabel(topBar : string, kiosk : string) {
        utils.html('kioskLabel', kiosk);
        utils.html('lmvFeatureInfo1', topBar);
    }
    public static showInfoLabel(show:boolean) {
        if (show) { utils.show('kioskLabel'); }
        else { utils.hide('kioskLabel'); }
    }
    public static setInfoDate(str : string) {
        utils.html('kioskDate', str);
    }

    public static setViewMode() {
        let vm = hash.getViewMode();
        if (!vm || !vm.type) { return; }
        viewMode.updateViewMode(vm.type, false);
    }
    public static renderLayerIcon(lo:Layer) : string {
        let iconStyle = (lo.iconHasBorder) ? '' : ' style="border:none;"';
        let icon = '';
		if (lo.icon && lo.icon.indexOf('color:') == 0) {
			let color = lo.icon.replace('color:', '');
			icon =`<div class="lmvControlsIconDiv" style="background: ${color}"></div>`;
        } else if (lo.icon && lo.icon.indexOf('orbit') == 0) {
            let arr = lo.icon.split('>');
            if (arr.length != 3 || (arr[1] != 'left' && arr[1] != 'right')) { icon = `<div class="lmvControlsIconDiv" style="background: #AAA;"></div>`; }
            else {
                icon = `<div class="lmvControlsIconDiv lmvControlsOrbitIconDiv">${utils.renderOrbitIcon(arr[1],arr[2])}</div>`;
            }
        } else if (lo.iconMatrix && lo.iconMatrix.length == 2) {
            let [size_x, size_y] = (lo.iconSize) ? [lo.iconSize[0], lo.iconSize[1]] : [70, 70];
			let x = lo.iconMatrix[0] * size_x + 9;
			let y = lo.iconMatrix[1] * size_y + 9;
			icon = `<div class="lmvControlsIconDiv" style="background: url(${lo.icon}) ${-x}px ${-y}px;"></div>`;
		} else {
			icon = `<img src="${lo.icon}" ${iconStyle}>`;
        }
        return icon;
    }
}
