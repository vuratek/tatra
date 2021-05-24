import 'ol/ol.css';
import { props } from "./props";
import { configProps } from "./support/configProps";
import { coreUtils } from "./support/coreUtils";
import { mapEvent } from "./handlers/mapEvent";
import { mapUtils } from "./mapUtils";
import './css/*.scss';
import { events } from "./events";
import { controls } from "./components/controls";
import { Layer, LayerSource } from "./obj/Layer";
import { layer } from "./handlers/layer";
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
        controls.setTool('pan');
        events.dispatch(events.EVENT_MAPVIEWER_READY);
        menu.registerMenu(id);
        hash.init();

        utils.clearLoader();
    }

    public static getLayerById (id : string) {
        return mapUtils.getLayerById(id);
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

    public static addDynamicLayer(date, band) {
        if (props.layers.length == 4) {
            let lo = new Layer();

            lo.id = "DynamicLayer";
            // if (lo.id == "") {
            //     lo.id = band + date;
            // }
            lo.title = "";
            lo._visible = false;
            lo.type = "tile_wms";
            lo._layer = null; // holds the actual layer once defined
            lo.source = new LayerSource();
            lo.source.url = "http://localhost:7080/cgi-bin/mapserv?map=/usr/local/apache2/htdocs/test/"+band+".map&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS="+band+"&SRS=EPSG:4326&BBOX=-125,30,-75,50&WIDTH=1024&HEIGHT=512&FORMAT=image/png&map.layer["+band+"]=data+"+band+"_"+date+".tif";
            lo.source.wrapX = true;
            lo._category = "overlay"; // basemap, layer or overlay
            lo.visible = true;

            props.layers.push(lo);
            layer.addLayer(lo);
        } else {
            let lo = map.getLayerById("DynamicLayer");
            // lo.source.url = "http://localhost:7080/cgi-bin/mapserv?map=/usr/local/apache2/htdocs/test/"+band+".map&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS="+band+"&SRS=EPSG:4326&BBOX=-125,30,-75,50&WIDTH=1024&HEIGHT=512&FORMAT=image/png&map.layer["+band+"]=data+merged_" + date + "_"+band+".tif";
            let url = "http://localhost:7080/cgi-bin/mapserv?map=/usr/local/apache2/htdocs/test/"+band+".map&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS="+band+"&SRS=EPSG:4326&BBOX=-125,30,-75,50&WIDTH=1024&HEIGHT=512&FORMAT=image/png&map.layer["+band+"]=data+"+band+"_"+date+".tif";
            lo._layer.getSource().setUrl(url);
            // lo._layer.getSource().setProperties("url","http://localhost:7080/cgi-bin/mapserv?map=/usr/local/apache2/htdocs/test/"+band+".map&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS="+band+"&SRS=EPSG:4326&BBOX=-125,30,-75,50&WIDTH=1024&HEIGHT=512&FORMAT=image/png&map.layer["+band+"]=data+merged_" + date + "_"+band+".tif");
        }
    }
}