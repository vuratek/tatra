import { BaseTool } from "./BaseTool";
import { Select } from "ol/interaction";
import { props } from "../props";
import { platformModifierKeyOnly } from "ol/events/condition";
import { selectLayer } from "../handlers/selectLayer";
import {click} from 'ol/events/condition';
import { Style, Fill, Stroke } from "ol/style";
import { Selection } from "../obj/Selection";
import VectorSource from "ol/source/Vector";
import { DataHandler } from "./dataHandler";
import { utils } from "../../utils";
import { mapUtils } from "../mapUtils";

export class BaseSelectGeoJSONTool extends BaseTool {

    public multipleSelection     : boolean = true;

    public constructor(id : string) {
        super(id);
        this.highlightStyle = [ new Style({
            stroke: new Stroke({
                color: '#222',
                width: 4
            })
        }),
        new Style({
            fill: new Fill({
                color: 'rgba(255, 255, 255, 0.1)'
            }),
            stroke: new Stroke({
                color: '#eee',
                width: 2
            })
        })];
    }

    public setLayer (layer : string) {
        this.layer = layer;
        this.lo = mapUtils.getLayerById(this.layer);
        if (!this.lo) {
            console.log(`Tool ${this.id} has no associated layer [${this.layer}]`);
        }
    }

    public activate () {
        super.activate();
        if (this.lo) {
            this.lo.visible = true;
            this.setGeoJson();
        }
    }

    public deactivate () {
        super.deactivate();
        if (this.lo) {
            this.lo.visible = false;
            //this.clearLayer();
        }

        if (this.interaction) {
            props.map.removeInteraction(this.interaction);
            this.interaction = null;
        }
    }

    private setGeoJson () {
        if (this.lo) {
            let populate = () => this.populateFeatureLayer(true);
            let lo = this.lo;
            let base = this;
            this.interaction = new Select({
                condition: click,
                toggleCondition: platformModifierKeyOnly,
                layers: [this.lo._layer]
            });
            this.interaction.on("select", function(e) {
                let func = selectLayer[lo.source.selectHandler];
                func(e, base);
                populate();
            });
            props.map.addInteraction(this.interaction);
            if (DataHandler.data[this.id].length > 0) {
                this.populateFeatureLayer(false);
            }
        }
    }

   /* map.on('singleclick', function(e) {
        map.forEachFeatureAtPixel(e.pixel, function(f) {
          var selIndex = selected.indexOf(f);
          if (selIndex < 0) {
            selected.push(f);
            f.setStyle(highlightStyle);
          } else {
            selected.splice(selIndex, 1);
            f.setStyle(undefined);
          }
        });*/
      

    public insertItem (so : Selection) {
        let remove = false;
        for (let i = 0; i < DataHandler.data[this.id].length; i++) {
            if (DataHandler.data[this.id][i].short == so.short) {
                remove = true;
                break;
            }
        }
        if (remove) {
            this.removeItem(so.short);
        } else {
            
            this.addItem(so);
        }
        if (! this.multipleSelection) {
            for (let i = DataHandler.data[this.id].length-1; i>=0; i--) {
                if (DataHandler.data[this.id][i].short != so.short) {
                    this.removeItem(DataHandler.data[this.id][i].short);
                }
            }
        } 
    }
    
    public addItem (so : Selection) {
        let found = false;
        for (let i = 0; i < DataHandler.data[this.id].length; i++) {
            if (DataHandler.data[this.id][i].short == so.short) {
                found = true;
            }
        }
        if (!found) this.populateGeojsonFeatures(so);
    }

    public populateGeojsonFeatures (so : Selection) {

        // if country, loop through all features to add them all in
        if (this.id == 'country') {
            if (this.lo) {
                let src = this.lo._layer.getSource() as VectorSource;
                let f = src.getFeatures();
                for (let i = 0; i < f.length; i++) {
                    let feature = f[i];
                    let so2 = selectLayer.getCountrySO(feature);
                    if (so2.label == so.label) {
                        DataHandler.data[this.id].push(so2);
                    }
                }
            }
        } else {
            DataHandler.data[this.id].push(so);
        }
    }

    public populateResults (divResults : HTMLDivElement, prefixId : string = '') {
        let str = '';
        if (DataHandler.data[this.id].length == 0) {
            super.populateResults(divResults);
            return;
        }
        let ids = [];
        for (let i = 0; i < DataHandler.data[this.id].length; i++) {
            let lso = DataHandler.data[this.id][i];
            let label = lso.label;
            let prefix = `_${prefixId}`;
            let closeId = `rrClose${prefix}_${this.id}_${i}`;
            ids.push({"div": closeId, "id":lso.short});
            if (this.id == "country") {
                label = `<span class="windowRRShort">${lso.short}</span> - ${label}`;
            }
            str += `
                <div class="windowRR">
                    ${label}
                    <div class="windowRRClose" id="${closeId}">
                        <span><i class="fas fa-times"></i></span>
                    </div>
                </div>
            `;
        }
        divResults.innerHTML = str;
        for (let rec in ids) {
            utils.setClick(ids[rec].div, ()=>this.delete(ids[rec].id));
        }
    }

    public delete(id : string) {
        this.removeItem(id);
    }
}