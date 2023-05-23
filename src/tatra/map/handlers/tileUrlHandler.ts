import TileLayer from "ol/layer/Tile";

export interface IUrlHandler {
    [key:string] : Function;
}

export class tileUrlHandler {
    private static handlers : IUrlHandler = {};

    /**
     * register = register layer handler for URL and time updates
     * @param name 
     * @param func 
     */
    public static register (name : string, func : Function) {
        if (! this.handlers[name]) {
            this.handlers[name] = func;
        }
    }

    /**
     * getTileUrlHandler
     * @param name - name used for referencing in config
     * @param id - layer id
     */

    public static getTileUrlHandler(name:string, id:string) : Function | null {
        if (this.handlers[name]) {
            return function (tileCoord : Array<number>) {
                return tileUrlHandler.handlers[name](id, tileCoord);
            }
        }
        return null;
    }
    
    /**
     * getTileLoadHandler - handles tileLoadFunction function (used by GIBS layers)
     * @param name 
     * @param id 
     */
    public static getTileLoadHandler(name:string, id:string) {
        if (this.handlers[name]) {
            return function (imageTile : TileLayer, src : string) {
                imageTile.getImage().src = tileUrlHandler.handlers[name](imageTile, src, id);
            }
        }
        return null;
    }
}
