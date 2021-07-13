import { baseComponent } from "./baseComponent";
import { tools } from "../tools";
import { Locator } from "../mapTools/Locator";
import { controls } from "./controls";
import { props } from "../props";
import { utils } from "../../utils";

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
    private static currentTab   : number  = 1;
    private static results      : ISearchData = {};
    private static ESRI_GEO_URL : string = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?f=json&langCode=en&text=#SEARCH#&category=Address%2CStreet%20Address%2CPopulated%20Place%2CEducation%2CLand%20Features%2CWater%20Features%2CMuseum%2CTourist%20Attraction%2CScientific%20Research%2CGovernment%20Office%2CBusiness%20Facility%2CPrimary%20Postal%2CAirport'
    private static ESRI_LOCATION_URL : string = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&langCode=en&outFields=*&magicKey=#MAGICKEY#';

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
            <div id="locator-content">
            </div>
        `;

        utils.setClick("locator-tab-1", ()=>this.setTab(1));
        utils.setClick("locator-tab-2", ()=>this.setTab(2));
        utils.setClick("locator-tab-3", ()=>this.setTab(3));
    }
    public static resize() {
        controls.onClick("pan");
    }
    private static setTab (id:number) {
        this.currentTab = id;
        for (let i=1; i<=3; i++) {
            utils.removeClass(`locator-tab-${i}`, "selected");
        }
        utils.addClass(`locator-tab-${this.currentTab}`, 'selected');
        this.populateTabContent();
    }
    private static populateTabContent() {
        let el = document.getElementById('locator-content') as HTMLDivElement;
        if (!el) { return; }
        if (this.currentTab == 1 ) { 
            el.innerHTML = `
                <div id="locator-locate-btn">Find me on the map</div>
                <div id="locator-locate-info"></div>
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
                utils.setClick(`locator-search-result_${counter}`, () => this.goToLocation(this.results[val].data["suggestions"][sug].magicKey));
                counter ++;
            }
        }
    }

    private static goToLocation(magicKey : string) {
        let url = this.ESRI_LOCATION_URL.replace("#MAGICKEY#", magicKey);
        fetch(url)
        .then(response => {
            return response.json();
        })
        .then (data => {
            console.log(data);
            if (data.candidates) {
                let coord = [data.candidates[0]["location"].x as number, data.candidates[0]["location"].y as number]; 
                this.zoomTo(coord);
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
        let coord = [-120, 40];
        this.zoomTo(coord);
    }

    private static showPosition(position : Position) {
        let coord = [];
        coord[0] = position.coords.longitude;
        coord[1] = position.coords.latitude;
        this.zoomTo(coord);
    }

    private static zoomTo(coord : Array <number>) {
		props.map.getView().setCenter( coord );
        props.map.getView().setZoom(10);
/*        let el = document.getElementById('locator-locate-info') as HTMLDivElement;
        if (el) {
            el.innerHTML = `Latitude: ${position.coords.latitude}<br>Longitude: ${position.coords.longitude}`;
        }        */
	}
}