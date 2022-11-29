// path:#l=layer1,layer2:D,layer3:N,layer3:D-434321-N-123412;d=2020-01-20..2020-01-25,2020-01-22;t=ba;@43.45,21.23,5.4z
import { events } from "./events";
import { props } from "./props";
import { configProps } from "./support/configProps";
import { coreUtils } from "./support/coreUtils";
import { utils } from "../utils";
import { flatpickr } from "../aux/flatpickr";
import { mapUtils } from "./mapUtils";

export interface IHashLayer {
    layerId     : string;
    classifier? : string;
}
export interface IHashDates {
    start?      : string;
    end?        : string;
    single?     : string;
}
interface IHash {
    tab?            : string;
    layers?         : Array <IHashLayer>;
    initLayers?     : Array <IHashLayer> | null;
    dates?          : IHashDates;
    mode?           : Array<string>;
    tool?           : string;
}
export class hash {

    private static values : IHash = {};
    private static readonly delimiter : string = ';';
    private static currentHash : string = '';
    private static previousHash : string = '';

    public static EVENT_HASH_CHANGE : string = 'hash_changed';

    public static init() {
        window.addEventListener("hashchange", (evt)=> this.updateHash(evt));
        setInterval(this.hashUpdate, 1500);
    }

    public static tab (id : string | null, update : boolean = true) {
        if (!id) {
            delete this.values.tab;
        } else {
            this.values.tab = id;
        }
        if (update) { this.update(); }
    }

    private static updateHash(evt : Event) {
        if (this.currentHash != window.location.hash) {
            this.parse();
            events.dispatch(events.EVENT_EXTERNAL_HASH_UPDATE);
        }
    }

    private static hashUpdate() {
        if (hash.previousHash != hash.currentHash) {
            hash.previousHash = hash.currentHash;
            location.replace("#" + hash.currentHash.replace('#', '')); 
            events.updateHash();
        }
        
    }

    public static getTab() : string {
        return (this.values.tab) ? this.values.tab : '';
    }

    private static tabToString () : string | null {
        if (this.values.tab) {
            return `t:${this.values.tab}`;
        }
        return null;
    }

    public static mode (id : string, update : boolean = true) {
        if (! this.values.mode) {
            this.values.mode = [];
        }
        let isNew = true;
        for (let i=0; i<(this.values.mode as Array<string>).length; i++) {
            if (this.values.mode[i] == id) {
                isNew = false;
                break;
            }
        }
        if (isNew) {
            this.values.mode.push(id);
        }
        if (update) { this.update(); }
    }

    public static deleteMode(id:string, update : boolean = true) {
        if (! this.values.mode) { return;}
        for (let i=0; i<(this.values.mode as Array<string>).length; i++) {
            if (this.values.mode[i] == id) {
                this.values.mode.splice(i,1);
                break;
            }
        }
        if (this.values.mode.length == 0) {
            delete this.values.mode;
        }
        if (update) { this.update(); }
    }

    public static getMode() : Array<string> | null {
        return (this.values.mode) ? this.values.mode : null;
    }

    private static modeToString () : string | null {
        if (this.values.mode) {
            return `m:${this.values.mode.join(',')}`;
        }
        return null;
    }

    public static layers (lyrs : Array<IHashLayer> | null, update : boolean = true) {
        delete this.values.layers;
        if (lyrs) {
            let l = {};
            let l2 = [];
            for (let i=0; i < lyrs.length; i++) {
                let val = lyrs[i].layerId;
                if (! l[val]) {
                    l[val] = 1;
                    l2.push(lyrs[i]);
                }
            }
            this.values.layers = l2;
        }
        if (update) { this.update(); }
    }

    public static layersToString () : string | null {
        if (! this.values.layers || this.values.layers.length == 0) {
            return null;
        }
        let lyrs = [];
        for (let i=0; i< this.values.layers.length; i++) {
            let lyr = this.values.layers[i];
            if (lyr.layerId) {
                let str = lyr.layerId;
                if (lyr.classifier) {
                    str += `=${lyr.classifier}`;
                }
                lyrs.push(str);
            }
        }
        if (lyrs.length > 0) {
            return `l:${lyrs.join(',')}`;
        }
        return null;
    }

    private static parseLayers ( par : string ) {
        let arr = par.split(',');
        let isInit = false;
        if (!this.values.initLayers) {
            isInit = true;
            this.values.initLayers = [];
        }
        this.values.layers = [];
        for (let i=0; i < arr.length; i++) {
            let lo = mapUtils.getLayerById(arr[i]);
            if (! lo || (lo.tag != '' && lo.tag != 'sentinel')) {
                let subs = arr[i].split('=');
                if (subs.length == 2) {
                    this.values.layers.push({ layerId: subs[0], classifier: subs[1]});
                    if (isInit) { this.values.initLayers.push({ layerId: subs[0], classifier: subs[1]});}
                } else {
                    this.values.layers.push({ layerId: arr[i]});
                    if (isInit) { this.values.initLayers.push({ layerId: arr[i]});}
                }
            } else {
                if (lo.category == "basemap") {
                    this.hideInitialBasemap();
                }
                lo.initVisibility = true;
            }
        }
        if (this.values.layers.length == 0) {
            delete this.values["layers"];
        }
    }

    private static hideInitialBasemap() {
        for (let i=0; i<props.layers.length; i++) {
            if (props.layers[i].category == 'basemap') {
                props.layers[i].initVisibility = false;
            }
        }
    }

    public static getLayers() : Array<IHashLayer> | null {
        return (this.values.layers) ? this.values.layers : null;
    }

    public static getInitialLayers() : Array<IHashLayer> | null {
        return (! this.values.initLayers || this.values.initLayers.length == 0) ? null : this.values.initLayers;
    }

    public static dates (dates : IHashDates | null, update : boolean = true) {
        delete this.values.dates;
        if (dates) {
            this.values.dates = dates;
        }
        if (update) { this.update(); }
    }

    public static datesToString () : string | null {
        if (! this.values.dates) {
            return null;
        }
        let dt = this.values.dates;
        if (!dt.start && dt.single) {
            return `d:${dt.single}`;
        }
        if (dt.start && dt.end && dt.single) {
            if (dt.start == dt.end && dt.single == dt.start) {
                return `d:${dt.single}`;
            }
            if (dt.start != dt.end) {
                return `d:${dt.start}..${dt.end},${dt.single}`;
            }
            return `d:${dt.start},${dt.single}`;
        }
        if (dt.start && dt.single) {
            return `d:${dt.start},${dt.single}`;
        }
        if (dt.start && dt.end) {
            if (dt.start == dt.end) {
                return `d:${dt.start}`;
            }
            return `d:${dt.start}..${dt.end}`;
        } else if (dt.start) {
            return `d:${dt.start}`;
        }
        return null;
    }

    private static parseDates ( str : string ) {
        let arr = str.split(',');
        let arr2 = arr[0].split('..');
        let start = arr2[0];
        let end = (arr2.length == 2) ? arr2[1] : start;
        if (start == "today" || start == "24hrs" || start == "48hrs" || start == "72hrs" || start == "7days") {
            if (start == "24hrs") {
                start = flatpickr.formatDate(utils.addDay(utils.getGMTTime(new Date()), -1), 'Y-m-d');
            } else if (start =="48hrs") {
                start = flatpickr.formatDate(utils.addDay(utils.getGMTTime(new Date()), -2), 'Y-m-d');
            } else if (start =="72hrs") {
                start = flatpickr.formatDate(utils.addDay(utils.getGMTTime(new Date()), -3), 'Y-m-d');
            } else if (start =="7days") {
                start = flatpickr.formatDate(utils.addDay(utils.getGMTTime(new Date()), -6), 'Y-m-d');
            } else {
                start = flatpickr.formatDate(utils.getGMTTime(new Date()), 'Y-m-d');
            }
            end = flatpickr.formatDate(utils.getGMTTime(new Date()), 'Y-m-d');
        }
        let single = (arr.length == 2) ? arr[1] : start;
        if (start.length > 10 || end.length > 10 || single.length > 10) {
            start = flatpickr.formatDate(utils.getGMTTime(new Date()), 'Y-m-d');
            end = flatpickr.formatDate(utils.getGMTTime(new Date()), 'Y-m-d');
            single = flatpickr.formatDate(utils.getGMTTime(new Date()), 'Y-m-d');
        }
        this.values.dates = {start : start, end : end, single : single};
    }

    public static getDates() : IHashDates | null {
        return (this.values.dates) ? this.values.dates : null;
    }

    public static locationToString() : string {
        let zoom = props.map.getView().getZoom();
        if (zoom) {
            let c = props.map.getView().getCenter();
            if (c == undefined || isNaN(c[0]) || isNaN(c[1])) { return ''; }
            return `@${c[0].toFixed(1)},${c[1].toFixed(1)},${zoom.toFixed(0)}z`;
        }
        return '@0,0,2';
    }

    public static update () {
        let arr = [];

        let tab = this.tabToString();
        let mode = this.modeToString();
        let dates = this.datesToString();
        let lyrs = this.layersToString();
        let loc = this.locationToString();
        if (tab) { arr.push(tab); }
        if (mode) { arr.push(mode); }
        if (dates) { arr.push(dates); }
        if (lyrs) { arr.push(lyrs); }
        if (loc) { arr.push(loc); }

        if (arr.length > 0) {
            this.currentHash = "#" + arr.join(this.delimiter);
//            location.replace("#" + arr.join(this.delimiter)); 
        }  
        //events.updateHash();
    }

    public static getCurrentHash() : string {
        return this.currentHash;
    }

    private static parseTool(tool:string) {
        if (tool == 'location' || tool == 'measure') {
            this.values.tool = tool;
        }
    }

    public static getTool() : string | null {
        return (this.values.tool) ? this.values.tool : null;
    }

    public static parse() {
        let str = window.location.hash;
        this.currentHash = str;
        if (!(str && str != '')) {
            return;
        }
        let arr = str.substr(1).split('@');
        let zoomSet = false;
        let cExt = configProps.center;
        let cZoom = configProps.minZoom;
        if (arr.length == 2) {
            let points = arr[1].split(',');
            if (points.length == 3) {
                let x = points[0];
                let y = points[1];
                if (coreUtils.checkValidLatLon(x, false) && coreUtils.checkValidLatLon(y, true)) { 
                    configProps.center = [Number(x),Number(y)];
                    if (points[2].indexOf('z')) {
                        let z = points[2].replace('z','');
                        if (parseInt(z) >= configProps.minZoom && parseInt(z) <= configProps.maxZoom) { 
                            configProps.zoom = parseInt(z); 
                        }
                    }
                    zoomSet = true;
                }
            }
        }
        let pars = arr[0].split(';');
        
        for (let i=0; i<pars.length; i++) {
            let arr = pars[i].split(':');
            if (arr.length == 2) {
                let PAR = decodeURIComponent(arr[1]);
                switch (arr[0]) {
                    case 'l':
                        this.parseLayers(PAR);
//                        configProps.layers = PAR;
                        break;
                    case 't':
                        this.values.tab = PAR;
//                        configProps.tab = PAR;
                        break;
                    case 'tool' : 
                        this.parseTool(PAR);
                        break;
                    case 'm':
                        this.values.mode = PAR.split(',');
                        break;
                    // date / dates
                    case 'd':
                        this.parseDates(PAR);
//                        configProps.dates = PAR;
                        break;
                    // interest
                    case 'i':
                        if (arr[1].indexOf("POLYGON") >= 0) {
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

}