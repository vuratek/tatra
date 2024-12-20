// path:#l=layer1,layer2:D,layer3:N,layer3:D-434321-N-123412;d=2020-01-20..2020-01-25,2020-01-22;t=ba;@43.45,21.23,5.4z
import { events } from "./events";
import { props, VIEW_MODES } from "./props";
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
export interface IHashViewMode {
    type?       : VIEW_MODES;
    components? : string[] | null;
}
interface IHash {
    tab?            : string;
    layers?         : Array <IHashLayer>;
    initLayers?     : Array <IHashLayer> | null;
    dates?          : IHashDates;
    mode?           : Array<string>;
    tool?           : string;
    viewMode?       : IHashViewMode;
}

export class hash {

    private static values : IHash = {};
    private static readonly delimiter : string = ';';
    private static currentHash : string = '';
    private static previousHash : string = '';

    public static EVENT_HASH_CHANGE : string = 'hash_changed';

    public static minuteConversion = {
        "15mins"    : 15,
        "30mins"    : 30,
        "45mins"    : 45,
        "1hr"       : 60,
        "2hrs"      : 120,
        "3hrs"      : 180,
        "4hrs"      : 240,
        "5hrs"      : 300,
        "6hrs"      : 360,
        "7hrs"      : 420,
        "8hrs"      : 480,
        "9hrs"      : 540,
        "10hrs"     : 600,
        "11hrs"     : 660,
        "12hrs"     : 720
    };

    public static init() {
        window.addEventListener(this.EVENT_HASH_CHANGE, (evt)=> this.updateHash(evt));
        setInterval(this.hashUpdate, 750);
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

    public static newMode(id:string | null, update:boolean) {
        if (id) {
            this.values.mode = [];
            this.values.mode.push(id);
        } else {
            this.values.mode = undefined;
        }
        if (update) { this.update(); }
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

    public static viewMode(viewMode : VIEW_MODES, components : Array<string>, update : boolean = true) {
        if (!this.values.viewMode) { this.values.viewMode = {}; }
        this.values.viewMode.type = viewMode;
        if (components.length > 0) {
            this.values.viewMode.components = components;
        } else {
            this.values.viewMode.components = null;
        }
        if (update) { this.update(); }
    }
    public static getViewMode() : IHashViewMode | null {
        return (this.values.viewMode) ? this.values.viewMode : null;
    }

    private static viewModeToString() : string | null {
        if (this.values.viewMode) 
        if (this.values.viewMode && this.values.viewMode.type && this.values.viewMode.type != VIEW_MODES.NORMAL ) {
            let c = '';
            if (this.values.viewMode.components) {
                c = `[${this.values.viewMode.components.join(',')}]`;
            }
            return `v:${this.values.viewMode.type}${c}`;
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

    public static hashLayerToString(layers : Array<IHashLayer>) : string | null {
        let lyrs:Array<string> = [];
        for (let i=0; i< layers.length; i++) {
            let lyr = layers[i];
            if (lyr.layerId) {
                let str = lyr.layerId;
                if (lyr.classifier) {
                    str += `=${lyr.classifier}`;
                }
                lyrs.push(str);
            }
        }
        if (lyrs.length > 0) {
            return lyrs.join(',');
        }
        return null;
    }

    public static layersToString () : string | null {
        if (! this.values.layers || this.values.layers.length == 0) {
            return null;
        }
        /*let lyrs:Array<string> = [];
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
        }*/
        let str = this.hashLayerToString(this.values.layers);
        if (str) {
            return `l:${str}`;
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
            if (! lo || (lo.tag != '')) {
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
        // if dt.single, it means imagery is turned on
        if (!dt.start && dt.single) {
            return `d:${dt.single}`;
        }
        if (dt.start && dt.end && dt.single) {
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
        let dates:IHashDates = {};
        dates.start = arr2[0];
        dates.end = (arr2.length == 2) ? arr2[1] : dates.start;
        dates.single = (arr.length == 2) ? arr[1] : dates.start;
        dates = this.validateDates(dates);
        if (props.version > '1.0.0') {
            this.values.dates = dates;
        } else {
            this.values.dates = this.convertDates(dates);
        }        
    }

    public static getNumDays(days:string) : number {
        switch (days) {
            case "24hrs" : return 1;
            case "48hrs" : return 2;
            case "72hrs" : return 3;
            case "7days" : return 6;
        }
        return 0;
    }

    private static validateDates(dates:IHashDates) : IHashDates {
        if ((dates.start as string).length > 10 || (dates.end as string).length > 10 || (dates.single as string).length > 10) {
            dates.start = "today";
            dates.end = "today";
            dates.single = "today";
        }
        return dates;
    }

    private static getDateValue(val: string) : string {
        let date = utils.getGMTTime(new Date());
        if (val == "today"){
           return flatpickr.formatDate(date, 'Y-m-d');
        } else if (val == "24hrs" || val == "48hrs" || val == "72hrs" || val == "7days") {
            return flatpickr.formatDate(utils.addDay(utils.getGMTTime(new Date()), - this.getNumDays(val)), 'Y-m-d');
        } else if (val.indexOf('hr') > 0 || val.indexOf('mins') > 0) {
            let mins = this.getMinutesValue(val);
            date.setMinutes(Math.floor(date.getMinutes() / 10) * 10.0);
            date.setSeconds(0);
            date = utils.addMinutes(date, -mins);
            return flatpickr.formatDate(date, 'Y-m-d H:i');
        }
        // this should be in YYYY-MM-DD format
        return val;
    }

    public static getMinutesValue(val : string) : number {
        let mins = 0;
        if (val.indexOf('hr') > 0 || val.indexOf('mins') > 0) {
            // checking for subdaily pre-set values
            for (let m in hash.minuteConversion) {
                if (m == val) {
                    mins = hash.minuteConversion[m];
                    break;
                }
            }
            if (mins == 0 && val.indexOf('mins') > 0) {
                mins = parseInt(val.replace('mins', ''));
                if (mins < 1 || mins > 1440) {
                    mins = 10;
                }
            }
        }
        return mins;
    }

    // transcribe dates if they contain 'today', '24hrs', ...
    public static convertDates(dates:IHashDates) : IHashDates {
        let hd:IHashDates = {};
        let start = dates.start;
        if (! dates.end) {
            dates.end = dates.start;
        }
        hd.start = this.getDateValue(dates.start as string);
        hd.end = dates.end;
        let mins = this.getMinutesValue(dates.end);
        if (start == "today" || start == "24hrs" || start == "48hrs" || start == "72hrs" || start == "7days") {
            hd.end = flatpickr.formatDate(utils.getGMTTime(new Date()), 'Y-m-d');
        } else if (mins > 0) {
            let date = utils.getGMTTime(new Date());
            date.setMinutes(Math.floor(date.getMinutes() / 10) * 10.0);
            date.setSeconds(0);
            hd.end = flatpickr.formatDate(date, 'Y-m-d H:i');
        }
        if (dates.single) {
            let smins = this.getMinutesValue(dates.single);
            if (smins > 0) {
                let date = utils.getGMTTime(new Date());
                date.setMinutes(Math.floor(date.getMinutes() / 10) * 10.0);
                date.setSeconds(0);
                date = utils.addMinutes(date, -smins);
                hd.single = flatpickr.formatDate(date, 'Y-m-d H:i');
            } else {
                hd.single = this.getDateValue(dates.single as string);
            }
        }
        return hd;
    }

    public static getDates() : IHashDates | null {
        return (this.values.dates) ? this.values.dates : null;
    }

    public static locationToString() : string {
        let zoom = props.map.getView().getZoom();
        if (zoom) {
            let c = props.map.getView().getCenter();
            if (c == undefined || isNaN(c[0]) || isNaN(c[1])) { return ''; }
            let decimals = (zoom >= 9.0) ? 2 : 1;
            return `@${c[0].toFixed(decimals)},${c[1].toFixed(decimals)},${zoom.toFixed(decimals)}z`;
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
        let viewMode = this.viewModeToString();
        if (tab) { arr.push(tab); }
        if (mode) { arr.push(mode); }
        if (dates) { arr.push(dates); }
        if (lyrs) { arr.push(lyrs); }
        if (viewMode) { arr.push(viewMode); }
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

    private static parseViewMode(tool:string) {
        let arr = tool.replace(']', '').split('[');
        this.values.viewMode = {};
        this.values.viewMode.type = VIEW_MODES.NORMAL;
        if (arr[0] == VIEW_MODES.KIOSK || arr[0] == VIEW_MODES.MAX || arr[0] == VIEW_MODES.NORMAL) {
            this.values.viewMode.type = arr[0] as VIEW_MODES;
            this.values.viewMode.components = null;
            if (arr.length == 2) {
                let comp = []
                let arr2 = arr[1].split(',');
                for (let i=0; i<arr2.length; i++) {
                    let c = arr2[i];
                    if (c == 'identify' || c == 'menu' || c == '3d') {
                        comp.push(c);
                    }
                }
                if (comp.length > 0) {
                    this.values.viewMode.components = comp;
                }
            }
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
                        if (parseFloat(z) >= configProps.minZoom && parseFloat(z) <= configProps.maxZoom) { 
                            configProps.zoom = parseFloat(z); 
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
                    case 'v':
                        this.parseViewMode(PAR);
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
                                    zoomSet = false;
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
                                    zoomSet = false;
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