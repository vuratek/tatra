export interface ILayerInfo {
    id               : string;
    label?           : string;
    GIBS_id?         : string;
    GIBS_imageId?    : string;
    GIBS_hasDate?    : boolean;
    Local_id?        : string;
    Local_imageId?   : string;
    keywords?        : Array <string>;
    dateInfo?        : string;
    category?        : string;
    repeat?          : string;
}

export interface ILayerCategory {
    id      : string;
    label   : string;
}
export interface ILayerCategories {
    [key : string]  : ILayerCategory;
}
export interface ILayerSettings {
    localDescriptionUrl : string;
    localImageUrl : string;
    LayerInfoWindowLabel? : string;
    faqUrl? : string;
}

export interface ILayerConfig {
    infos       : Array <ILayerInfo>;
    categories? : Array <ILayerCategory>;
    settings?   : ILayerSettings;
}