import { BaseTool } from "./BaseTool";
import { props } from "../props";
import { Layer, LayerSource } from "../obj/Layer";
import { mapUtils } from "../mapUtils";
import { classicSelection, Drag, DownUpInteraction } from "./classicSelection";
import PointerInteraction from "ol/interaction/Pointer";
import { DataHandler } from "./dataHandler";

export class DrawClassicBox extends BaseTool {

    private cs : classicSelection;
    private dragInteraction : PointerInteraction | null = null;
    private downUpInteraction : PointerInteraction | null = null;


    public constructor (id : string) {
        super(id);
        this.lo = mapUtils.getLayerById('drawClassic');
        if (!this.lo) { 
            this.lo = new Layer();
            this.lo.type = "drawClassicLayer";
            
            this.lo.id = "drawClassic";
            this.lo.clandestine = true;
            this.lo.source = new LayerSource();
            this.lo.source.style = "measure";
            props.layers.push(this.lo);
        } 
        this.cs = new classicSelection(this.lo);
    }

    public activate() {
        classicSelection.data = DataHandler.getData(this.id);

        super.activate();
        if (this.lo) this.lo.visible = true;
        if (props.map) {
            mapUtils.useDragPan(false);
            this.dragInteraction = new Drag();
            this.downUpInteraction = new DownUpInteraction();
            props.map.getInteractions().extend([this.dragInteraction as PointerInteraction, this.downUpInteraction as PointerInteraction ]);
        }        
    }

    public deactivate() {
        super.deactivate();
        if (props.map) {
            mapUtils.useDragPan(true);
        }
        this.removeInteraction();
        if (this.lo) this.lo.visible = false;
        //this.clearLayer();
    }

    private removeInteraction () {
        if (this.dragInteraction) { props.map.getInteractions().remove(this.dragInteraction); }
        if (this.downUpInteraction) { props.map.getInteractions().remove(this.downUpInteraction); }
    }

    public populateResults (divResults : HTMLDivElement, prefixId : string = '') {
        let str = '';
        if (DataHandler.getData(this.id).length == 0) {
            super.populateResults(divResults);
            return;
        }
        let data = DataHandler.getData(this.id);
        for (let i = 0; i < data.length; i++) {
            let lso = data[i];
            let label = lso.value.formatWNES();
            let even = (i%2 == 0) ? 'windowRREven' : '';
            str += `<div class="windowRR ${even}">${label}</div>`;
        }
        divResults.innerHTML = str;
    }
}