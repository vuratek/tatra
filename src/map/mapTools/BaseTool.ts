import { Layer } from "../obj/Layer";
import { events } from "../events";
import { Interaction, Select } from "ol/interaction";
import { DataHandler } from "./dataHandler";
import { Style } from "ol/style";

export class BaseTool {
    public isActive     : boolean = false;
    public id           : string;
    public lo           : Layer | null = null;
    public layer        : string | null = null;
    public interaction  : Interaction | null = null;
    public highlightStyle : Array <Style> = [];

    public constructor (id : string) {
        this.id = id;
        DataHandler.setData(this.id);
    }

    public activate () {
        this.isActive = true;       
        DataHandler.activeTool = this.id;
        events.selectionUpdate( this.id ); 
    }

    public deactivate () {
        this.isActive = false;
    }

    public populateResults (divResults : HTMLDivElement, prefixId : string = '') {
        divResults.innerHTML = `<div class="windowRR">Nothing selected ...</div>`;
    }

    public clearLayer() {
        if (! this.lo) { return; }
        if ((this.lo.type == "manualLayer" || this.lo.type ==  "drawClassicLayer") && this.lo.boxSource) {
            this.lo.boxSource.clear();
        }
        if (this.interaction) {
            if (this.lo.type == "geojson") {
                (this.interaction as Select).getFeatures().clear();
            } else {
                if (this.lo.boxSource) {
                    this.lo.boxSource.clear();
                }
            }
        }
        DataHandler.clear(this.id);
    }

    public removeItem (id : string) {
        if (DataHandler.data[this.id].length == 0) {
            return;
        } else {
            for (let i = DataHandler.data[this.id].length - 1; i >= 0; i--) {
                let lso = DataHandler.data[this.id][i];
                if ((this.lo as Layer).type == "geojson") {
                    if (lso.short == id) {
                        DataHandler.data[this.id].splice(i, 1);
                    }
                } else {
                    if (lso.short == id) {
                        DataHandler.data[this.id].splice(i, 1);
                        if (this.lo && this.lo.boxSource) {
                            this.lo.boxSource.removeFeature(lso.feature);
                        }
                    }
                }
            }
            this.populateFeatureLayer(true);
        }
    }

    public hasExtraToolBar (divId : string) : boolean {
        return false;
    }

    public populateFeatureLayer (update : boolean) {
        if (this.lo && this.lo.type == "geojson") {
            (this.interaction as Select).getFeatures().clear();
            if (DataHandler.data[this.id].length > 0) {
                for (let i = 0; i < DataHandler.data[this.id].length; i++) {
                    let so = DataHandler.data[this.id][i];
                    (this.interaction as Select).getFeatures().push(so.feature);
                    if ( this.highlightStyle.length > 0 ) {
                        so.feature.setStyle(this.highlightStyle);
                    }
                }
            }
        }
//        this.lo.visible = true;
        if (update) {
            events.selectionUpdate( this.id );
        }
    }
}
