import { baseComponent } from "./BaseComponent";
import { events } from "../events";
import { controls } from "./controls";
import { Layer } from "../obj/Layer";
import { Slider } from "../../aux/Slider";
import { props } from "../props";
import { noUiSlider } from "../../aux/nouislider";
import { mapUtils } from "../mapUtils";

export class opacity extends baseComponent {
	public static id		: string = 'opacity';
	public static label		: string = 'LAYER TRANSPARENCY';
	public static draggable : boolean = true;
	public static className : string = 'transparentWindow';
	public static showHeader : boolean = false;

	public static currentLayers : Array<Layer> | null = null; // lmv LayerObject 
	private static currentLayerTitle : string = '';
	private static slider	: Slider | null = null;

	public static onClick (evt:Event) {
		if (! this.initialized) {
			//			document.addEventListener(events.EVENT_LAYER_VISIBLE, opacity.layerUpdate);
			document.addEventListener(events.EVENT_LAYER_HIDDEN, (evt) => this.layerUpdate(evt));
			document.addEventListener(events.EVENT_COLOR_PALETTE_LOADED, () => this.renderLayerMenu());
		}
		super.onClick(evt as CustomEvent);
		this.render();
	}

	private static layerUpdate (evt : Event | CustomEvent) {
		if (this.currentLayers) {
//			let lid = (evt as CustomEvent).detail.id;
			let vis = 0;
			for (let i=0; i < this.currentLayers.length; i++) {
				if (this.currentLayers[i].visible) {
					vis ++;
				} 
			}
			if (vis == 0)
			this.currentLayers = null;
			this.close();
		}
	}

	public static close() {
		super.close();
		events.dispatch(events.EVENT_LAYER_RANGE_UPDATE);
	}

	private static saveId(id:string) {
		let lo = mapUtils.getLayerById(id);
		if (this.currentLayers && lo) {
			this.currentLayers.push(lo);
		}
	}

	/**
	 * 
	 * @param ids - single layer id or Array of layer ids 
	 * @param title - title for the opacity window to show
	 */

	public static setLayer (ids : string | Array<string>, title : string | null = null) {		
		this.currentLayers = [];
		if (! Array.isArray(ids)) {
			this.saveId(ids);
		} else {
			for (let i=0; i<ids.length; i++) {
				this.saveId(ids[i]);
			}
		}
		// if no layer match for id/s return
		if (this.currentLayers.length == 0) {
			this.currentLayers = null;
			return;
		}
		if (title) {
			this.currentLayerTitle = title;
		} else {
			this.currentLayerTitle = this.currentLayers[0].title;
		}
		controls.activateControlItem('opacity');
		opacity.open();
		this.renderLayerMenu();
	}

	public static createWindow () {
		super.createWindow();

		let el = document.getElementById(`lmvControls_${this.id}_Content`) as HTMLDivElement;
		if (! el) { return; }
		el.innerHTML = `
			<div id="lmvDragLbl_${this.id}" class="transparentWindowLabel">
				<span id="lmvControls_${this.id}_Layer" class="opacityTitleLbl"></span>
			</div>
			<div style="width:100%;">
				<div id="opacityContainerWidthBG">
					<div class="opacityLabel">
						Opacity
						<span id="lmvControls_${this.id}_Value"></span>
					</div>
					<div id="lmvControls_${this.id}_Slider" class="opacitySlider" >
					</div>
					<div id="lmvControls_${this.id}_SliderMenu">
					</div>
				</div>
			</div>	
		`;
		super.setDraggable(`lmvDragLbl_${this.id}`);
		this.slider = new Slider({divId: `lmvControls_${this.id}_Slider`, slide : (val) => this.updateOpacity (val), value: 100});
    }

	public static render () {
		if (! controls.items[this.id].visible) { return; }

		if (this.currentLayers) {
			(document.getElementById(`lmvControls_${this.id}_Layer`) as HTMLDivElement).innerHTML = this.currentLayerTitle;

			if (this.slider) {
				this.slider.value = this.getAlpha();
			}
			if (this.currentLayers) {
				this.updateOpacity(Math.round(this.currentLayers[0].alpha * 100.0));
			}
		} 
	}
	
	private static getAlpha () {
		let alpha = 100;
		if ( this.currentLayers) {
			if (this.currentLayers[0].alpha) { 
				alpha = Math.round(this.currentLayers[0].alpha * 100.0);
			}	
		}
	    return alpha;
	}
	
	private static updateOpacity (alpha : number) {
		if ( this.currentLayers) {
			for (let i=0; i<this.currentLayers.length; i++) {
				this.currentLayers[i].alpha = (alpha / 100.0);
			}
			(document.getElementById(`lmvControls_${this.id}_Value`) as HTMLSpanElement).innerHTML = alpha + '%';
		}
	}

	public static open() {
		super.open();
		let mh = (document.getElementById('map') as HTMLDivElement).clientHeight;
		let mw = (document.getElementById('map') as HTMLDivElement).clientWidth;
		let posy = 0;
		let posx = 0;
		if (mh > 500) {
			posy = 100;
		}
		if (mw > 400 && mw < 800) {
			posx = 50;
		} else if (mw > 800) {
			posx = mw - 750;
		}		
		this.position(posx, posy);
		events.dispatch(events.EVENT_LAYER_RANGE_UPDATE);
	}

	private static renderLayerMenu () {
		let el = document.getElementById(`lmvControls_${this.id}_SliderMenu`) as HTMLDivElement;
		if (! this.currentLayers) {
			return;
		}
		let lo = this.currentLayers[0] as Layer;
		if (!lo || !lo.colorPaletteId || !lo.variableRange || !lo.variableRange["coloring"]) { 
			el.innerHTML = '';
			return; 
		}
		
		let cp = props.colorPalettes[lo.colorPaletteId as string];
		let units = (cp.units) ? `${cp.units}` : '';
		let ff_hide = '';
		let ff_error = '';
/*		if (navigator.userAgent.indexOf("Firefox") >=0) {
			ff_error = `
				<div style="color: white;text-align: center;margin: .5rem auto;">
					Threshold feature currently not available in Firefox
				</div>
			`;
			ff_hide = `style="display:none;"`;
		}*/
		el.innerHTML = `
			<div class="opacityLabel">
				Threshold				
			</div>

			<div id="lmvControls_${this.id}_SliderMenuLegend" class="opacityMenuLegend">
				<div class="opacityMenuVariableLegendBar">
					<div id="lmvControls_${this.id}_SliderMenuLegendBar" style="width:100%;">
					</div>
				</div>
				<div id="lmvControls_${this.id}_SliderMenuLegendLbl" class="opacityMenuVariableLegendLbl">
					<div class="opacityValueRangeLbl opacityValueRangeLblLeft" id="lmvControls_${this.id}_SliderMenuRange1">${cp.minLabel} ${units}</div>
					<div class="opacityValueRangeLbl opacityValueRangeLblRight" id="lmvControls_${this.id}_SliderMenuRange2">${cp.maxLabel} ${units}</div>					
				</div>
			</div>
			<div class="opacitySliderWrap" ${ff_hide}>
				<div class="opacityValueRangeSlider" id="lmvControls_${this.id}_SliderMenuRange"></div>
			</div>
			${ff_error}
		`;
		let vals = [1, cp.values.length];
		if (lo.variableRange && lo.variableRange["coloring"]) { vals = lo.variableRange["coloring"];}
//		if (navigator.userAgent.indexOf("Firefox") == -1) {
			let slider = document.getElementById(`lmvControls_${this.id}_SliderMenuRange`) as any;
			noUiSlider.create(slider, {
				start: [vals[0], vals[1]],
				connect: true,
				range: {
					'min': 1,
					'max': cp.values.length
				}
			});
			console.log(vals[0], vals[1]);
			slider.noUiSlider.on("slide", ( vals : Array <number> ) => this.formatVROutput(lo.id, vals, false));
			slider.noUiSlider.on("set", ( vals : Array <number> ) => this.formatVROutput(lo.id, vals, true));
//		}
		this.formatVROutput(lo.id, vals, false);
		
	}

	private static formatVROutput (id : string, values : Array <number> | undefined, update : boolean) {
		if (values === undefined) { return; }
		let cEl = document.getElementById(`lmvControls_${this.id}_SliderMenuLegendBar`) as HTMLDivElement;
		let width = cEl.offsetWidth;
		cEl.innerHTML = `<canvas id="lmvControls_${this.id}_SliderMenuLegendCanvas" width="${width}" height="25"></canvas>`;
		let lo = mapUtils.getLayerById(id);
		if (! lo || ! lo.colorPaletteId) { return; }
		let cp = props.colorPalettes[lo.colorPaletteId as string];
	 	let val1 = Math.round(values[0]);
		let val2 = Math.round(values[1]);
		if (val2 >= cp.values.length) { val2 = cp.values.length; }
		mapUtils.generateColorPaletteLegend(`lmvControls_${this.id}_SliderMenuLegendCanvas`, cp, width, 25, val1, val2);
		if (update) {
		    if (!lo.variableRange) { lo.variableRange = {}; }
			lo.variableRange["coloring"] = [val1, val2];
			mapUtils.prepareColors(lo);
			lo.refresh(); 				    
			events.dispatch(events.EVENT_LAYER_RANGE_UPDATE);
		}
	 	let leg1 = (val1 == 1) ? cp.minLabel : cp.values[val1-1].min.toString();		
		let leg2 = (val2 == cp.values.length) ? cp.maxLabel : cp.values[val2-1].max.toString();	
		let units = '';
		if (cp.units) {
			leg1 += ' ' + cp.units;
			leg2 += ' ' + cp.units;
		}

		 	
		(document.getElementById(`lmvControls_${this.id}_SliderMenuRange1`) as HTMLDivElement).innerHTML=leg1;
		(document.getElementById(`lmvControls_${this.id}_SliderMenuRange2`) as HTMLDivElement).innerHTML=leg2;
//		menuCommon.updateHash();
	}
}
