import { SENSORS } from ".";

export interface IDataLayer {
    id          : string;
    label        : string;
    fileId      : string;
    icon        : Array <number>;
}

export interface IDataInfo {
    directory       : string;
    imageX          : number;
    imageY          : number;
    _x              : number;
    _y              : number;
    _offsetX        : number;
    _offsetY        : number;
    _delta          : number;
    _rows           : number;
    _maxRows        : number;
    _maxCols        : number;
    adjustSize      : boolean;
    layers          : Array <IDataLayer>;
    resolution      : Array <string>;
    geoInfo         : string;
}

export class SensorData {

    public info             : IDataInfo | null = null;

    public setData(sensor : SENSORS) {
        let dir = '';
        let x = 1,y = 1;
        let delta = 8;
        let rows = 13;
        let maxRows = 10;
        let maxCols = 15;
        let layers = [];
        let resolution = [];
        let adjust = false;
        let geo = "";

        switch (sensor) {
            case SENSORS.MODIS_TERRA:
                dir = 'realtime';
                layers.push ({id : "surf_refl1", label : "Bands 143 (true color)", fileId : "crefl1_143.A#DATE##TIME#00-#DATE2##TIME2#00.#RES#.jpg", icon : [0, 0]});
                layers.push ({id : "surf_refl2", label : "Bands 721", fileId : "crefl1_721.A#DATE##TIME#00-#DATE2##TIME2#00.#RES#.jpg", icon : [0, 70]});
                layers.push ({id : "surf_refl3", label : "Bands 367", fileId : "crefl1_367.A#DATE##TIME#00-#DATE2##TIME2#00.#RES#.jpg", icon : [0, 140]});
                delta = 9;
                x=68;
                y=102;
                maxRows = 11;
                maxCols = 16;
                resolution = ["20km", "500m"];
                geo = "geoinfo1.A#DATE##TIME#00-#DATE2##TIME2#00.jpg";
                adjust = true;
                break;
            case SENSORS.MODIS_AQUA:
                dir = 'realtime';
                layers.push ({id : "surf_refl1", label : "Bands 143 (true color)", fileId : "crefl2_143.A#DATE##TIME#00-#DATE2##TIME2#00.#RES#.jpg", icon : [0, 0]});
                layers.push ({id : "surf_refl2", label : "Bands 721", fileId : "crefl2_721.A#DATE##TIME#00-#DATE2##TIME2#00.#RES#.jpg", icon : [0, 70]});
                delta = 9;
                resolution = ["20km", "500m"];
                adjust = true;
                geo = "geoinfo2.A#DATE##TIME#00-#DATE2##TIME2#00.jpg";
                x=68;
                y=102;
                maxRows = 11;
                maxCols = 16;
                break;
            case SENSORS.VIIRS_NOAA20:
                dir = 'noaa20';
                layers.push ({id : "surf_refl1", label : "Bands I1 M4 M3 (true color)", fileId : "V1BCRI1M4M3_M#RES#.A#DATE#.#TIME#.jpg", icon : [0, 0]});
                layers.push ({id : "surf_refl2", label : "Bands M11 I2 I1", fileId : "V1BCRM11I2I1_M#RES#.A#DATE#.#TIME#.jpg", icon : [0, 70]});
                layers.push ({id : "surf_refl3", label : "Bands M3 I3 M11", fileId : "V1BCRM3I3M11_M#RES#.A#DATE#.#TIME#.jpg", icon : [0, 140]});
                x = 160;
                y = 162;
                resolution = ["20", ""];
                geo = "V1BCR_GEOJPG.A#DATE#.#TIME#.jpg";
                break;
            case SENSORS.VIIRS_SNPP:
                dir = 'viirs';
                x = 160;
                y = 162;
                resolution = ["20", ""];
                layers.push ({id : "surf_refl1", label : "Bands I1 M4 M3 (true color)", fileId : "VNBCRI1M4M3_M#RES#.A#DATE#.#TIME#.jpg", icon : [0, 0]});
                layers.push ({id : "surf_refl2", label : "Bands M11 I2 I1", fileId : "VNBCRM11I2I1_M#RES#.A#DATE#.#TIME#.jpg", icon : [0, 70]});
                layers.push ({id : "surf_refl3", label : "Bands M3 I3 M11", fileId : "VNBCRM3I3M11_M#RES#.A#DATE#.#TIME#.jpg", icon : [0, 140]});
                geo = "VNBCR_GEOJPG.A#DATE#.#TIME#.jpg";
                break;
        }
        this.info = { 
            directory : dir, 
            imageX : x,
            imageY : y,
            _x : 1,
            _y : 1,
            _offsetX : 0,
            _offsetY : 0,
            _delta : delta,
            _rows : rows,
            _maxRows : maxRows,
            _maxCols : maxCols,
            layers : layers,
            resolution : resolution,
            adjustSize : adjust,
            geoInfo : geo
        };
    }
}