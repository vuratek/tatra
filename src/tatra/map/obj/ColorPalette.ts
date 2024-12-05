import { utils } from "../../utils";

export class ColorPaletteValues {
    public min : number = 0;
    public max : number = 0;
    public ref : number = 0;
    public color : string = "";
}

export interface IGIBSPaletteItem {
    colors  : Array<string>;
    id      : string;
    name    : string;
}
export interface IGIBSPalette {
    [key:string] : IGIBSPaletteItem;
}

export class ColorPalette {
    public id : string = "";
//    public colors : Array <string> = [];
//    public refs : Array <string> = [];
    public values : Array <ColorPaletteValues> = [];
    public minLabel : string = "";
    public maxLabel : string = "";
    public units    : string | null = null;

    public ingest(data : string) {
        if (utils.isJson(data)) {
            let json = JSON.parse(data);
            this.id = json.id;
            //this.colors = json["maps"][0]["entries"]["colors"];
//            this.refs = json["maps"][0]["entries"]["refs"];
            this.minLabel = json["maps"][0]["legend"]["minLabel"];
            this.maxLabel = json["maps"][0]["legend"]["maxLabel"];
            if (json["maps"][0]["legend"]["units"]) {
                this.units = json["maps"][0]["legend"]["units"];
            }
            /* let arr = json["maps"][0]["entries"]["values"];
            for (let i=0; i < arr.length; i++) {
                if (arr[i].length == 2) {
                    let cpv = new ColorPaletteValues();
                    cpv.min = arr[i][0];
                    cpv.max = arr[i][1];
                    cpv.ref = Number(json["maps"][0]["entries"]["refs"][i]);
                    cpv.color = json["maps"][0]["entries"]["colors"][i];
                    this.values.push(cpv);
                }
            } */
            let arr = json["maps"][0]["legend"]["tooltips"];
            for (let i=0; i < arr.length; i++) {
                let arr2 = arr[i].split(' - ');
                let cpv = new ColorPaletteValues();
                if (arr2.length == 2) {
                    cpv.min = arr2[0];
                    cpv.max = arr2[1];
                } else {
                    cpv.min = arr2[0];
                    cpv.max = arr2[0];
                }
                cpv.ref = Number(json["maps"][0]["entries"]["refs"][i]);
                cpv.color = json["maps"][0]["entries"]["colors"][i];
                this.values.push(cpv);
            }
        } else {
            console.error("Invalid Color Palette JSON file.");
        }
    }
}