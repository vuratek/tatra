import { ILayers } from "./defLayers";
import { events } from "./events";
import { events as mapEvents } from "../map/events";
export interface ITabSelection {
    [key : string] : string;
}
export interface IMenuLayer {
    [id : string] : number;
}

export interface ICategoryGroup {
    id              : number;
    name            : string;
    subgroup?       : Array <ICategoryGroup>;
    image?          : string;
    text?           : string;
}
export class model {

    public static layers            : ILayers | null = null;
    public static selectedLayers    : IMenuLayer = {};
    public static groups            : Array<ICategoryGroup> = [];
 
    public static currentTab : ITabSelection = {
        "main"          : "missions",
        "missions"      : "viirs_snpp",
        "land"          : "17",
        "atmosphere"    : "8"
    };

    private static _currentDate : Date = new Date();

    public static set currentDate ( d : Date ) {
        this._currentDate = d;
        events.updateDate();
    }

    public static get currentDate () : Date {
        return this._currentDate;
    }

    public static removeLayer (id : string, refresh : boolean = false) {
        if (model.selectedLayers[id]) {
            delete this.selectedLayers[id];
            if (refresh) {
                mapEvents.dispatch(mapEvents.EVENT_LAYERS_REFRESH);
            }
        }
    }
    public static addLayer (id : string, refresh : boolean = false) {
        if (! model.selectedLayers[id]) {
            model.selectedLayers[id] = 1;
            if (refresh) {
                mapEvents.dispatch(mapEvents.EVENT_LAYERS_REFRESH);
            }
        }
    }

}