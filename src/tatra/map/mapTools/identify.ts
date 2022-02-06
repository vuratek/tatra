import { BaseTool } from "./BaseTool";
import { props } from "../props";
import { mapUtils } from "../mapUtils";

export class Identify extends BaseTool  {

    public coordinate       : Array <number> = [];
    private listenerHandler!: (evt: Event) => void;

    public activate () {
        super.activate();
        let el = document.getElementById('map') as HTMLDivElement;
        if (el) {
            el.style.cursor="crosshair";
            this.listenerHandler = (evt : Event) => this.identify(evt);
            el.addEventListener("click", this.listenerHandler);
        }
        this.lo = mapUtils.getLayerById('identify');
        if (this.lo) {
            this.lo.visible = true;
            if (this.lo.boxSource) 
                this.lo.boxSource.clear();
        }
    }
    
    public deactivate () {
        super.deactivate();
        if (this.lo && this.lo.boxSource) { this.lo.boxSource.clear(); }
        let el = document.getElementById('map') as HTMLDivElement;
        if (el) {
            el.style.cursor="default";
            el.removeEventListener("click", this.listenerHandler);
        }
    }

    public identify ( evt : Event ) {
        if (props.map) {
            this.coordinate = props.map.getCoordinateFromPixel(props.map.getEventPixel(evt as UIEvent));
        }
    }

}
