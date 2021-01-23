import { Selection } from "../obj/Selection";

export interface ISelectData {
    [key : string] : Array <Selection>;
}

export class DataHandler {
    public static data : ISelectData = {};
    public static activeTool : string = '';

    public static setData (id:string) {
        if (!this.data[id]) {
            this.data[id] = [];
        }        
    }

    public static getData (id:string) : Array<Selection> {
        return this.data[id];
    }

    public static clear(id: string) {
        if (this.data[id]) {
            this.data[id] = [];
        }
    }
    public static clearAll () {
        this.data = {};
    }
}