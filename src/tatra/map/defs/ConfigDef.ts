import { configProps } from "../support/configProps";
import { MenuModule } from "../obj/MenuModule";
import { Layer } from "../obj/Layer";
import { Tool } from "../obj/Tool";
import { MenuOption } from "../menu/MenuOption";
import { Module } from "../menu/components/Module";

export interface IConfigDef {
    components          : IComponents;
    modules             : Array <MenuModule> | null;
    layers              : Array <Layer>;
    mapControls         : IMapControls;
    menuOptions         : Array <IMenuOption> | null;
    properties          : configProps;
    tools               : ITools;
}
export enum MenuOptionCategory {
    MENU        = "menu",
    TAB         = "tab"
}

export interface IModuleHandlers {
    [key:string]    : Module;
}
export interface IMenuOption {
    category        : MenuOptionCategory | null;
    modules         : Array <string> | null;
    id              : string;
    label           : string;
    icon            : string;
    description     : string;
    options         : Array <IMenuOption> | null;
    _handler        : MenuOption | null;
    _moduleHandlers : IModuleHandlers;
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