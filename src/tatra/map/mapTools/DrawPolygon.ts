import { BaseTool } from "./BaseTool";
import Draw, { DrawEvent } from 'ol/interaction/Draw';
import { props } from "../props";
import { Layer, LayerSource } from "../obj/Layer";
import { Selection } from "../obj/Selection";
import {unByKey} from 'ol/Observable';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import GeometryType from "ol/geom/Geometry";
import { selectLayer } from "../handlers/selectLayer";
import { events } from "../events";
import { DataHandler } from "./dataHandler";
import { utils } from "../../utils";
import { mapUtils } from "../mapUtils";


export class DrawPolygon extends BaseTool {

    private draw                    : Draw | null = null;
    private drawStartListener!      : (evt: Event) => void;   
    private drawEndListener!        : (evt: Event) => void;   

    private allowMultiple : boolean = false;


    public constructor (id : string) {
        super(id);
    }

    public activate() {
        super.activate();
        this.lo = mapUtils.getLayerById('polygon');
        if (!this.lo) { 
            this.lo = new Layer();
            this.lo.type = "manualLayer";
            this.lo.id = "polygon";
            this.lo.clandestine = true;
            this.lo.source = new LayerSource();
            this.lo.source.style = "measure";
            props.layers.push(this.lo);
        } 
        this.lo.visible = true;
        if (props.map) {
            this.addInteraction();
            props.map.addInteraction(this.draw as Draw);
        }        
    }

    public deactivate() {
        super.deactivate();
        if (props.map) {
            props.map.removeInteraction(this.draw as Draw);
        }
        this.removeInteraction();
        if (this.lo) {
            this.lo.visible = false;
        }
        //this.clearLayer();
    }

    public allowMultipleSelection ( enabled : boolean ) {
        this.allowMultiple = enabled;
    }

    public hasExtraToolBar(divId : string) : boolean {
        let el = document.getElementById(divId) as HTMLDivElement;
        let id = `multiselection_${this.id}`;
        if (el) {
            el.innerHTML = `<input type="checkbox" id="${id}"> allow multiple selection`;
        }
        let el2 = document.getElementById(id) as HTMLInputElement;
        if (el2) {
            el2.checked = this.allowMultiple;
        }
        utils.setClick(id, () => this.setMultiSelection());
        return true;
    }

    private setMultiSelection() {
        this.allowMultiple = ! this.allowMultiple;
    }

    private addInteraction() {
        if (!this.lo || !this.lo.boxSource) { return; } 
        this.draw = new Draw({
            source: this.lo.boxSource,
            type: GeometryType.POLYGON,
            style: [
                new Style({
                    stroke: new Stroke({
                        color: 'rgba(220, 220, 220, 0.7)',
                        width: 4
                    })
                }),
                new Style({
                    fill: new Fill({
                        color: 'rgba(255, 255, 55, 0.4)'
                    }),
                    stroke: new Stroke({
                        color: 'rgba(20, 20, 20, 0.7)',
                        lineDash: [10, 10],
                        width: 2
                    }),
                    image: new CircleStyle({
                        radius: 5,
                        stroke: new Stroke({
                            color: 'rgba(0, 0, 0, 0.7)'
                        }),
                        fill: new Fill({
                            color: 'rgba(255, 255, 255, 0.2)'
                        })
                    })
                })
            ]                
        });
        if (this.draw) {
            this.drawStartListener = (evt) => this.onDrawStart(evt as unknown as DrawEvent);
            this.drawEndListener = (evt) => this.onDrawEnd(evt as unknown as DrawEvent);
            this.draw.on('drawstart', this.drawStartListener);
            this.draw.on('drawend', this.drawEndListener);
        }
    }

    private removeInteraction () {
        if (this.draw) {
            unByKey(this.drawStartListener as any);
            unByKey(this.drawEndListener as any);
        }        
    }

    private onDrawStart (evt : DrawEvent) {
        if (! this.allowMultiple) {
            this.clearLayer();
        }
        events.selectionUpdate( this.id );
    }

    private onDrawEnd (evt : DrawEvent) {
        DataHandler.data[this.id].push(selectLayer.drawPolygon(evt) as Selection);
        events.selectionUpdate( this.id );
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
            let label = lso.value.formatWNES();
            let prefix = `_${prefixId}`;
            let closeId = `rrClose${prefix}_${this.id}_${i}`;
            ids.push({"div": closeId, "id":lso.short});
            let even = (i%2 == 0) ? 'windowRREven' : '';
            str += `
                <div class="windowRR ${even}">
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