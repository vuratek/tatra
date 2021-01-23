import { baseComponent } from "./baseComponent";
import { events } from "../events";
import { map } from "..";
import { controls } from "./controls";
import { Layer } from "../obj/Layer";
import { Slider } from "../../aux/Slider";

export class opacity extends baseComponent {
	public static id		: string = 'opacity';
	public static label		: string = 'LAYER TRANSPARENCY';
	public static draggable : boolean = true;
	public static className : string = 'transparentWindow';
	public static showHeader : boolean = false;

	private static currentLayer : Layer | null = null; // lmv LayerObject 
	private static currentLayerTitle : string = '';
	private static slider	: Slider | null = null;

	public static onClick (evt:Event) {
		if (! this.initialized) {
			//			document.addEventListener(events.EVENT_LAYER_VISIBLE, opacity.layerUpdate);
			document.addEventListener(events.EVENT_LAYER_HIDDEN, (evt) => this.layerUpdate(evt));			
		}
		super.onClick(evt as CustomEvent);
		this.render();
	}

	private static layerUpdate (evt : Event | CustomEvent) {
		if (opacity.currentLayer) {
			if ((evt as CustomEvent).detail.id == opacity.currentLayer.id) {
				opacity.currentLayer = null;
				opacity.close();				
			}
		}
	}

	public static setLayer (id : string, title : string | null = null) {
		this.currentLayer = map.getLayerById(id);
		if (! this.currentLayer) { return; }
		if (title) {
			this.currentLayerTitle = title;
		} else {
			this.currentLayerTitle = this.currentLayer.title;
		}
		controls.activateControlItem('opacity');
		opacity.open();
	}

	public static createWindow () {
		super.createWindow();

		let el = document.getElementById(`lmvControls_${this.id}_Content`) as HTMLDivElement;
		if (! el) { return; }
		el.innerHTML = `
			<div id="lmvDragLbl_${this.id}" class="transparentWindowLabel">
				<b>Opacity: </b>
				<span id="lmvControls_${this.id}_Layer"></span>
				<span id="lmvControls_${this.id}_Value"></span>
			</div>
			<div style="width:100%;">
				<div id="lmvControls_${this.id}_Slider" class="opacitySlider" >
				</div>
			</div>	
		`;
		super.setDraggable(`lmvDragLbl_${this.id}`);
		this.slider = new Slider({divId: `lmvControls_${this.id}_Slider`, slide : (val) => this.updateOpacity (val), value: 100});

    }

	public static render () {
		if (! controls.items[this.id].visible) { return; }

		if (this.currentLayer) {
			(document.getElementById(`lmvControls_${this.id}_Layer`) as HTMLDivElement).innerHTML = this.currentLayerTitle;

			if (this.slider) {
				this.slider.value = this.getAlpha();
			}
			if (opacity.currentLayer) {
				this.updateOpacity(Math.round(opacity.currentLayer.alpha * 100.0));
			}
		} 
	}
	
	private static getAlpha () {
		let alpha = 100;
		if ( this.currentLayer ) {
			if (this.currentLayer.alpha) { alpha = Math.round(this.currentLayer.alpha * 100.0);}	
		}
	    return alpha;
	}
	
	private static updateOpacity (alpha : number) {
		if ( opacity.currentLayer ) {
			opacity.currentLayer.alpha = (alpha / 100.0);
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
	}
}