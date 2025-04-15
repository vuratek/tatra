import { Layer } from "../obj/Layer";
import { props } from "../props";
import { flatpickr } from "../../aux/flatpickr";
import { events } from "../events";
import { timelineController } from "../../timeline/timelineController";

import { IImpactRecords, IMPACT_COLLECTIONS, ImpactRecord } from "../obj/ImpactRecord";

export interface ILayerImpact {
    [key:string]    : ImpactRecord;
}

export class ImpactImagery {

    public static searchKeys : IImpactRecords = {};
    public static timelineHandler : (evt: Event) => void;
    private static URL : string = "https://dev-titiler-cmr.delta-backend.com/WGS1984Quad/tilejson.json";
    private static layers : ILayerImpact = {};
    private static isInit : boolean = false;
    
    public static getRGB(obj : ImpactRecord) : Array <string> {
        if (obj.collection == IMPACT_COLLECTIONS.HLSS30) {
            return ['B01','B02','B03','B04','B05','B06','B07','B08','B8A','B09','B10','B11','B12'];
        }
        return ['B01','B02','B03','B04','B05','B06','B07','B09','B10'];
    }

    public static init() {
        if (this.isInit) { return; }
        this.isInit = true;
		this.timelineHandler = () => this.refresh();
		document.addEventListener(timelineController.EVENT_TIMELINE_UPDATED, this.timelineHandler);      
		document.addEventListener(events.EVENT_LAYER_VISIBLE, (evt) => this.refresh());
	}

    public static register (lo:Layer) {
        this.init();
        if (!this.layers[lo.id]) {
            this.layers[lo.id] = new ImpactRecord(lo.id, lo.impactImage);
        }
    }

    public static setQuery(date : string, obj : ImpactRecord) : string {
        let query = [
			`concept_id=${obj.collection}`,
			`datetime=${date}T00:00:00Z/${date}T23:59:59Z`,
			`bands_regex=${obj.bands_regex}`,
			`backend=${obj.backend}`,
			`minzoom=${obj.minzoom}`,
			`maxzoom=${obj.maxzoom}`
		];
        if (obj.color_formula) { query.push(`color_formula=${obj.color_formula}`); }
        if (obj.rescale) { query.push(`rescale=${obj.rescale}`); }
        for (let i=0; i<obj.bands.length; i++) {
            query.push(`bands=${obj.bands[i]}`);
        }
        if (obj.colormap) { query.push(`colormap_name=${obj.colormap}`); }
        if (obj.expression) { query.push(`expression=${obj.expression}`); }
        return query.join('&');
    }

    public static refresh() {
		for (let i=0; i<props.layers.length; i++) {
			let lo = props.layers[i];
			if (lo.handler == "impact" && lo.visible) {
				let date = flatpickr.formatDate(lo.time, lo.dateFormat);
				if (! this.searchKeys[lo.id]) {
					this.searchKeys[lo.id] = {};
				}
				if (! this.searchKeys[lo.id][date]) {
					this.searchKeys[lo.id][date] = '0';
					this.getSearchId(lo, date);
				}
			}
		}
	}
    public static getSearchId(_lo:Layer, date:string) {
		let lo = _lo;
        let obj = this.layers[lo.id];
        if (! obj) { return; }
        let url = this.URL + '?' + this.setQuery(date, obj);

        fetch(url)
        .then(response => {
            return response.json();
        })
        .then (data => {
			this.searchKeys[lo.id][date] = data.tiles[0];
			lo.refresh();
        })
        .catch(error => {
            console.error("Error processing ", url);
        });
	}
}