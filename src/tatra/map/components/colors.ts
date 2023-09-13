import { baseComponent } from "./BaseComponent";
import { Layer } from "../obj/Layer";
import { events } from "../events";
import { controls } from "./controls";
import { utils } from "../../utils";
import iro from '@jaames/iro';
import { mapUtils } from "../mapUtils";

export class Color {
	
	public r : number = 0;
	public g : number = 0;
	public b : number = 0;

	public constructor (r : number | void, g : number | void, b : number | void) {
		if (r) { this.r = r;}
		if (g) { this.g = g;}
		if (b) { this.b = b;}
	}
}

export class colors extends baseComponent {

	public static id						: string = 'colors';
	public static label						: string = 'MAP OBJECT SETTINGS';
	public static draggable 				: boolean = true;
	public static className 				: string = 'transparentWindow colorPickerWindow';
	public static showHeader 				: boolean = false;


	private static colorPicker 				: any | null = null;
	private static selectedColor 			: Color = new Color();
	private static currentLayer 			: Layer | null = null;
	private static currentLayerTitle 		: string = '';
	private static currentLayerTarget 		: number = 0;		// colors are in array - 2 sets of 3 values. (target = 1 uses the second half )


	public static onClick (evt:Event) {
		if (! this.initialized) {
			document.addEventListener(events.EVENT_LAYER_HIDDEN, (evt) => this.layerUpdate(evt));
		}
		super.onClick(evt as any);
		this.render();
	}

	public static setLayer (id : string, target : number, title : string | null = null) {
		this.currentLayer = mapUtils.getLayerById(id);
		this.currentLayerTarget = target;
		if (! this.currentLayer) { return; }
		if (title) {
			this.currentLayerTitle = title;
		} else {
			this.currentLayerTitle = this.currentLayer.title;
		}
		controls.activateControlItem('colors');
		colors.open();
	}

	public static open () {
	    super.open();
	    let _h = window.innerHeight;
	    let _w = window.innerWidth;
	    let left = _w - 480 - 300;
	    if (left < 0) { left = 0; }
	    let top = 35;
	    if (_h - 500 < 0) { top = 0; }
		else if (_h > 700) { top = 100;}
		this.position(left, top);
		this.openColorPicker();
	}

	public static createWindow () {
		super.createWindow();

		let el = document.getElementById(`lmvControls_${this.id}_Content`) as HTMLDivElement;
		if (! el) { return; }
		el.innerHTML = `
			<div id="lmvDragLbl_${this.id}" class="transparentWindowLabel">
				<b>Color: </b>
				<span id="lmvControls_${this.id}_Layer"></span>
			</div>
			<div class="colorPickerContent">
				<div class="colorPickerWrap">
					<div id="colorpicker"></div>
				</div>
				<div style="margin-bottom:3rem;font-size:1.4rem;">
					<div id="lmvControls_${this.id}_apply" class="lmvCtrlBtn lmvCtrlBtnActive lmvCtrlBtnColor" style="width:12rem;">Apply</div>
					<div id="lmvControls_${this.id}_reset" class="lmvCtrlBtn lmvCtrlBtnColor" style="color:#F0F0F0;">Restore Defaults</div>
				</div>
			</div>
		`;
		super.setDraggable(`lmvDragLbl_${this.id}`);		
		this.colorPicker = new iro.ColorPicker('#colorpicker');
		this.colorPicker.on('color:change', (color) => this.updateColor(color));

		utils.setClick(`lmvControls_${this.id}_apply`, () => this.apply(true));
		utils.setClick(`lmvControls_${this.id}_reset`, () => this.apply(false));
    }
	
	public static openColorPicker () {
		if (! this.currentLayer) { return; }
		let target = this.currentLayerTarget;
	    
		let color = this.getAdvancedColor('rgb', this.currentLayer, target);	
		let arr = this.currentLayer.color;
		if (arr) {
			this.selectedColor = new Color(arr[target*3+0], arr[target*3+1], arr[target*3+2]);
			this.colorPicker.color.rgb = {r : this.selectedColor.r, g : this.selectedColor.g, b : this.selectedColor.b};
		}
	}

	public static apply (custom : boolean) {
		if (! this.currentLayer) { return;}
		let index = this.currentLayerTarget * 3;
		if (this.selectedColor || ! custom) {
			
			let c = this.selectedColor;
			let lo = this.currentLayer;
			if (!lo.color) {
				lo.color = [0, 0, 0, 0, 0, 0];
			}					
		
			if (custom) {
				lo.color[index+0] = c.r;					
				lo.color[index+1] = c.g;
				lo.color[index+2] = c.b;
			} else {
				lo.color[index+0] = lo.defaultColor[index+0];
				lo.color[index+1] = lo.defaultColor[index+1];
				lo.color[index+2] = lo.defaultColor[index+2];         
				this.colorPicker.color.rgb = {r : lo.defaultColor[index+0], g : lo.defaultColor[index+1], b : lo.defaultColor[index+2]};
			}		
	        lo.refresh();			        
		}

		events.dispatchLayer(events.EVENT_COLOR_UPDATE, this.currentLayer.id);
		    			
		if (window.innerWidth <= 600 || window.innerHeight <= 600 || ! custom) {
			colors.close();
		}
	}
	
	public static rgbToHex (r : number, g : number, b : number) : string {
		return this.numToHex(r) + this.numToHex(g) + this.numToHex(b);    
	}
	
	private static numToHex (num : number) : string {
	    return ("0"+( num.toString(16))).slice(-2).toUpperCase();
	}

	public static render () {
	    if (! controls.items[this.id].visible) { return; }

		if (this.currentLayer) {
			(document.getElementById(`lmvControls_${this.id}_Layer`) as HTMLDivElement).innerHTML = this.currentLayerTitle;  
		} 	    
	}

	public static layerUpdate (evt : CustomEvent | Event | null) {
		if (colors.currentLayer && evt) {
			if ((evt as CustomEvent).detail.id == colors.currentLayer.id) {
				colors.currentLayer = null;
				colors.close();				
			}
		}
	}

	public static updateColor ( color : any) {
		this.selectedColor = new Color(color.rgb.r, color.rgb.g, color.rgb.b);
	}
	
	public static getColor (type : string, lo : Layer) : string {
	    return colors.getAdvancedColor(type, lo, 0);
	}		

	public static getAdvancedColor (type : string, lo : Layer, index : number, isDefault : boolean = false) : string {
	  	if (lo.color) {
	  	    let c = (isDefault) ? lo.defaultColor : lo.color;
	  	    if (c.length <= (index * 3)) {
	  	        index = 0;			  	        
	  	    }
	  	    let p = index * 3;
	  	    if (type == 'wms') return c[p+0] + '+' + c[p+1] + '+' + c[p+2];
	  	    if (type == 'rgb') return 'rgb('+c[p+0] + ',' + c[p+1] + ',' + c[p+2]+')';
	  	    
	  	} else {
	  	    if (type == 'wms') return '220+40+40';			  	    
	  	    if (type == 'rgb') return 'rgb(220,40,40)';
		}		
		return 'rgb(220,40,40)';
	}
}