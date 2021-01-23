import { BaseTool } from "./mapTools/BaseTool";

export interface IToolItem {
    [key : string] : BaseTool;
}
export class tools {

    public static items         : IToolItem = {};
    public static currentTool   : string = '';
    public static alwaysIdentify : boolean = false;

    public static definitions = {
        classic : {
            label: "CLASSIC",
            icon : "edit",
            text : "Draw Custom Box",
            info : "Draw box on the map. Panning is disabled"
        }, 
        clear : {
            label: "CLEAR",
            icon : "trash",
            text : "",
            info : ""
        },
        country : {
            label : "COUNTRY",
            icon : "flag",
            text : "Country Selection",
            info : "Click on the map to select countries"
        },
        draw : {
            label: "RECTANGLE",
            icon : "object-ungroup",
            text : "Draw Multiple Boxes",
            info : "Draw mulitple boxes on the map"
        }, 
        manual : {
            label: "MANUAL",
            icon : "pencil-alt",
            text : "Enter Coordinates",
            info : "Type coordinates of interest"
        }, 
        measureArea : {
            label: "AREA",
            icon : "vector-square",
            text : "Measure Area",
            info : "Click on the map to create area points -> Double-click to end"
        },
        measureDistance : {
            label: "DISTANCE",
            icon : "ruler-horizontal",
            text : "Measure Distance",
            info : "Click on the map to create distance points -> Double-click to end"
        },
        pan : {
            label: "PAN",
            icon : "hand-paper",
            text : "Pan",
            info : "Continue showing selection but allow panning"
        }, 
        polygon : {
            label: "POLYGON",
            icon : "draw-polygon",
            text : "Draw Polygon",
            info : "Draw polygon on the map"
        },
        site : {
            label: "SITE",
            icon : "circle",
            text : "Validation Sites Selection",
            info : "Click on the map to select sites"
        }, 
        tile : {
            label: "TILE",
            icon : "th",
            text : "Tile Selection",
            info : "Click on the map to select tiles"
        }, 
        world : {
            label: "WORLD",
            icon : "globe",
            text : "World",
            info : "Default if nothing else is selected"
        }
    };

    public static register (tool : BaseTool) {
        this.items[tool.id] = tool;
        if (tool.id == "alwaysIdentify") {
            this.alwaysIdentify = true;
        }
    }
        
    public static activate (id : string) {
        if (this.items[this.currentTool]) {
            this.items[this.currentTool].deactivate();
        }
        this.currentTool = id;
        if (this.items[this.currentTool]) {
            this.items[this.currentTool].activate();
            if (this.currentTool == "pan" && this.alwaysIdentify) {
                this.items["alwaysIdentify"].activate();
            }
        } else {
            console.log(`Tool ${id} is not registered.`);
        }
    }

    public static getToolById (id : string) : BaseTool {
        return this.items[id];
    }

    public static clearAll() {
        for (let tool in this.items) {
            this.items[tool].clearLayer();
        }
    }
    
}
