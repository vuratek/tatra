import { baseComponent } from "./baseComponent";
import { tools } from "../tools";
import { Locator } from "../mapTools/Locator";
import { controls } from "./controls";
import { props } from "../props";
import { utils } from "../../utils";
import { Vector } from "ol/layer";
import { Vector as VectorSrc } from "ol/source";
import { MapBrowserEvent } from "ol";
import { Coord } from "../obj/Coord";
import { mapUtils } from "../mapUtils";
import { GeoLocation } from "../obj/GeoLocation";

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
    private static currentTab   : number  = 2;
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
    }

    public static open() {
        super.open();
        tools.activate(this.id);
        let mh = (document.getElementById('map') as HTMLDivElement).clientHeight - 350;
        let mw = ((document.getElementById('map') as HTMLDivElement).clientWidth - 400) / 2 - 40;
        if (mh < 0) { mh = 0;}
        else { mh = 50;}
        if (mw < 0) { mw = 0;}
        else { mw = 150; }
        this.position(mw, mh);
        this.setTab(this.currentTab);
        this.mouseClickListener = (evt) => this.mapClick(evt as unknown as MapBrowserEvent);
        this.updateClearAll();
    }


    public static createWindow () {
        super.createWindow();
        
        let el = document.getElementById(`lmvControls_${this.id}_Content`) as HTMLDivElement;
        if (! el) { return; }
        el.innerHTML = `
            <div class="locator-tab-wrap">
                <div id="locator-tab-1" class="locator-tab"><i class="fas fa-crosshairs bottomBarIcon"></i> Current location</div>
                <div id="locator-tab-2" class="locator-tab"><i class="fas fa-search bottomBarIcon"></i> Locate place</div>
                <div id="locator-tab-3" class="locator-tab"><i class="fas fa-flag bottomBarIcon"></i> Saved locations</div>
            </div>
            <div id="locator-content"></div>
            <div id="locator-options"></div>
        `;

        utils.setClick("locator-tab-1", ()=>this.setTab(1));
        utils.setClick("locator-tab-2", ()=>this.setTab(2));
        utils.setClick("locator-tab-3", ()=>this.setTab(3));
    }
    public static resize() {
        controls.onClick("pan");
    }
    public static mapClick(evt:MapBrowserEvent) {
        let geo = new GeoLocation();
        geo.setCoords(evt.coordinate);
        geo.reposition = false;
        this.reverseGeocode(geo);
    }
    private static setTab (id:number) {
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
            <div class="locator-multi-lbl">Allow multiple selection</div>
            <div id="locator-remove-all"><span><i class="fa fa-trash"></i></span> Clear All</div>
        `;
        utils.setClick('locator-remove-all', ()=>this.clearAll());
        utils.setChange('locator-allow-multi', ()=>this.setMultiSelection());
        let el2 = document.getElementById('locator-allow-multi') as HTMLInputElement;
        if (el2) {
            el2.checked = GeoLocation.allowMultipleLocations;
        }
    }
    private static clearAll() {
        GeoLocation.clearAll();
        this.updateClearAll();
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
    }
    private static populateTabContent() {
        let el = document.getElementById('locator-content') as HTMLDivElement;
        if (!el) { return; }
        if (this.currentTab == 1 ) { 
            el.innerHTML = `
                <div id="locator-locate-btn"><span><i class="fa fa-map-marker-alt"></i></span> Find me on the map</div>
                <div id="locator-or">OR</div>
                <div id="locator-click-option">
                    Click on the Map<br/>
                    to get location information
                </div>
            `;
            utils.setClick('locator-locate-btn', ()=> this.getGeoLocation());
        } else if (this.currentTab == 2) {
            el.innerHTML = `
                <div class="locator-search-wrap">
                    <input type="text" placeHolder="Search for places or enter coordinates" id="locator-search" autocomplete="off">
                    <div class="closebtn" id="locator-search-clear"><span><i class="fas fa-times"></i></span></div>
                </div>
                <div id="locator-search-results"></div>
            `;
            utils.setUIAction("keyup", "locator-search", () => this.search());
            utils.setClick('locator-search-clear', ()=>this.clearSearch());
        } else {
            el.innerHTML = '';
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
    }

    private static goToLocation(suggestion : any) {
        let geo = GeoLocation.hasMagicLocation(suggestion.magicKey);
        if (geo) {
            this.zoomTo(geo);
            return;
        }
        geo = new GeoLocation();
        geo.magicKey = suggestion.magicKey;
        let url = this.ESRI_LOCATION_URL.replace("#MAGICKEY#", geo.magicKey);
        fetch(url)
        .then(response => {
            return response.json();
        })
        .then (data => {
            if (data.candidates) {
                let info = data.candidates[0];
                geo.setCoords([(info.location.x as number), (info.location.y as number)]);
                geo.setInfo(info.attributes);
                this.zoomTo(geo);
            }
        })
        .catch(error => {
            console.error("Error processing ", url);
        });   
    }

    private static reverseGeocode(geo : GeoLocation) {
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
        let geo = GeoLocation.setNewMyLocation();
        geo.setCoords([-120, 40]);
        this.reverseGeocode(geo);
//        this.zoomTo(coord, `Latitude: ${coord[1]}<br>Longitude: ${coord[0]}`);
    }

    private static showPosition(position : Position) {
        let geo = GeoLocation.setNewMyLocation();
        geo.setCoords([position.coords.longitude, position.coords.latitude]);
        this.reverseGeocode(geo);
//        this.zoomTo(coord, `Latitude: ${coord[1]}<br>Longitude: ${coord[0]}`);
    }

    private static zoomTo(geo : GeoLocation) {
        if (! geo.coord) { return; }
        if (geo.reposition) {
            props.map.getView().setCenter( geo.coord );
            props.map.getView().setZoom(10);
        }

        if (!this.layer) {
            this.layer = new Vector({
                source: new VectorSrc({})
            });
            props.map.addLayer(this.layer);
        }
        geo.render(this.layer);
        this.updateClearAll();
    }
    public static close() {
        super.close();
        this.disableMapClick();
    }
}