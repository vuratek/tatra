import { Layer } from "./obj/Layer";
import { Interaction } from "ol/interaction";
import { props } from "./props";
import { Coord } from "./obj/Coord";
import { Select } from "ol/interaction";
import { platformModifierKeyOnly } from "ol/events/condition";
//import { selectionUtils} from "./support/selectionUtils";
import { map } from ".";
import { mapUtils } from "./mapUtils";
import { events } from "./events";
import { tools } from "./tools";
import { selectLayer } from "./handlers/selectLayer";
import { Selection } from "./obj/Selection";

export class selection {
        
    public static selectLayers          : Array <Layer> = [];
    public static activeLayer           : Layer | null = null;
    public static interaction           : Interaction | null = null;
    public static data                  = [];
    public static multipleSelection     : boolean = true;
    
    public static applyData (data) {
        selection.clearLayer();
        if (data && selection.activeLayer) {
            if (selection.activeLayer.type == "manualLayer") {
                for (let i = 0; i < data.length; i++) {
                    selection.applyCoordinates(data[i].value);
                }
            } else if (selection.activeLayer.type == "drawClassicLayer") {
                let coord = data[0].value;
                selection.drawRectangle([coord.west, coord.north], [coord.east, coord.south]);
            } else {
                for (let i = 0; i < data.length; i++) {
                    selection.addItem(data[i]);
                }
                selection.populateFeatureLayer(false);
            }
        }
        events.selectionUpdate( false );
    }
    
    
    
    public static applyCoordinates (coord : Coord) {
        if (selection.activeLayer && selection.activeLayer.type == "manualLayer") {
            let id = "custom_" + mapUtils.formatValues(coord);
            for (let i = 0; i < selection.data[selection.activeLayer.id].length; i++) {
                let lso = selection.data[selection.activeLayer.id][i];
                if (lso.id == id) {
                    return;
                }
            }
            let so = new Selection(id, coord, selection.activeLayer.addFeature(coord), coord.formatWNES());
            selection.addItem(so);
        }
    }
};
