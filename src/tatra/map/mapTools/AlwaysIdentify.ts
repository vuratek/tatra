import { map } from "../index";
import { props } from "../props";
import { Layer } from "../obj/Layer";
import { events } from "../events";
import { BaseTool } from "./BaseTool";

export class AlwaysIdentify extends BaseTool  {

    public coordinate       : Array <number> = [];
    private listenerHandler!: (evt: Event) => void;
    public lo               : Layer | null = null;

    public activate () {
        if (! props.map) { return; }
        this.listenerHandler = (evt : Event) => this.identify(evt);
        props.map.on('singleclick', this.listenerHandler);
        this.lo = map.getLayerById('identify');

        if (this.lo) {
            this.lo.visible = true;
            if (this.lo.boxSource) 
                this.lo.boxSource.clear();
        }
    }
    
    public deactivate () {
        if (this.lo && this.lo.boxSource) { this.lo.boxSource.clear(); }
        props.map.un('singleclick', this.listenerHandler);
    }

    public identify ( evt : Event ) {
        if (props.map && props.map.getView().getZoom() > 6) {
            this.coordinate = evt.coordinate;
        }
    }

}
