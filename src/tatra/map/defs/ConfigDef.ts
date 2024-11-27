import { configProps } from "../support/configProps";
import { Layer } from "../obj/Layer";
import { Tool } from "../obj/Tool";
import { Module } from "../menu/components/Module";
import { ISymbolsStyles } from "../handlers/layerStyle";

export interface IConfigDef {
    components          : IComponents;
    modules             : Array <IMenuModule> | null;
    symbols             : ISymbolsStyles;
    layers              : Array <Layer>;
    mapControls         : IMapControls;
    menuOptions         : Array <IMenuOption> | null;
    properties          : configProps;
    tools               : ITools;
}
export interface IModuleHandlers {
    [key:string]    : Module;
}
export interface IMenuOptionModule {
    id              : string;
    opened?         : boolean;
}
export interface IMenuOption {
    modules         : Array <IMenuOptionModule> | null;
    isDefault?      : boolean;
    id              : string;
    label           : string;
    icon            : string;
    icon_fab?       : string;
    icon_color?     : string | null;
    description     : string;
    noAction?       : boolean;
    copyHash?       : boolean;          // add current hash; helpful for switching map viewers
    urlRedirect?    : string | null;        // make the button function like a regular link
    isInfoMode?      : boolean;             // if is infoMode, do not use as typical menu option
}
export interface IMenuModuleLayerSettings {
    opened          : boolean;
    day_selected    : boolean;
    night_selected  : boolean;
    has_daynight    : boolean;
    pixelSize       : string;
    variable        : string;
    has_frp         : boolean;
    has_confidence  : boolean;
    is_confidence_type : boolean;
}
export interface IMenuModuleLayers {
    id              : string;
    visible         : boolean;
    _defaultVisible : boolean | null;
    isFill?         : boolean | null;
    settings        : IMenuModuleLayerSettings | null;
}
export interface IGroupBreaker {
    id              : string;
    moduleId        : string;
    layers          : Array<string>;
    label           : string;
    opened          : boolean;
    menuDescription? : string;
    highlight?      : string;
    type?           : string;
    refLayers       : Array<IMenuModuleLayers> | null;
}

export interface IDateModuleOptions {
    isSingle?       : boolean;          // if single slider should be used insead of a range
    enableVideo?    : boolean;          // whether video should be in timeline 
}
export interface IMenuModule {
    id                  : string;
    label               : string;
    icon                : string | null;
    description?        : string | null;        // module description
    module              : string;
    opened?             : boolean;
    tag                 : string | null;        // used for matching layers in the config
    defaultLayers       : Array<string> | null; // default layers that should load unless URL overrides it
    noGroup?            : boolean;              // if set, doesn't show +/- for expansion; default is false
    isTopModule?        : boolean;              // this is top part of map menu and the sroll doesn't apply to this
    hasMultiLayer?      : boolean | null;       // dynamic imagery by default only allows 1 layer, but this will show a checkbox and allow multiple
    isMultiLayerActive? : boolean | null;   // whether the multilayer option is turned on; ties with hasMultiLayer
    layer_refs?         : Array<IMenuModuleLayers> | null;  // this will only include tagged (tag:) layers referenced in this array
    usePresetLayers     : boolean;              // when switching tabs, do you maintain viewable layers. Applicable to modules that are persistent
    handler             : Module | null;        // module handler pointer
    groupBreakers?      : Array<IGroupBreaker> | null;        // creates all on/off button for group of layers
    descriptionText?    : string;              // passing description text for ex bookmarks
    menuDescription?    : string;              // description used in menu selection
    useLayerRefsOrder?  : boolean;           // should layers sort based on layer_refs or appearance in list layer
    skipMenuDisplay?    : boolean;
    bubble?             : string;           // show header extra info in a bubble
    bubbleClass?        : string;           // apply extra class to the header
    menuLabel?          : string | null;
    localRedirect?      : string | null;       // if set, this will added in front of layer source url (ex. fires: redirect/mapserver/...)
    options?            : IDateModuleOptions | null;  // additional settings if applicable
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