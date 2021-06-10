import Overlay from 'ol/Overlay';
import { props } from "../props";
import { Coordinate } from 'ol/coordinate';
import { events } from '../events';
import { Layer, LayerSource } from '../obj/Layer';
import { Select } from 'ol/interaction';
import {Layer as olLayer} from 'ol/layer';
import Source from 'ol/source/Source';
import { platformModifierKeyOnly, click } from 'ol/events/condition';
import { layerStyle } from './layerStyle';
import Feature from 'ol/Feature';
import { utils } from '../../utils';
import { mapUtils } from '../mapUtils';
import OverlayPositioning from 'ol/OverlayPositioning';
import { MapBrowserEvent } from 'ol';
import { identifyUtils } from "../identifyUtils";


export interface ILayers {
    [key:string]    : Layer;
}

export interface IData {
    [key:string]    : Array<string>;
}

export class identifyBasic {

    private static identifyTooltipElement   : HTMLDivElement | null = null;
    private static identifyTooltip          : Overlay | null = null;
    private static activeLayers             : Array <Layer>  = [];
    public static active                    : boolean = false;
    private static results                  : IData = {};

    public static init () {
        this.createIdentifyTooltip();
        for (let i=0; i<props.layers.length; i++) {
            let lo = props.layers[i];
            if (lo.isBasicIdentify && lo._layer && lo.visible) {
                identifyBasic.activeLayers.push(lo);
            }
        }
        document.addEventListener(events.EVENT_LAYER_HIDDEN, (evt) => this.removeLayer(evt as CustomEvent));
        document.addEventListener(events.EVENT_LAYER_VISIBLE, (evt) => this.addLayer(evt as CustomEvent));
    }
    
    private static createIdentifyTooltip() {
        if (this.identifyTooltipElement && this.identifyTooltipElement.parentNode ) {
            this.identifyTooltipElement.parentNode.removeChild(this.identifyTooltipElement);
        }
        this.identifyTooltipElement = document.createElement('div');
        this.identifyTooltipElement.className = 'ol-identify';
        this.identifyTooltip = new Overlay({
            element: this.identifyTooltipElement,
            offset: [0, -10],
            id: "basicIdentify",
            positioning: OverlayPositioning.BOTTOM_CENTER
        });
        if (props.map) {
            props.map.addOverlay(this.identifyTooltip as Overlay);
        }
    }
    public static setPosition(coord : Coordinate | null) {
        if (! coord) {
            (this.identifyTooltip as Overlay).setPosition(undefined);
            return;
        }
        let arr = [coord[0], coord[1]];
        if (coord[0]>coord[2]) { arr[0] = coord[2];}
        if (coord[1]<coord[3]) { arr[1] = coord[3];}
        (this.identifyTooltip as Overlay).setPosition(arr);
    }

    private static addLayer(evt:CustomEvent) {
        if (evt.detail && evt.detail.id) {
            let lo = mapUtils.getLayerById(evt.detail.id);
            if (! lo) { return; }
            if (lo.identifyUrl && lo.isBasicIdentify) {
                let found = false;
                for (let i=0; i<identifyBasic.activeLayers.length; i++) {
                    if (identifyBasic.activeLayers[i].id == lo.id) {
                        found = true;
                    }
                }
                if (!found) {
                    identifyBasic.activeLayers.push(lo);
                }
            }
        }
    }

    private static removeLayer(evt : CustomEvent) {
        if (this.activeLayers.length > 0) {
            for (let i=0; i< this.activeLayers.length; i++) {
                if (this.activeLayers[i].id == evt.detail.id) {
                    this.activeLayers.splice(i,1);
                    this.hide();
                    break;
                }
            }
        }
    }

    private static show() {
        if (this.identifyTooltipElement) {
            this.identifyTooltipElement.style.display = "block";
            this.active = true;
        }
    }

    private static setToolTip(text: string, top:boolean ){
        let direction = (top) ? "top" : "bottom";
        (identifyBasic.identifyTooltipElement as HTMLDivElement).innerHTML = `
            <div class="wrapper ${direction}">
                <div class="arrow"></div>
            </div>
            <div class="identifyBasicLabel">
                ${text}
                <div class="close" id="identifyBasicClose"><span><i class="fa fa-times" aria-hidden="true"></i></span></div>
            </div>
        `;
        identifyBasic.show();
        utils.setClick("identifyBasicClose", ()=>this.hide());
    }

    public static hide() {
        if (this.identifyTooltipElement) {
            this.identifyTooltipElement.style.display = "none";
            this.active = false;
            this.close();
        }
    }

    public static close() {
        this.results = {};
        identifyBasic.setPosition(null);
    }

    private static updateRecords(evt : MapBrowserEvent) {
        let coord = evt.coordinate;
        let text = '';
        for (let key in this.results) {
            text += this.results[key].join('<br/>');
        }
        if (text == '') {
            this.close();
            return;
        }
        let top = (evt.pixel[1] < 270) ? true : false;
        identifyBasic.setToolTip(text, top);
        identifyBasic.setPosition(coord);

        identifyUtils.setWindow(evt, identifyBasic.identifyTooltip as Overlay, 270);
        
    }

    public static identify( evt : MapBrowserEvent ) {
        let coord = evt.coordinate;
        this.close();
        for (let i=0; i<identifyBasic.activeLayers.length; i++) {
            let lo =  identifyBasic.activeLayers[i];
            if (lo._layer && lo.visible) {
                let submit = lo._identifySubmit;
                if (submit) {
                    let url = submit(lo, coord);
                    fetch(url)
                    .then(response => {
                        return response.text();
                    })
                    .then (data => {
                        let read = lo._identifyRead;
                        if (read) {
                            let text = read(lo, data);
                            this.results[lo.id] = [];
                            if (text != "") {
                                this.results[lo.id].push(text);
                            }
                            identifyBasic.updateRecords(evt);
                        }
                    })
                    .catch(error => {
                        console.error("Error processing ", url);
                    });
                }
            }
        }
    }
}