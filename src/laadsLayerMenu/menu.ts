import { Modal } from "../../../ui-navigation/tatra/aux/Modal";
import { model } from "./model";
import { missions } from "./tabs/missions";
import { land } from "./tabs/land";
import { atmosphere } from "./tabs/atmosphere";
import { ILayers } from './defLayers';
import { IMenu, _base } from './tabs/_base';
import { events } from './events';
import { events as mapEvents } from "../map/events";
import { props } from '../map/props';
import { control } from './control';
import groups from  './data/product_groups.json';
import './css/*.scss';

export class menu extends _base {

    public static tabs : IMenu = {
        "missions" : { label : "Missions", handler : () => missions.render() },
        "atmosphere" : { label : "Atmosphere", handler : () => atmosphere.render() },
        "land" : { label : "Land", handler : () => land.render() },
        "search" : { label : "", handler : () => missions.render() }
    };

    public static id : string = 'main';

    public static init (layers : ILayers) {
        model.layers = {};
        for (let layer in layers) {
            if ( ! layers[layer].dataset || layers[layer].dataset == "") {
                continue;
            }
            let newLayer = layer;
            if (layer.indexOf(' ') > 0) {
                newLayer = layer.replace(' ', "");
            }
            model.layers[newLayer] = layers[layer];
        }
        model.groups = groups;

        document.addEventListener(events.EVENT_DATE_UPDATE, () => this.updateLayers());   
        document.addEventListener(mapEvents.EVENT_LAYERS_REFRESH, () => control.update());   
    }
    
    public static render () {
        let menu = new Modal({id: 'laads-layers', style : 'lappLayerModal', color: 'white'});
        menu.content = `
            <div id="llmTabWrap" class="llmTabWrap">
            </div>
            <div id="llmTabContent"></div>
        `;

        this.createTabs("llmTabWrap");
        this.renderSearch("llm_main_search");
        this.setTab(this.id, model.currentTab[this.id]);        
    }

    public static renderSearch (divId : string) {
        let el = document.getElementById(divId) as HTMLDivElement;
        if (! el) { return;}
        el.innerHTML = `
            <span class="searchBarIcon"><i class="fa fa-search"></i></span>
            <input type="text" id="layerSearch" placeHolder="Search" class="searchBar"/>
        `;

    }

    private static updateLayers () {
        for (let i=0; i< props.layers.length; i++ ) {
            let lo = props.layers[i];
            if (lo.handler == "imagery") {
                lo.time = model.currentDate;
                if (lo.visible && lo._layer) {
                    lo._layer.getSource().refresh();
                }
            }
        }
    }

}