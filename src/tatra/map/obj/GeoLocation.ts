import { Coord } from "./Coord";
import { mapUtils } from "../mapUtils";
import { Feature, Overlay } from "ol";
import { Vector as VectorSrc } from "ol/source";
import OverlayPositioning from "ol/OverlayPositioning";
import { props } from "../props";
import { Style, Icon } from "ol/style";
import { Point } from "ol/geom";
import { Vector } from "ol/layer";
import { utils } from "../../utils";


export class GeoLocationSave {
    public magicKey         : string | null = null;
    public coord            : Array <number> | null = null;
    public address          : string | null = null;
    public city             : string | null = null;
    public region           : string | null = null;
}
export class GeoLocation {
    public magicKey         : string | null = null;
    public coord            : Array <number> | null = null;
    public latitude         : number = 0;       // formated lat
    public longitude        : number = 0;       // formated lon
    public address          : string | null = null;
    public city             : string | null = null;
    public region           : string | null = null;
    public id               : number = 0;
    public active           : boolean = true;
    public reposition       : boolean = true;
    private isMyLocation    : boolean = false;
    private divElement      : HTMLDivElement | null = null;
    private feature         : Feature | null = null;
    private overlay         : Overlay | null = null;
    private static layer    : Vector | null = null;


    public static list : Array <GeoLocation> = [];
    public static currentID : number = 0;
    public static allowMultipleLocations : boolean = false;
    public static savedLocations : Array <GeoLocationSave> = [];
    public static readonly EVENT_GEOLOCATION_UPDATE     : string = "geolocation_update";

    public constructor() {
        if (! GeoLocation.allowMultipleLocations) {
            GeoLocation.clearAll();
        }
        this.id = GeoLocation.currentID++;
        GeoLocation.list.push(this);
    }

    public setCoords (coord : Array <number>) {
        this.coord = coord;
        [this.longitude, this.latitude]= mapUtils.setCoordPrecision(coord[0], coord[1], 4);
    }

    public setInfo (info : any) {
        this.city = info["City"] ? info["City"] : '';
        this.region = (info["Region"]) ? info["Region"] : '';
        this.address = (info["LongLabel"]) ? info["LongLabel"] : '';
    }

    public render() {
        GeoLocation.setLayer();
        if (! this.divElement) {
            GeoLocation._render(this);
        }
        if (! this.overlay) {
            this.overlay = new Overlay({
                insertFirst : false,
                element: this.divElement,
                offset: [0, -200],
                positioning: OverlayPositioning.TOP_CENTER
            });
            if (props.map) {
                props.map.addOverlay(this.overlay as Overlay);
            }
            utils.setClick(`locatorClose-${this.id}`, ()=>this.hide());
        }
        if (this.overlay) {
            this.overlay.setPosition(this.coord as number []);
            let offY = -180;
            if (this.divElement) {
                offY = -(this.divElement.offsetHeight + 40);
            }
            this.overlay.setOffset([0, offY]);
        }
        this.updateSaveBtn();

        if (! this.feature) {
            let iconStyle = new Style({
                image: new Icon({
                anchor: [0.5, 1],
                scale: [0.5, 0.5],
                anchorXUnits: 'fraction',
                anchorYUnits: 'fraction',
                src: '/images/map-pin.png',
                }),
            });
            this.feature = new Feature({
                geometry: new Point(this.coord as number [])
            });
            this.feature.setStyle(iconStyle);
            if (GeoLocation.layer && GeoLocation.layer.getSource()) {
                GeoLocation.layer.getSource().addFeature(this.feature);
            }
        }
        this.feature.setGeometry(new Point(this.coord as number []));
        utils.setClick(`locator-save-${this.id}`, ()=> this.save());
    }

    private save() {
        let found = false;
        for (let i=0; i<GeoLocation.savedLocations.length; i++) {
            let sg = GeoLocation.savedLocations[i];
            if ((sg.coord && this.coord && sg.coord[0] == this.coord[0] && sg.coord[1] == this.coord[1]) || 
                (sg.magicKey && this.magicKey && sg.magicKey == this.magicKey)) {
                found = true;
            }
        }
        if (! found) {
            let sg = new GeoLocationSave();
            sg.coord = this.coord;
            sg.magicKey = this.magicKey;
            sg.region = this.region;
            sg.address = this.address;
            sg.city = this.city;
            GeoLocation.savedLocations.push(sg);
            GeoLocation.refreshGeoLocations();
            GeoLocation.updateLocalStorage();
        }
        this.updateSaveBtn();
    }

    private updateSaveBtn () {
        let el = document.getElementById(`locator-save-${this.id}`) as HTMLDivElement;
        if (!el) { return; }
        for (let i=0; i<GeoLocation.savedLocations.length; i++) {
            let sg = GeoLocation.savedLocations[i];
            if ((sg.coord && this.coord && sg.coord[0] == this.coord[0] && sg.coord[1] == this.coord[1]) || (sg.magicKey && sg.magicKey == this.magicKey)) {
                el.innerHTML = `<span><i class="fa fa-check" aria-hidden="true"></i></span> Location Saved`;
                return;
            }
        }
        el.innerHTML = `<span><i class="fa fa-plus" aria-hidden="true"></i></span> Save Location`;
    }

    private static refreshGeoLocations () {
        document.dispatchEvent(new CustomEvent(GeoLocation.EVENT_GEOLOCATION_UPDATE));
    }

    public static updateLocalStorage() {
        let str = '';
        let arr = [];
        for (let i=0; i<GeoLocation.savedLocations.length; i++) {
            let gs = GeoLocation.savedLocations[i];
            let aTxt = [];
            aTxt[0] = (gs.coord) ? gs.coord[0] + ',' + gs.coord[1] : 'x';
            aTxt[1] = (gs.address) ? gs.address : 'x';
            aTxt[2] = (gs.city) ? gs.city : 'x';
            aTxt[3] = (gs.region) ? gs.region : 'x';
            aTxt[4] = (gs.magicKey) ? gs.magicKey : 'x';
            arr.push(aTxt.join('###'));
        }
        str += arr.join(';;;');
        localStorage.setItem('locator-saved', str);
    }

    public static retrieveLocalStorage() {
        let str = localStorage.getItem('locator-saved');
        if (str && str != '') {
            let arr = str.split(';;;');
            for (let i=0; i<arr.length; i++) {
                let aTxt = arr[i].split('###');
                if (aTxt.length == 5) {
                    let gs = new GeoLocationSave();
                    if (aTxt[0] != 'x') {
                        let coord = aTxt[0].split(',');
                        gs.coord = [Number(coord[0]), Number(coord[1])];
                    }
                    if (aTxt[1] != 'x') { gs.address = aTxt[1];}
                    if (aTxt[2] != 'x') { gs.city = aTxt[2];}
                    if (aTxt[3] != 'x') { gs.region = aTxt[3];}
                    if (aTxt[4] != 'x') { gs.magicKey = aTxt[4];}
                    this.savedLocations.push(gs);
                }
            }
            this.refreshGeoLocations();
        }
        console.log("LOAD", this.savedLocations);
    }

    private static setLayer() {
        if (!this.layer) {
            this.layer = new Vector({
                source: new VectorSrc({})
            });
            props.map.addLayer(this.layer);
        }
    }

    private hide() {
        GeoLocation.remove(this.id);
    }

    public static add(geo : GeoLocation) {
        for (let i=0; i<GeoLocation.list.length; i++) {
            let geo = GeoLocation.list[i];
            if (geo.magicKey == geo.magicKey) {
                return;
            }
        }
        this.list.push(geo);
    }

    public static remove(id : number) {
        for (let i=0; i<this.list.length; i++) {
            let geo = GeoLocation.list[i];
            if (geo.id == id) {
                this.list.splice(i,1);
                geo.active = false;
                if (GeoLocation.layer && GeoLocation.layer.getSource() && geo.feature) {
                    GeoLocation.layer.getSource().removeFeature(geo.feature);
                }
                geo.feature = null;
                if (geo.overlay) {
                    props.map.removeOverlay(geo.overlay);
                }
                geo.overlay = null;
                geo.divElement = null;
                return;
            }
        }
    }
    public static removeSaved(index:number) {
        if (index < this.savedLocations.length) {
            this.savedLocations.splice(index, 1);
        }
        for (let i=0; i<this.list.length; i++) {
            this.list[i].updateSaveBtn();
        }
        this.updateLocalStorage();
        this.refreshGeoLocations();
    }
    private static _render(geo:GeoLocation) {
        geo.divElement = document.createElement('div');
        geo.divElement.className = 'ol-identify';
        geo.divElement.id = `locator-tooltip-${geo.id}`;
        let label = (geo.city != '') ? geo.city + ', ' : '';
        if (geo.region != '') { label += geo.region; }
        geo.divElement.innerHTML = `
            <div class="wrapper bottom">
                <div class="arrow"></div>
            </div>
            <div class="identifyJSONLabel">
                <div id="locatorText" class="locator-text">
                <div class="faLbl">${label}</div>
                <div class="locator-address">
                    ${geo.address}
                </div>
                <div class="locator-latlon">
                    Lat: ${geo.latitude}, Lon: ${geo.longitude}
                </div>
                <div class="saveLoc" id="locator-save-${geo.id}">Location</div>
                </div>
                <div class="close" id="locatorClose-${geo.id}"><span><i class="fa fa-times" aria-hidden="true"></i></span></div>
            </div>
        `;
    }

    public static setNewMyLocation():GeoLocation {
        for (let i=0; i<this.list.length; i++) {
            if (this.list[i].isMyLocation) {
                return this.list[i];
            }
        }
        let geo = new GeoLocation();
        geo.isMyLocation = true;
        return geo;
    }
    public static hasMagicLocation(magickey:string) : GeoLocation | null {
        for (let i=0; i<this.list.length; i++) {
            if (this.list[i].magicKey == magickey) {
                return this.list[i];
            }
        }
        return null;
    }
    public static setMultipleSelection (allow : boolean) {
        this.allowMultipleLocations = allow;
        if (!this.allowMultipleLocations) {
            this.clearAll(1);
        }
    }
    public static clearAll(limit : number = 0) {
        for (let i=this.list.length - 1 - limit; i>=0; i--) {
            this.remove(this.list[i].id);
        }
    }
}