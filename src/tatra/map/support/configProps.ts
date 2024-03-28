import { UNITS } from "../mapTools/utils";

export class configProps {
    public static aoi                   : Array <string> | null = null;
    public static aoiType               : string | null = null;
    public static allowHashProps        : boolean = false;
    public applicationName              : string = '';
    public static center                : Array <number> = [0, 0];
    public static dates                 : string | null = null;
    public static extent                : [number, number, number, number] | null = null;
    public static hasLocation           : boolean = true;
    public icons                        : string | null = null;
    public static initURL               : string = '';
    public layerInfoURL                 : string = '';
    public static layers                : string | null = null;
    public static locationDecimals      : number = 2;
    public static longName              : string = '';
    public static mapbox                : string | null = null;
    public mapDatesURL                  : string | null = null;
    public static maxZoom               : number = 10;
    public static measureAreaUnits      : UNITS = UNITS.KM;
    public static measureDistanceUnits  : UNITS = UNITS.KM;
    public static minZoom               : number = 2;
    public static showLocation          : boolean = false;
    public static tab                   : string | null = null;
    public static zoom                  : number = 3;
    public static zTop                  : number = 0;
};
