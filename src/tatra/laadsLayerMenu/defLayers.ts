export interface ILayer {
    name        : string;
    label       : string;
    dataset     : string;
    param       : string;
    unit        : string;
    resolution  : string;
    mindate     : string;
    family      : Array <string>;
    grps        : Array <number>;
    format      : string;
    output      : string;
}
export interface ILayers {
    [layer : string] : ILayer;
}