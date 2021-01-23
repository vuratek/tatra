import { Map } from 'ol';
import { Layer } from './obj/Layer';
import { IConfigDef } from './defs/ConfigDef';
import { ScaleLine } from "ol/control";

export class props  {
    
    public static config                : IConfigDef;
    public static data                  = {};
    public static isIE                  : boolean = false;
    public static server                : string = '';
    
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

}
