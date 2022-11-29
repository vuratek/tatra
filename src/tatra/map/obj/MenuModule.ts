import { MenuModuleSettings } from "./MenuModuleSettings";
import { Module } from "../menu/components/Module";

export interface ILayerReference {
    id              : string;
}

export class MenuModule {
    public id               : string = '';
    public settings         : MenuModuleSettings = new MenuModuleSettings();
    public label            : string = '';
    public component        : string = '';
    public moduleHandler    : Module | null = null;
    public layer_refs       : Array <ILayerReference> = [];
}