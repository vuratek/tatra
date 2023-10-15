import { baseComponent } from "./BaseComponent";
import { tools } from "../tools";
import { Locator } from "../mapTools/Locator";
import { controls } from "./controls";
import { props } from "../props";
import { utils } from "../../utils";
import { Vector } from "ol/layer";
import { MapBrowserEvent } from "ol";
import { mapUtils } from "../mapUtils";
import { GeoLocation } from "../obj/GeoLocation";
import  Coordinates from 'coordinate-parser';
//import convert from 'geo-coordinates-parser';

interface ISearchRecord {
    data? : any;
    ready : boolean;
}

interface ISearchData {
    [key:string] : ISearchRecord;
}

export class locator extends baseComponent {
    public static id		    : string = 'locator';
    public static label		    : string = 'Location Tool';
    public static tool          : Locator = new Locator(locator.id);
    public static className     : string = 'transparentWindow';
    public static draggable     : boolean = true;
    public static currentTab   : number  = -1;
    private static layer        : Vector | null = null;
    private static results      : ISearchData = {};
    private static ESRI_GEO_URL : string = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?f=json&langCode=en&text=#SEARCH#&category=Address%2CStreet%20Address%2CPopulated%20Place%2CEducation%2CLand%20Features%2CWater%20Features%2CMuseum%2CTourist%20Attraction%2CScientific%20Research%2CGovernment%20Office%2CBusiness%20Facility%2CPrimary%20Postal%2CAirport'
    private static ESRI_LOCATION_URL : string = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&langCode=en&outFields=*&magicKey=#MAGICKEY#';
    private static ESRI_REVERSE_GEOCODE : string = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=json&langCode=en&location=#LOCATION#';
    private static mouseClickListener : (evt: Event) => void;
    private static isClickListenerActive : boolean = false;

    public static init() {
        tools.register(this.tool);
        super.init();
        props.map.addControl(this.tool.control);
        document.addEventListener(GeoLocation.EVENT_GEOLOCATION_UPDATE, (evt) => this.refreshSaved (evt as any));
        GeoLocation.retrieveLocalStorage();
        this.determineStart();
        this.mouseClickListener = (evt) => this.mapClick(evt as unknown as MapBrowserEvent);
    }

    public static open() {
        this.setIgnoreResize(false);
        super.open();
        tools.activate(this.id);
        let mh = (document.getElementById('map') as HTMLDivElement).clientHeight - 400;
        let mw = ((document.getElementById('map') as HTMLDivElement).clientWidth - 400) / 2 - 40;
        if (mh < 0) { mh = 0;}
        else { mh = 25;} // mh=50
        if (mw < 0) { mw = 0;}
        else { mw = 60; } // mw=150
        this.position(mw, mh);
        let tab  = (locator.currentTab == -1 || locator.currentTab == 1) ? 2 : locator.currentTab;
        this.setTab(tab);
    }


    public static createWindow () {
        super.createWindow();
        
        let el = document.getElementById(`lmvControls_${this.id}_Content`) as HTMLDivElement;
        if (! el) { return; }
        el.innerHTML = `
            <div class="locator-tab-wrap">
                <div id="locator-tab-1" class="locator-tab"><i class="fas fa-crosshairs bottomBarIcon"></i> Current Location</div>
                <div id="locator-tab-2" class="locator-tab"><i class="fas fa-search bottomBarIcon"></i> Find Location</div>
                <div id="locator-tab-3" class="locator-tab"><i class="fas fa-flag bottomBarIcon"></i> Saved Locations</div>
            </div>
            <div id="locator-content"></div>
            <div id="locator-options"></div>
        `;

        utils.setClick("locator-tab-1", ()=>this.setTab(1));
        utils.setClick("locator-tab-2", ()=>this.setTab(2));
        utils.setClick("locator-tab-3", ()=>this.setTab(3));
    }
    public static resize() {
        if (this.ignoreResize) { 
            return; 
        }
        this.disableMapClick();
        controls.onClick("pan");
    }
    public static mapClick(evt:MapBrowserEvent) {
        let geo = new GeoLocation();
        geo.setCoords(evt.coordinate);
        geo.reposition = false;
        this.reverseGeocode(geo);
    }
    public static setTab (id:number) {
        if (id == -1) { id = 2; }
        this.currentTab = id;
        for (let i=1; i<=3; i++) {
            utils.removeClass(`locator-tab-${i}`, "selected");
        }
        if (id == 1) {
            if (! this.isClickListenerActive) {
                this.isClickListenerActive = true;
                props.map.on('click', this.mouseClickListener);
                mapUtils.setMapCursor('crosshair');
            }
        } else {
            this.disableMapClick();
        }
        utils.addClass(`locator-tab-${this.currentTab}`, 'selected');
        this.populateTabContent();
    }
    private static disableMapClick () {
        if (this.isClickListenerActive) {

            this.isClickListenerActive = false;
            props.map.un('click', this.mouseClickListener);
            mapUtils.setMapCursor();
        }
    }
    private static createMutliple() {
        let el = document.getElementById('locator-options') as HTMLDivElement;
        if (! el) { return; }
        el.innerHTML = `
            <label class="llCheckbox">
                <input type="checkbox" id="locator-allow-multi">
                <span class="checkmark" id="locator-allow-multi-lbl"></span>
            </label>
            <div class="locator-multi-lbl">Allow multiple location selection</div>
            <div id="locator-remove-all"><span><i class="fa fa-trash"></i></span> Clear All</div>
        `;
        utils.setClick('locator-remove-all', ()=>this.clearAll());
        utils.setChange('locator-allow-multi', ()=>this.setMultiSelection());
        let el2 = document.getElementById('locator-allow-multi') as HTMLInputElement;
        if (el2) {
            el2.checked = GeoLocation.allowMultipleLocations;
        }
        this.updateClearAll();
    }
    private static clearAll() {
        GeoLocation.clearAll();
        this.updateClearAll();
    }
    private static refreshSaved() {
        if (this.currentTab == 3) {
            let el = document.getElementById('locator-content') as HTMLDivElement;
            if (! el) { return; }
            if (GeoLocation.savedLocations.length == 0) {
                el.innerHTML = '*** No locations are currenty saved ***';
                return;
            }
            el.innerHTML = `
                <div class="locator-page-start">
                    <label class="llCheckbox">
                        <input type="checkbox" id="locator-allow-start">
                        <span class="checkmark" id="locator-allow-start-lbl"></span>
                    </label>
                    <div class="locator-multi-lbl">Show saved locations at page start</div>
                </div>
                <div class="locator-content-list-instruct">Zoom map to view multiple locations</div>
                <div id="locator-content-list">
                </div>
            `;
            utils.setChange(`locator-allow-start`, ()=>this.setDefaultStart());
            this.initDefaultStart();
            let el2 = document.getElementById('locator-content-list') as HTMLDivElement;
            if (!el2) { return;}
            for (let i=0; i<GeoLocation.savedLocations.length; i++) {
                let gs = GeoLocation.savedLocations[i];
                let div = document.createElement("div");
                div.id = `locator-saved-${i}`;
                div.className = 'locator-saved-item';
                el2.appendChild(div);
                let str = `<div id="locator-item-click-${i}">`;
                if (gs.address) {
                    str += `<div class="locator-address">${gs.address}</div>`;
                }
                if (gs.coord) {
                    let coord = mapUtils.setCoordPrecision(gs.coord[0], gs.coord[1], 4);
                    str += `<div class="locator-latlon">Lat: ${coord[1]}, Lon: ${coord[0]}</div>`;
                }
                str += '</div>'
                str += `
                    <div id="locator-item-remove-${i}" class="locator-save-item-close"><span><i class="fa fa-times" aria-hidden="true"></i></span></div>
                `;
                div.innerHTML = str;
                utils.setClick(`locator-item-click-${i}`, ()=>this.zoomToSaved(i));
                utils.setClick(`locator-item-remove-${i}`, ()=>this.removeSaved(i));
            }
            this.updateSavedItems();
        }
    }
    private static initDefaultStart() {
        let el = document.getElementById('locator-allow-start') as HTMLInputElement;
        if (el) {
            let val = localStorage.getItem('show-locator');
            if (val && val == 'true') {
                el.checked = true;
            }
        }
    }
    private static determineStart () {
        let val = localStorage.getItem('show-locator');
        if (val && val == 'true' && GeoLocation.savedLocations.length > 0) {
            props.defaultStartTool = 'locator';
            this.currentTab = 3;
        }
    }
    private static setDefaultStart() {
        let el = document.getElementById('locator-allow-start') as HTMLInputElement;
        if (el) {
            let val = (el.checked) ? 'true' : 'false';
            localStorage.setItem('show-locator', val);
        }
    }
    private static updateSavedItems() {
        for (let j=0; j<GeoLocation.savedLocations.length; j++) {
            let sg = GeoLocation.savedLocations[j];
            let found = false;
            for (let i=0; i<GeoLocation.list.length; i++) {
                let geo = GeoLocation.list[i];
                if ((sg.coord && geo.coord && sg.coord[0] == geo.coord[0] && sg.coord[1] == geo.coord[1]) || (sg.magicKey && sg.magicKey == geo.magicKey)) {
                    found = true;
                    break;
                }
            }
            if (found) { utils.addClass(`locator-saved-${j}`, 'selected'); }
            else { utils.removeClass(`locator-saved-${j}`, 'selected'); }
        }
    }
    private static zoomToSaved(id : number) {
        let sg = GeoLocation.savedLocations[id];
        for (let i=0; i<GeoLocation.list.length; i++) {
            let geo = GeoLocation.list[i];
            if ((sg.coord && geo.coord && sg.coord[0] == geo.coord[0] && sg.coord[1] == geo.coord[1]) || (sg.magicKey && sg.magicKey == geo.magicKey)) {
                geo.hide();
                return;
            }
        }
        props.locatorFLyToEnabled = true;
        let geo = GeoLocation.setSavedLocation(sg);        
        this.reverseGeocode(geo);
    }

    private static removeSaved(id:number) {
        GeoLocation.removeSaved(id);
    }
    private static setMultiSelection() {
        if (document.getElementById('locator-allow-multi') && (document.getElementById('locator-allow-multi')as HTMLInputElement).checked) {
            GeoLocation.setMultipleSelection(true);
        } else {
            GeoLocation.setMultipleSelection(false);
        }
    }
    private static updateClearAll() {
        if (GeoLocation.list.length >0) {
            utils.show('locator-remove-all');
        } else {
            utils.hide('locator-remove-all');
        }
        this.updateSavedItems();
    }
    private static populateTabContent() {
        let el = document.getElementById('locator-content') as HTMLDivElement;
        if (!el) { return; }
        this.setIgnoreResize(false);
        if (this.currentTab == 1 ) { 
            el.innerHTML = `
                <div id="locator-locate-btn"><span><i class="fa fa-map-marker-alt"></i></span> Auto detect your location</div>
                <!-- <div id="locator-or">OR</div> -->
                <div id="locator-click-option">
                    You can also determine location by directly clicking on the map.
                </div>
            `;
            utils.setClick('locator-locate-btn', ()=> this.getGeoLocation());
        } else if (this.currentTab == 2) {
            this.setIgnoreResize(true);
            el.innerHTML = `
                <div class="locator-search-wrap">
                    <input type="text" placeHolder="Search for location or enter coordinates" id="locator-search" autocomplete="off">
                    <div class="closebtn" id="locator-search-clear"><span><i class="fas fa-times"></i></span></div>
                </div>
                <div id="locator-search-results"></div>
            `;
            utils.setUIAction("keyup", "locator-search", () => this.search());
            utils.setClick('locator-search-clear', ()=>this.clearSearch());
            utils.setFocus('locator-search');
        } else {
            this.refreshSaved();
        }
        this.createMutliple();
    }

    private static getSearchVal() : string {
        let el = document.getElementById('locator-search') as HTMLInputElement;
        if (!el) { return ''; }
        return el.value;
    }
    private static clearSearch() {
        (document.getElementById('locator-search') as HTMLInputElement).value = '';
        this.populateResults();
    }

    private static search() {

        let val = this.getSearchVal();
        if (this.results[val]) {
            this.populateResults();
        } else {
            this.results[val] = {ready : false};
            this.loadData(val);
        }
    }

    private static loadData(search : string) {
        let url = this.ESRI_GEO_URL.replace("#SEARCH#", search);
        if (props.locatorSubset) {
            url += '&' + props.locatorSubset;
        }
        fetch(url)
        .then(response => {
            return response.json();
        })
        .then (data => {
            let rec = this.results[search];
            rec.data = data;
            rec.ready = true;
            this.populateResults();
        })
        .catch(error => {
            console.error("Error processing ", url);
        });
    }

    private static populateResults() {
        let el = document.getElementById('locator-search-results') as HTMLDivElement;
        if (!el) { return; }
        let val = this.getSearchVal();
        let str = '<ul>';
        let counter = 0;
        if (this.results[val] && this.results[val].ready && this.results[val].data["suggestions"]) {
            for (let sug in this.results[val].data["suggestions"]) {
                let text = this.results[val].data["suggestions"][sug].text as string;
                let arr = text.split(',');
                let name = arr[0];
                let rest = '';
                if (arr.length >1) {
                    arr.splice(0,1);
                    rest = '<span class="secondary">,' + arr.join(',') +'</span>';
                }                

                str += `<li id="locator-search-result_${counter}"><span class="primary">${name}</span>${rest}</li>`;
                counter ++;
            }
        }
        let hasLatLon = false;
        let lat = 0;
        let lon = 0;
        if (val.length > 2) {
            if (val.indexOf(' ') > 0 || val.indexOf(',') > 0 || val.indexOf('/') > 0) {
                if (this.isValidPosition(val)) {
                    let position = new Coordinates(val);
                    counter++;
                    hasLatLon = true;
                    lat = position.getLatitude();
                    lon = position.getLongitude();
                    str += `
                        <li id="locator-search-result_coord" class="coord">
                            Lat: <span class="primary">${lat}</span>, 
                            Lon: <span class="primary">${lon}</span>
                        </li>`;
                }
            }
        }
        if (!hasLatLon) {
            str += `<li class="coord">Coordinates: lat, lon</li>`;
        }
        if (val.length > 0 && counter == 0) {
            str += `<li class="notfound">No suggestions found.<br/>Please check your search text and try again.</li>`;
        }
        str += '</ul>';
        el.innerHTML = str;
        counter = 0;
        if (this.results[val] && this.results[val].ready && this.results[val].data["suggestions"]) {
            for (let sug in this.results[val].data["suggestions"]) {
                utils.setClick(`locator-search-result_${counter}`, () => this.goToLocation(this.results[val].data["suggestions"][sug]));
                counter ++;
            }
        }
        if (hasLatLon) {
            utils.setClick('locator-search-result_coord', ()=>this.goToLatLon(lat, lon));
        }
    }

    private static isValidPosition (position : string) {
        let error;
        let isValid;
        try {
            isValid = true;
            new Coordinates(position);
            return isValid;
        } catch (error) {
            isValid = false;
            return isValid;
        }
    };

    private static goToLatLon(lat:number, lon:number) {
        /*props.map.getView().setCenter( [lon, lat]);
        props.map.getView().setZoom(10);
        locator.showPosition(position)*/
        let geo = new GeoLocation();
        geo.setCoords([lon, lat]);
        this.gotoPosition(geo);
    }

    private static goToLocation(suggestion : any) {
        let geo = GeoLocation.hasMagicLocation(suggestion.magicKey);
        if (geo) {
            this.zoomTo(geo);
            return;
        }
        geo = new GeoLocation();
        geo.magicKey = suggestion.magicKey;
        if (!geo.magicKey) { return; }
        let url = this.ESRI_LOCATION_URL.replace("#MAGICKEY#", geo.magicKey);
        fetch(url)
        .then(response => {
            return response.json();
        })
        .then (data => {
            if (data.candidates) {
                let info = data.candidates[0];
                (geo as GeoLocation).setCoords([(info.location.x as number), (info.location.y as number)]);
                (geo as GeoLocation).setZoomLevel(info.extent);
                (geo as GeoLocation).setInfo(info.attributes);
                this.zoomTo(geo as GeoLocation);
            }
        })
        .catch(error => {
            console.error("Error processing ", url);
        });   
    }

    private static reverseGeocode(geo : GeoLocation) {
        if (! geo.coord) { return; }
        let url = this.ESRI_REVERSE_GEOCODE.replace("#LOCATION#", `${geo.coord[0]},${geo.coord[1]}`);
        let myGeo = geo;
        fetch(url)
        .then(response => {
            return response.json();
        })
        .then (data => {
            if (data.address) {
                myGeo.setInfo(data.address);
                this.zoomTo(myGeo);
            }
        })
        .catch(error => {
            console.error("Error processing ", url);
        });   
    }

    private static getGeoLocation() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition((position) => locator.showPosition(position));
        } 
        // COMMENT OUT - only for testing
/*        let geo = GeoLocation.setNewMyLocation();
        geo.setCoords([-120, 40]);
        this.reverseGeocode(geo);*/
    }

    private static showPosition(position : Position) {
        let geo = GeoLocation.setNewMyLocation();
        geo.setCoords([position.coords.longitude, position.coords.latitude]);
        this.gotoPosition(geo);
    }

    private static gotoPosition(geo:GeoLocation) {
        geo.zoomLevel = 10;
        this.reverseGeocode(geo);
    }

    private static flyTo(location : Array <number>, done : Function, zoomLevel : number) {
        let view = props.map.getView();
        let s = view.getCenter();
        let duration = 2000;
        let zoomIncrease = 0;
        if (s) {
            let dx = Math.abs(s[0] - location[0]);
            let dy = Math.abs(s[1] - location[1]);
            let d  = (dx > dy) ? dx : dy;
            duration = Math.round(d / 60) * 1000;
            if (duration < 2000) {
                duration = 2000;
            }
            zoomIncrease = Math.ceil(d / 10);
        }

        let zoom = view.getZoom();
        if (! zoom) { zoom = 2;}
        zoom = zoom - zoomIncrease;
        if (zoom < 2) { zoom = 2;}
        
        let parts = 2;
        let called = false;
        function callback(complete : any) {
          --parts;
          if (called) {
            return;
          }
          if (parts === 0 || !complete) {
            called = true;
            done(complete);
          }
        }
        view.animate(
          {
            center: location,
            duration: duration,
          },
          callback
        );
        view.animate(
          {
            zoom: zoom,
            duration: duration / 2,
          },
          {
            zoom: zoomLevel,
            duration: duration / 2,
          },
          callback
        );
      }

    private static zoomTo(geo : GeoLocation) {
        if (! geo.coord || ! geo.active) { return; }
        if (geo.reposition) {
            let level = (geo.zoomLevel <= 10) ? 10 : geo.zoomLevel;
            if (props.locatorFLyToEnabled) {
                this.flyTo(geo.coord, function () {}, level);
            } else {
                props.map.getView().setCenter( geo.coord );
                
                props.map.getView().setZoom(level);
            }
        }
        props.locatorFLyToEnabled = false;

        geo.render();
        this.updateSavedItems();
        this.updateClearAll();
        if (this.isSmallScreen()) {
            this.setIgnoreResize(false);
            this.resize();
        }
    }
    private static isSmallScreen() : boolean {
        if (window.innerWidth < 1180 || window.innerHeight < 540) return true;
        return false;
    }
    public static close() {
        this.setIgnoreResize(false);
        super.close();
        this.disableMapClick();
    }
}