import { Coord } from "./Coord";
import { mapUtils } from "../mapUtils";
import { Feature, Overlay } from "ol";
import OverlayPositioning from "ol/OverlayPositioning";
import { props } from "../props";
import { Style, Icon } from "ol/style";
import { Point } from "ol/geom";
import { Vector } from "ol/layer";
import { utils } from "../../utils";

export class GeoLocation {
    public magicKey         : string | null = null;
    public coord            : Array <number> | null = null;
    public latitude         : number = 0;       // formated lat
    public longitude        : number = 0;       // formated lon
    public address          : string | null = null;
    public city             : string | null = null;
    public region           : string | null = null;
    public id               : number = 0;
    public reposition       : boolean = true;
    private isMyLocation    : boolean = false;
    private divElement      : HTMLDivElement | null = null;
    private feature         : Feature | null = null;
    private overlay         : Overlay | null = null;
    private layer           : Vector | null = null;


    public static list : Array <GeoLocation> = [];
    public static currentID : number = 0;
    public static allowMultipleLocations : boolean = false;

    public constructor() {
        if (! GeoLocation.allowMultipleLocations) {
            GeoLocation.clearAll();
        }
        this.id = GeoLocation.currentID++;
        GeoLocation.list.push(this);
    }

    public setCoords (coord : Array <number>) {
        this.coord = coord;
        let _coord = new Coord();
        _coord.west = coord[0];
        _coord.north = coord[1];
        mapUtils.setPrecision(_coord, 4);
        this.longitude = _coord.west;
        this.latitude = _coord.north;
    }

    public setInfo (info : any) {
        this.city = info["City"] ? info["City"] : '';
        this.region = (info["Region"]) ? info["Region"] : '';
        this.address = (info["Match_addr"]) ? info["Match_addr"] : '';
    }

    public render(layer : Vector) {
        this.layer = layer;
        if (! this.divElement) {
            GeoLocation._render(this);
        }
        if (! this.overlay) {
            this.overlay = new Overlay({
                insertFirst : false,
                element: this.divElement,
                offset: [0, -100],
                positioning: OverlayPositioning.TOP_CENTER
            });
            if (props.map) {
                props.map.addOverlay(this.overlay as Overlay);
            }
            utils.setClick(`locatorClose-${this.id}`, ()=>this.hide());
        }
        this.overlay.setPosition(this.coord);
    
        if (! this.feature) {
            let iconStyle = new Style({
                image: new Icon({
                anchor: [0.5, 0.5],
                scale: [0.5, 0.5],
                anchorXUnits: 'fraction',
                anchorYUnits: 'fraction',
                src: '/images/map-pin.png',
                }),
            });
            this.feature = new Feature({
                geometry: new Point(this.coord)
            });
            this.feature.setStyle(iconStyle);
            this.layer.getSource().addFeature(this.feature);
        }
        this.feature.setGeometry(new Point(this.coord));
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
                geo.layer.getSource().removeFeature(geo.feature);
                geo.feature = null;
                props.map.removeOverlay(geo.overlay);
                geo.overlay = null;
                geo.divElement = null;
                return;
            }
        }
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
                <div class="zoomto" id="geojson_info"><span><i class="fa fa-search-plus" aria-hidden="true"></i></span> Save Location</div>
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