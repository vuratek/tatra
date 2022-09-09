import 'ol/ol.css';
import { props } from "./props";
import { configProps } from "./support/configProps";
import { coreUtils } from "./support/coreUtils";
import { mapEvent } from "./handlers/mapEvent";
import { mapUtils } from "./mapUtils";
import { events } from "./events";
import { controls } from "./components/controls";
import { get as projGet } from "ol/proj";
import { Map, View } from "ol";
import { IConfigDef } from "./defs/ConfigDef";
import { components } from "./support/components";
import { layerStyle } from './handlers/layerStyle';
import { menu } from './menu';
import 'elm-pep';
import noUiSlider from "nouislider";
import { hash } from './hash';
import { utils } from '../utils';
import './css/*.scss';
import { layerInfo } from './layerInfo';

interface Window {
    [key:string]: any; // Add index signature
}
export class map {

    public static noUiSlider = noUiSlider;

    public static init (id: string, config : IConfigDef, layers : Array <string>) {
        props.server = window.location.hostname.split('.')[0];
        coreUtils.setConfigProps(config);
        if (mapUtils.getIEVersion() > 0) {
            props.isIE = true;
            coreUtils.setIEfunctions();
        }
        let options = {
            projection: projGet("EPSG:4326"),
            center: configProps.center,
            zoom: configProps.zoom,
            enableRotation : false,
            minZoom: configProps.minZoom, 
            maxZoom: configProps.maxZoom
        };
        if (configProps.extent) {
            options["extent"] = configProps.extent;
        }

        props.map = new Map({
            view: new View(options),
            target: "map"
        });

        coreUtils.addScaleLine();

        mapEvent.init();

        if (! (window as Window)["setWMTSTime"]) { (window as Window)["setWMTSTime"] = layerStyle.setWMTSTime; }
        if (! (window as Window)["updateOrbitUrl"]) { (window as Window)["updateOrbitUrl"] = layerStyle.updateOrbitUrl;}

        for (var i=0; i<layers.length; i++) {
            coreUtils.loadConfigFile("layers", layers[i]);
        }

        components.load();
        coreUtils.updateFromHash();
        coreUtils.loadLayers();
        mapUtils.setInfoBar();
        controls.init();
        coreUtils.setAOI();
        controls.setStartTool();
        events.dispatch(events.EVENT_MAPVIEWER_READY);
        menu.registerMenu(id);
        hash.init();
        layerInfo.init(props.config.properties.layerInfoURL);

        utils.clearLoader();
    }

    // in some instances javascript reads json directly, otherwise parse is needed
    public static parseJSON (result : string) {
        let str;
        try {
            str = JSON.parse(result);
        } catch (e) {
            str = result;
        }
        return str;
    }
}