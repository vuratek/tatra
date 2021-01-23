import { configProps } from "../support/configProps";
import { Layer } from "../obj/Layer";
import { Tool } from "../obj/Tool";

export interface IConfigDef {
    properties          : configProps;
    layers              : Array <Layer>;
    components          : IComponents;
    tools               : ITools;
    mapControls         : IMapControls;
}

export interface ISupportFiles {
    files       : Array <string>;
}

export interface ITools {
    [key:string]    : Tool;
}

export interface IComponents {
    infoBar         : ComponentInfoBar;
    menus           : {};
    tools           : {};
    maxLabel        : {};
    controls        : {};
}
export class ComponentInfoBar {
    mapCursor       : string = "enabled";
    feature1    	: string = "enabled";
    feature2    	: string = "enabled";
}

export interface IMapControls {
    firmsInfo       : IMapControlsItem;
    pan             : IMapControlsItem;
    measure         : IMapControlsItem;
    identify        : IMapControlsItem;
    alwaysIdentify  : IMapControlsItem;
    select          : IMapControlsItem;
    spacer          : {};
    support_layers  : IMapControlsItem;
    timeline        : IMapControlsItem;
    resize          : IMapControlsItem;
    spacer2         : {};
    share           : IMapControlsItem;
    help            : IMapControlsItem;
    rightInfo       : IMapControlsItem;
}

export interface IMapControlsItem {
    load?           : string;
    label?          : string;
    icon?           : string;
    type?           : string;
    image?          : string;
    items?          : Array <string>;
    default?        : string;
    handler?        : Function;
}
