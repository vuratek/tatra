import { Map } from 'ol';
import { Layer } from './obj/Layer';
import { IConfigDef } from './defs/ConfigDef';
import { ScaleLine } from "ol/control";
import { ColorPalette } from './obj/ColorPalette';
import { ProductDates } from './obj/ProductDates';
import { Module } from './menu/components/Module';
import { MapTime } from "./obj/MapTime";

export class props  {
    
    public static config                : IConfigDef | null = null;
    public static data                  = {};
    public static isIE                  : boolean = false;
    public static server                : string = '';
    public static defaultStartTool      : string = 'pan';
    public static map                   : Map;
    public static currentBasemap        : string = '';
    public static mapPinUrl             : string = '/images/map-pin.png';    
    public static ignoreResize          : boolean = false;
    public static imageryDate 		    : Date = new Date();
    public static version               : string = '1.0.0';
    public static mapMenuOpened         : boolean = false;
    
    public static layers                : Array <Layer> = [];
/*    public static baseLayers : [];
    public static overlayLayers : [];*/
    
    public static hashValue             : string =  '';
    public static locatorFLyToEnabled   : boolean = false;
    
    public static scaleLineControlKM    : ScaleLine | null = null;
    public static scaleLineControlMI    : ScaleLine | null = null;
//    public static scaleUnits            : string = "metric";

    public static analytics             : boolean = false;
    public static analyticsToolEvent    = null;

    public static windowIsOpened            : boolean = false;
    public static window                    : boolean = false;

    public static menuModules           : IMenuModuleLoader = {};

    public static colorPalettes         : IColorPalettes = {};
    public static colorLookup           : IColorLookup = {};    // colorLookup["layer_id"] = ["color1" : "color_lookup1", ...]
    public static defaultBasemap        : string = 'earth';
    public static locatorSubset         : string | null = null;
    public static tileLoadActive        : ITileLoadTracker = {};
    public static time                  : MapTime = new MapTime();

    public static productDates          : Array<ProductDates> = [];

    public static allowMultipleDynamicLayersSelection  : boolean = false;       // whether to provide the UI (checkbox)
    public static allowMultipleDynamicLayers  : boolean = false;                // if the value is ON/OFF so multiple layers can be on
    public static ignoreBasemapUpdate : boolean = false;

    public static getApplicationName () : string {
        if (props.config) {
            return props.config.properties.applicationName;
        }
        return '';
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
export interface ITileLoadTracker {
    [layer_id:string] : number;
}

export interface IMenuModuleLoader {
    [menu_module_id : string] : Module;
}