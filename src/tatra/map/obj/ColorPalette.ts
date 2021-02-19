import { utils } from "../../utils";
import { ImageArcGISRest } from "ol/source";

export class ColorPaletteValues {
    public min : number = 0;
    public max : number = 0;
    public ref : number = 0;
    public color : string = "";
}

export class ColorPalette {
    public id : string = "";
//    public colors : Array <string> = [];
//    public refs : Array <string> = [];
    public values : Array <ColorPaletteValues> = [];
    public minLabel : string = "";
    public maxLabel : string = "";

    public ingest(data : string) {
        if (utils.isJson(data)) {
            let json = JSON.parse(data);
            this.id = json.id;
            //this.colors = json["maps"][0]["entries"]["colors"];
//            this.refs = json["maps"][0]["entries"]["refs"];
            this.minLabel = json["maps"][0]["legend"]["minLabel"];
            this.maxLabel = json["maps"][0]["legend"]["maxLabel"];
            let arr = json["maps"][0]["entries"]["values"];
            for (let i=0; i < arr.length; i++) {
                if (arr[i].length == 2) {
                    let cpv = new ColorPaletteValues();
                    cpv.min = arr[i][0];
                    cpv.max = arr[i][1];
                    cpv.ref = Number(json["maps"][0]["entries"]["refs"][i]);
                    cpv.color = json["maps"][0]["entries"]["colors"][i];
                    this.values.push(cpv);
                }
            }
        } else {
            console.error("Invalid Color Palette JSON file.");
        }
    }
}