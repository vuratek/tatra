import { baseTool } from "./baseTool";
import { selection } from "../selection";
import { Draw } from "ol/interaction";
import { props } from "../props";

/* NOT WORKING WITH THE NEW SETUP */

export class drawBox extends baseTool {        
        public static init () {
            if (! this.lo) {
            	this.lo = selection.getAssociatedLayer('draw');
        	
//            if (lmv.mapTools.drawBox.layer) {
//                lmv.mapTools.drawBox.setAssociatedLayer(lmv.mapTools.drawBox.layer);
            }
        }
        
        // set layer that is manipulated - this may change for tools that share similar behaviour
        public static setAssociatedLayer (id : string) {
            this.layer = id;
            this.lo = selection.getAssociatedLayer(this.layer);
        }
        
        public static activate () {
            if (this.isActive) { return; }
            super.activate();
            
            //lmv.selection.setActiveLayer(lmv.mapTools.drawBox.lo);

            let lo = selection.activeLayer;
            selection.interaction = new Draw({
                source: lo.boxSource,
                value: "LineString",
                //condition: ol.events.condition.platformModifierKeyOnly,
                geometryFunction: function(coordinates, geometry) {
                    if (!geometry) {
                        geometry = new ol.geom.Polygon(null);
                    }
                    let start = coordinates[0];
                    let end = coordinates[1];
                    geometry.setCoordinates([
                        [start, [start[0], end[1],], end, [end[0], start[1],], start,],
                    ]);
                    return geometry;
                }, //geometryFunction,
                maxPoints: 2,
            });
            selection.interaction.on("drawend", function(e) {
                let func = eval("lmv.handlers.selectLayer." + lo.source.selectHandler);
                func(e);
                selection.populateFeatureLayer(true);
            });
            props.map.addInteraction(selection.interaction);
            
        }
        public static deactivate () {
            if ( ! this.isActive) { return; }
            super.deactivate();
            selection.deactivateLayer();
        }
}
