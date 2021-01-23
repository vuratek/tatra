import { map } from "../map";
import { Layer } from "../map/obj/Layer";
import { layer as layerHandler } from "../map/handlers/layer";
import { events } from "./events";
import { model } from "./model";
import { props } from "../map/props";

export class control {
    public static update() {
        let base = map.getLayerById('imagery_template_250m');
        if (! base ) {
            console.log('missing imagery_template_250m layer');
            return;
        }
        
        for (let id in model.selectedLayers) {
            if (! map.getLayerById('layer-' + id) && model.layers) {
                let lo = new Layer();
                lo.id = 'layer-' + id;
                lo.title = model.layers[id].label;
                lo.type = "wmts";
                lo.clandestine = false;
                lo.handler = "imagery";
                lo.tag = "laads";
                lo.source = JSON.parse(JSON.stringify(base.source)); 
//                lo.source.url = base.source.url;
                if (lo.source) {
                    lo.source.layer = model.layers[id].name;
                    if (model.layers[id].format == 'png' || model.layers[id].format == 'ppng') {
                        lo.source.format = 'image/png';
                    }
                    lo.source.matrixSet = 'EPSG4326_' + model.layers[id].output;

                    let ind = this.getStartLayerPosition();
                    props.layers.splice(ind+1, 0, lo);
                    layerHandler.addLayer(lo);
                    lo.time = model.currentDate;
                    lo.visible = true;
                }
            }
        }
        
        for (let i = props.layers.length - 1; i >= 0; i-- ) {
            let lo = props.layers[i];
            if (lo.category == "layer" && ! lo.clandestine && lo.tag == "laads") {
                let id = lo.id.replace('layer-', '');
                if (model.selectedLayers[id]) {
                    continue;
                } else {
                    layerHandler.removeLayer(lo);
                }
            }
        }
        events.layersDate();
    }

    private static getStartLayerPosition () {
        let started = false;
        for (let i=0; i<props.layers.length; i++) {
            if ( props.layers[i].id == 'imagery_template_250m' ) {
                started = true;
                continue;
            }
            if ( started && props.layers[i].category != 'layer' ) {
                return i-1;
            }
        }		
        return props.layers.length-1;
    }
}