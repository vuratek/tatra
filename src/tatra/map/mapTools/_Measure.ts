import { BaseTool } from "./BaseTool";
import {unByKey} from 'ol/Observable';
import Overlay from 'ol/Overlay';
import {LineString, Polygon} from 'ol/geom';
import Draw, { DrawEvent } from 'ol/interaction/Draw';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import { Feature, MapBrowserEvent } from "ol";
import { props } from "../props";
import { Coordinate } from "ol/coordinate";
import { utils as mapToolsUtils } from "./utils";
import { utils } from "../../utils";
import { events } from "../events";
import { Layer, LayerSource } from "../obj/Layer";
import OverlayPositioning from "ol/OverlayPositioning";
import { mapUtils } from "../mapUtils";

export interface IMeasure {
    [id : string] : number;
}

export class Measure extends BaseTool  {

    public continueMsg              : string = 'Click to continue drawing';
    public startMsg                 : string = 'Click to start drawing';
    public type                     : string = '';
    private sketch                  : Feature | null = null;
    private draw                    : Draw | null = null;
    private helpTooltipElement      : HTMLDivElement | null = null;
    private helpTooltip             : Overlay | null = null;
    private measureTooltipElement   : HTMLDivElement | null = null;
    private measureTooltip          : Overlay | null = null;
    
    private listener!               : (evt: Event) => void;
    private drawStartListener!      : (evt: Event) => void;   
    private drawEndListener!        : (evt: Event) => void;   
    private pointerMoveListener!    : (evt: Event) => void;   
    private tooltipCoord            : Coordinate | null = null;
    public divCounter               : number = 0;
    public measureData              : IMeasure = {};
    private currentValue            : number = 0;

    public constructor (id : string) {
        super(id);
    }

    public activate() {
        super.activate();
        let lo = mapUtils.getLayerById('measure');
        if (!lo) { 
            lo = new Layer();
            lo.type = "manualLayer";
            lo.id = "measure";
            lo.clandestine = true;
            lo.source = new LayerSource();
            lo.source.style = "measure";
            props.layers.push(lo);
        } 
        lo.visible = true;
        this.createMeasureTooltip();
        this.createHelpTooltip();
        if (props.map) {
            this.pointerMoveListener = (evt) => this.pointerMoveHandler(evt as unknown as MapBrowserEvent);
            props.map.on('pointermove', this.pointerMoveListener);
            props.map.getViewport().addEventListener('mouseout', () => this.hideTooltipElement());
            this.addInteraction();
            props.map.addInteraction(this.draw as Draw);
        }
        
    }

    public deactivate() {
        super.deactivate();
        if (props.map) {
            props.map.removeInteraction(this.draw as Draw);
        }
        this.removeInteraction();
    }

    public reset() {
        for (let i=1; i<=this.divCounter; i++) {
            let el = document.getElementById(`tooltip_${this.id}-${i}`);
            if (el && el.parentNode) {
                el.parentNode.removeChild(el);
            }
        }
        this.measureData = {};
        this.divCounter = 0;
        this.createMeasureTooltip();
    }

    public setState(visible : boolean) {
        for (let i=1; i<=this.divCounter; i++) {
            utils.setVisibility(`tooltip_${this.id}-${i}`, visible);
        }
    }

    private hideTooltipElement () {
        if (this.helpTooltipElement) {
            this.helpTooltipElement.classList.add('hidden');
        }
    }

    private pointerMoveHandler (evt : MapBrowserEvent) {
        if (evt.dragging) {
            return;
        }
        let helpMsg = this.startMsg;
    
        if (this.sketch) {
            helpMsg = this.continueMsg;
        }
    
        if (this.helpTooltipElement) {
            this.helpTooltipElement.innerHTML = helpMsg;
            this.helpTooltipElement.classList.remove('hidden');
        }
        if (this.helpTooltip) {
            this.helpTooltip.setPosition(evt.coordinate);
        }        
    }
    
    
  
    private createMeasureTooltip() {
        if (this.measureTooltipElement && this.measureTooltipElement.parentNode ) {
            this.measureTooltipElement.parentNode.removeChild(this.measureTooltipElement);
        }
        this.measureTooltipElement = document.createElement('div');
        this.measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
        this.measureTooltip = new Overlay({
            element: this.measureTooltipElement,
            offset: [0, -15],
            positioning: OverlayPositioning.BOTTOM_CENTER
        });
        if (props.map) {
            props.map.addOverlay(this.measureTooltip as Overlay);
        }
    }

    private createHelpTooltip () {
        if (this.helpTooltipElement && this.helpTooltipElement.parentNode) {
            this.helpTooltipElement.parentNode.removeChild(this.helpTooltipElement);
        }
        this.helpTooltipElement = document.createElement('div');
        this.helpTooltipElement.className = 'ol-tooltip hidden';
        this.helpTooltip = new Overlay({
            element: this.helpTooltipElement,
            offset: [15, 0],
            positioning: OverlayPositioning.CENTER_LEFT
        });
        if (props.map) {
            props.map.addOverlay(this.helpTooltip as Overlay);
        }
    }
      
    private addInteraction() {
        if (this.type == '') {
            console.log('measure type not defined.');
            return;
        }
        let lo = mapUtils.getLayerById('measure');
        if (!lo || !lo.boxSource) { return; } 
        let source = lo.boxSource;
        this.draw = new Draw({
            source: source,
            type: this.type as GeometryType,
            style: [
                new Style({
                    stroke: new Stroke({
                        color: 'rgba(220, 220, 220, 0.7)',
                        width: 4
                    })
                }),
                new Style({
                    fill: new Fill({
                        color: 'rgba(255, 255, 255, 0.4)'
                    }),
                    stroke: new Stroke({
                        color: 'rgba(20, 20, 20, 0.7)',
                        lineDash: [10, 10],
                        width: 2
                    }),
                    image: new CircleStyle({
                        radius: 5,
                        stroke: new Stroke({
                            color: 'rgba(0, 0, 0, 0.7)'
                        }),
                        fill: new Fill({
                            color: 'rgba(255, 255, 255, 0.2)'
                        })
                    })
                })
            ]                
        });
        if (this.draw) {
            this.drawStartListener = (evt) => this.onDrawStart(evt as unknown as DrawEvent);
            this.drawEndListener = (evt) => this.onDrawEnd(evt as unknown as DrawEvent);
            this.draw.on('drawstart', this.drawStartListener);
            this.draw.on('drawend', this.drawEndListener);
        }
    }

    private removeInteraction () {
        this.hideTooltipElement();
        if (props.map) {
            props.map.un('pointermove', this.pointerMoveListener);
        }
        if (this.draw) {
            unByKey(this.drawStartListener as any);
            unByKey(this.drawEndListener as any);
            
        }        
    }

    private onDrawStart (evt : DrawEvent) {
        this.sketch = evt.feature;

        /** @type {import("../src/ol/coordinate.js").Coordinate|undefined} */
        this.tooltipCoord = null;
        this.listener = this.sketch.getGeometry().on('change', (evt) => this.onGeometryChange(evt as any)) as any;   
        if (this.measureTooltipElement) {
            this.measureTooltipElement.style.display = "none";
        }    
    }

    private onDrawEnd (evt : DrawEvent) {
        let geom = evt.feature.getGeometry();
        if (this.measureTooltipElement) {
            this.measureTooltipElement.style.display = "block";
            this.measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
            this.divCounter++;
            this.measureTooltipElement.id = `tooltip_${this.id}-${this.divCounter}`;
            let id = this.id + '-' + this.divCounter.toString();
            this.measureData[id] = this.currentValue;
            let isArea = (geom instanceof Polygon) ? true : false;
            evt.feature.setId(id);
            this.measureTooltipElement.innerHTML = mapToolsUtils.formatTooltip(this.divCounter, this.currentValue, isArea);
            events.dispatch(events.EVENT_TOOL_RESULT_UPDATE); 
        }
        if (this.helpTooltipElement) {
            this.helpTooltipElement.innerHTML = this.startMsg;
        }
        (this.measureTooltip as Overlay).setOffset([0, -7]);
        this.sketch = null;
        // unset tooltip so that a new one can be created
        this.measureTooltipElement = null;
        this.createMeasureTooltip();
        unByKey(this.listener as any);

    }

    private onGeometryChange (evt : Event) {
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
    }
}
