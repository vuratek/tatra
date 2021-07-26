import { Map } from 'ol';
import { Layer } from './obj/Layer';
import { IConfigDef } from './defs/ConfigDef';
import { ScaleLine } from "ol/control";
import { ColorPalette } from './obj/ColorPalette';

export class props  {
    
    public static config                : IConfigDef | any = {};
    public static data                  = {};
    public static isIE                  : boolean = false;
    public static server                : string = '';
    public static defaultStartTool      : string = 'pan';
    public static map                   : Map;
    public static currentBasemap        : string = '';
    
    public static layers                : Array <Layer> = [];
/*    public static baseLayers : [];
    public static overlayLayers : [];*/
    
    public static hashValue             : string =  '';
    
    public static scaleLineControlKM    : ScaleLine | null = null;
    public static scaleLineControlMI    : ScaleLine | null = null;
//    public static scaleUnits            : string = "metric";

    public static analytics             : boolean = false;
    public static analyticsToolEvent    = null;

    public static windowIsOpened            : boolean = false;
    public static window                    : boolean = false;

    public static colorPalettes         : IColorPalettes = {};
    public static colorLookup           : IColorLookup = {};    // colorLookup["layer_id"] = ["color1" : "color_lookup1", ...]
    public static defaultBasemap        : string = 'earth';
    public static locatorSubset         : string | null = null;

    public static getApplicationName () : string {
        return props.config.properties.applicationName;
    }
}

export interface IColorPalettes {
    [colorPaletteId : string] : ColorPalette;
}

export interface IColorLookup {
    [layer_id : string] : IColorLookupItem;
}
export interface IColorLookupItem {
    [color : string] : number;
}
