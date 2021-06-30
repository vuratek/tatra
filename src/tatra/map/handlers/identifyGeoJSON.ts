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
import { identifyUtils } from '../identifyUtils';
import { Point } from 'ol/geom';


export interface ILayers {
    [key:string]    : Layer;
}

export class identifyGeoJSON {

    private static identifyTooltipElement   : HTMLDivElement | null = null;
    private static identifyTooltip          : Overlay | null = null;
    private static identifyLayers           : ILayers = {};
    private static interaction              : Select | null = null; 
    private static activeLayer              : Layer | null = null;
//    private static interactionLayers        : Array <olLayer <Source>> = [];
    public static active                    : boolean = false;

    public static init () {
        this.createIdentifyTooltip();
        document.addEventListener(events.EVENT_GEOJSON_LOADED, (evt) => this.updateLayers(evt as CustomEvent));
        document.addEventListener(events.EVENT_LAYER_HIDDEN, (evt) => this.hideLayer(evt as CustomEvent));
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
            positioning: OverlayPositioning.BOTTOM_CENTER
        });
        if (props.map) {
            props.map.addOverlay(this.identifyTooltip as Overlay);
        }
    }
    public static setPosition(coord : Coordinate) {
        let arr = [coord[0], coord[1]];
        if (coord[0]>coord[2]) { arr[0] = coord[2];}
        if (coord[1]<coord[3]) { arr[1] = coord[3];}
        (this.identifyTooltip as Overlay).setPosition(arr);
    }

    private static hideLayer(evt : CustomEvent) {
        if (this.activeLayer && this.activeLayer.id == evt.detail.id) {
            this.activeLayer = null;
            this.hide();
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
        (identifyGeoJSON.identifyTooltipElement as HTMLDivElement).innerHTML = `
            <div class="wrapper ${direction}">
                <div class="arrow"></div>
            </div>
            <div class="identifyJSONLabel">
                ${text}
                <div class="close" id="identifyJSONClose"><span><i class="fa fa-times" aria-hidden="true"></i></span></div>
            </div>
        `;
        identifyGeoJSON.show();
        utils.setClick("identifyJSONClose", ()=>this.hide());
    }

    public static hide() {
        if (this.identifyTooltipElement) {
            this.identifyTooltipElement.style.display = "none";
            this.active = false;
        }
        if (this.interaction) {
            let selectedFeatures = (this.interaction as Select).getFeatures();
            selectedFeatures.forEach(function(feature : Feature) {   
                (identifyGeoJSON.interaction as Select).getFeatures().remove(feature);
            });
        }
    }

    private static updateLayers(evt:CustomEvent) {
        let update = false;
        for (let i=0; i<props.layers.length; i++) {
            let lo = props.layers[i];
            if (lo.isJSONIdentify) {
                if (lo._layer) {
                    if (!this.identifyLayers[lo.id] && lo.id == evt.detail.id) {
                        this.identifyLayers[lo.id] = lo;
                        update = true;
                    }
                } else {
                    if (this.identifyLayers[lo.id]) {
                        delete this.identifyLayers[lo.id];
                        update = true;
                    } 
                }
            }
        }
        if (!update) {
            return;
        }
        if (this.interaction) {
            props.map.removeInteraction(this.interaction);
        }
        let arr = [];
        for (let lyr in this.identifyLayers) {
            let lo = this.identifyLayers[lyr];
            if (lo._layer) {
                arr.push(lo._layer);
            }            
        }
        this.interaction = new Select({
            condition: click,
            toggleCondition: platformModifierKeyOnly,
            layers: arr
        });
        this.interaction.on("select", function(e) {
            if (e.deselected.length > 0) {
                identifyGeoJSON.hide();
                identifyGeoJSON.activeLayer = null;
            }
            let selectedFeatures = e.target.getFeatures();
            selectedFeatures.forEach(function(feature : Feature) {   
//                console.log(feature);  
                let _arr = (feature.getId() as string).split('--');
                let id = _arr[0];
                let lo = mapUtils.getLayerById(id);
                if (!lo || !lo.source) {
                    return;
                }
                identifyGeoJSON.activeLayer = lo;
                let style = '_' + ((lo as Layer).source as LayerSource).style + '_select';
                let info = '_' + ((lo as Layer).source as LayerSource).style + '_info';
//                let geom = feature.getGeometry(); 
//                let coord = geom.getExtent();
                let coord = e.mapBrowserEvent.coordinate;
                feature.setStyle(layerStyle[style](feature, props.map.getView().getZoom()));
                let top = (e.mapBrowserEvent.pixel[1] < 170) ? true : false;
                identifyGeoJSON.setToolTip(layerStyle[info](feature), top);
                identifyGeoJSON.setInfoZoomto(feature);
                identifyGeoJSON.setPosition(coord);
                identifyUtils.setWindow(e.mapBrowserEvent, identifyGeoJSON.identifyTooltip as Overlay, 210);
//                console.log(e.mapBrowserEvent.pixel);
            });
        });
        props.map.addInteraction(this.interaction);
    }

    private static setInfoZoomto (f : Feature) {
        let coord = (f.getGeometry() as Point).getCoordinates();
        utils.setClick('geojson_info', ()=> mapUtils.zoomTo(coord[0], coord[1], 10));
    }
    /* junk, for reference

    private static onGeometryChange (evt : Event) {
        let geom = evt.target;
        let output = '';
        if (geom instanceof Polygon) {
            output = mapToolsUtils.formatValue(this.currentValue, true);
            this.currentValue = mapToolsUtils.getArea(geom);
            this.tooltipCoord = geom.getInteriorPoint().getCoordinates();
        } else if (geom instanceof LineString) {
            this.currentValue = mapToolsUtils.getLength(geom); 
            output = mapToolsUtils.formatValue(this.currentValue, false);
            this.tooltipCoord = geom.getLastCoordinate();
        }
        if (this.helpTooltipElement) {
            this.helpTooltipElement.innerHTML = output;
        }
        (this.measureTooltip as Overlay).setPosition(this.tooltipCoord as Coordinate);
    }*/

}