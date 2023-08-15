import Overlay from 'ol/Overlay';
import { props } from "../props";
import { Coordinate } from 'ol/coordinate';
import { events } from '../events';
import { Layer, LayerSource } from '../obj/Layer';
import { Select } from 'ol/interaction';
import { platformModifierKeyOnly, click } from 'ol/events/condition';
import { layerStyle } from './layerStyle';
import Feature from 'ol/Feature';
import { utils } from '../../utils';
import { mapUtils } from '../mapUtils';
import { identifyUtils } from '../identifyUtils';
import { Point } from 'ol/geom';


export interface ILayers {
    [key:string]    : Layer;
}

export class identifyVectorTile {

    private static identifyTooltipElement   : HTMLDivElement | null = null;
    private static identifyTooltip          : Overlay | null = null;
    private static identifyLayers           : ILayers = {};
    private static interaction              : Select | null = null; 
    private static activeLayers             : Array <Layer>  = [];
    public static active                    : boolean = false;

    public static init () {
        this.createIdentifyTooltip();
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
            offset: [0, -12],
            positioning: 'bottom-center'
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
            if (lo.isTileIdentify) {
                let found = false;
                for (let i=0; i<identifyVectorTile.activeLayers.length; i++) {
                    if (identifyVectorTile.activeLayers[i].id == lo.id) {
                        found = true;
                    }
                }
                if (!found) {
                    identifyVectorTile.activeLayers.push(lo);
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

    private static setToolTip(text: string, top:boolean){
        let direction = (top) ? "top" : "bottom";
        (identifyVectorTile.identifyTooltipElement as HTMLDivElement).innerHTML = `
            <div class="wrapper ${direction}">
                <div class="arrow"></div>
            </div>
            <div class="identifyJSONLabel">
                ${text}
                <div class="close" id="identifyVTClose"><span><i class="fa fa-times" aria-hidden="true"></i></span></div>
            </div>
        `;
        identifyVectorTile.show();
        utils.setClick("identifyVTClose", ()=>this.hide());
    }

    public static hide() {
        if (this.identifyTooltipElement) {
            this.identifyTooltipElement.style.display = "none";
            this.active = false;
            this.close();
        }
    }

    public static close() {
        identifyVectorTile.setPosition(null);
    }

    public static identify( evt : MapBrowserEvent ) {
        let coord = evt.coordinate;
        let zoom = props.map.getView().getZoom();
        this.hide();
        for (let i=0; i<identifyVectorTile.activeLayers.length; i++) {
            let lo =  identifyVectorTile.activeLayers[i];
            if (lo._layer && lo.visible && lo.isTileIdentify) {
                if (zoom && lo.minLevel && lo.minLevel >= zoom) {
                    return false;
                }
                let features = props.map.getFeaturesAtPixel(evt.pixel);
                if (features.length != 0) {
                    for (let i=0; i<features.length; i++) {
                        let feature = features[i];
                        let p = feature.getProperties();
                        if (p[lo.id]) {
                            let style = '_' + ((lo as Layer).source as LayerSource).style + '_select';
                            let info = '_' + ((lo as Layer).source as LayerSource).style + '_info';
                            (feature as Feature).setStyle(layerStyle[style](feature, props.map.getView().getZoom()));
                            let top = (evt.pixel[1] < 170) ? true : false;
                            this.setToolTip(layerStyle[info](feature), top);
//                            this.setInfoZoomto((feature as Feature));
                            this.setPosition(coord);
                            identifyUtils.setWindow(evt, this.identifyTooltip as Overlay, 210);
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    private static setInfoZoomto (f : Feature) {
        let coord = (f.getGeometry() as Point).getCoordinates();
        utils.setClick('vectortile_info', ()=> mapUtils.zoomTo(coord[0], coord[1], 10));
    }

}