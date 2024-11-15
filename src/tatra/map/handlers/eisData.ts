import { mapUtils } from "../mapUtils";
import flatpickr from "flatpickr";
import { utils } from "../../utils";

export class EISRecord {
    fire_id     : string = '';
    layer_id    : string | null = null;
    ready       : boolean = false;
    loading     : boolean = false;
    duration    : number = 0;
    refresh     : boolean = false;
    start_date  : string | null = null;
    end_date    : string | null = null;
    attributes  : any = {};
}
export interface IEISRecord {
    [fire_id:string]    : EISRecord;
}
export class eisData {    

    private static fires : IEISRecord = {};
    private static hasRefresh : boolean = false;
    private static refreshHandler : Function | null = null;
    
    public static getRecord (layer_id : string, fire_id : string) : EISRecord {
        let rec = this.fires[fire_id];
        if (! rec) {
            rec = new EISRecord();
            rec.fire_id = fire_id;
            rec.layer_id = layer_id;
            rec.loading = true;
            this.fires[fire_id] = rec;
            let lo = mapUtils.getLayerById(layer_id);
            if (lo && lo.identifyAuxUrl) {
                // set refresh handler to 1.5 sec; this is to prevent flickering from each query generating refresh
                if (! this.refreshHandler) {
                    this.refreshHandler = ()=> this.refresh();
                    setInterval(this.refreshHandler, 5000);
                }
                this.load(lo.identifyAuxUrl.replace('#id#', layer_id), rec);
            }
        }
        return this.fires[fire_id];
    }

    private static load(url : string, rec : EISRecord) {
        fetch(url.replace('#fire_id#', rec.fire_id))
        .then(response => {
            if (response.status != 200) {
                return '';
            }
            return response.json();
        })
        .then (data => {
            let id = data[0]['fireid'];
            if (data[0] && data[0]['duration'] && eisData.fires[id]) {
                let rec = eisData.fires[id];
                let duration = data[0]['duration'];
                rec.duration = duration;
                rec.ready = true;
                rec.loading = false;
                rec.refresh = true;
                let at = data[0]['t'].split('T');
                rec.end_date = at[0];
                let offset = 0;
                // check for half days
                if (at[1].indexOf('12')>=0 && Math.round(duration) != Math.floor(duration)) {
                    offset + 1;
                }
                let dt = flatpickr.parseDate(rec.end_date as string, 'Y-m-d');
                if (dt) {
                    rec.start_date = flatpickr.formatDate(utils.addDay( dt ,-(rec.duration +offset)), 'Y-m-d');
                }
                
                if (rec.layer_id) {
                    eisData.hasRefresh = true;
                }
            }
        })
        .catch(error => {
            console.error("Error processing ", url);
        });
    }

    // check whether to apply refresh
    public static refresh() {
        if (!this.hasRefresh) { return; }
        this.hasRefresh = false;
        let lids = {};
        for (let fireid in this.fires) {
            if (this.fires[fireid].refresh) {
                let lid = this.fires[fireid].layer_id;
                if (! lids[lid]) {
                    lids[lid] = 1;
                }
            }
        }
        
        for (let lid in lids) {
            let lo = mapUtils.getLayerById(lid);
            if (lo) { lo.refresh(); }
        }
    }

}