export enum IMPACT_COLLECTIONS {
    HLSL30 = "C2021957657-LPCLOUD",
    HLSS30 = "C2021957295-LPCLOUD"
}
export enum IMPACT_COLORFORMULA {
    FALSE_COLOR = "Gamma RGB 2.5 Saturation 1.2 Sigmoidal RGB 10 0.35",
    TRUE_COLOR = "Gamma RGB 3.5 Saturation 1.2 Sigmoidal RGB 15 0.35"
}
// colormap: summer_r", 

export interface IImpactDateRecord {
    [date : string] : string | null;
}

export interface IImpactRecords {
    [key : string] : IImpactDateRecord;
}

export interface IImpactRecord {
    backend?        : string;
    bands?          : Array<string>;
    bands_regex?    : string;
    collection?     : string;
    color_formula?  : string;
    colormap?       : string;
    expression?     : string;
    isTool?         : boolean;
    rescale?        : string;
}

export class ImpactRecord {
    public id               : string = "undefined";
    public collection       : IMPACT_COLLECTIONS = IMPACT_COLLECTIONS.HLSS30;
    public bands_regex      : string = "B[0-9][0-9A-Za-z]";
    public backend          : string = "rasterio";
    public color_formula    : IMPACT_COLORFORMULA | null = null;
    public colormap         : string | null = null;
    public bands            : Array<string> = ['B04','B03','B02'];  // true color
    public rescale          : string | null = null;
    public expression       : string | null = null;
    public isTool           : boolean = false;
    public minzoom          : number = 7;
    public maxzoom          : number = 13;

    /**
     * 
     * @param id unique identifies
     * @param obj provides info on the layer. if not provided, it will default to Sentinel True Color
     */
    public constructor (id : string, obj : IImpactRecord | null) {
        this.id = id;
        if (obj) {
            if (obj.backend) this.backend = obj.backend;
            if (obj.bands && obj.bands.length <=3) this.bands = obj.bands;
            if (obj.bands_regex) this.bands_regex = obj.bands_regex;
            if (obj.collection && obj.collection == "HLSL30") this.collection = IMPACT_COLLECTIONS.HLSL30;
            if (obj.color_formula) {
                if (obj.color_formula == "false_color") this.color_formula = IMPACT_COLORFORMULA.FALSE_COLOR;
                else this.color_formula = IMPACT_COLORFORMULA.TRUE_COLOR;
            } 
            if (obj.colormap) this.colormap = obj.colormap;
            if (obj.expression) this.expression = obj.expression;
            if (obj.isTool) this.isTool = obj.isTool;
            if (obj.rescale) this.rescale = obj.rescale;
        }
    }
}