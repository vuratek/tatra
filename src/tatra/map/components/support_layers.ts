import { props } from "../props";
import { events } from "../events";
//import { events as menuEvents } from "../../laadsLayerMenu/events";
import { Layer } from "../obj/Layer";
import { baseComponent } from "./baseComponent";
import { utils } from "../../utils";
import { GroupContent } from "../../aux/GroupContent";
import flatpickr from "flatpickr";
import { mapUtils } from "../mapUtils";

export interface ISLMenus {
	[key:string]	: boolean;
}
export class support_layers extends baseComponent{
	public static id		: string = 'support_layers';
	public static label		: string = 'LAYERS';
	public static draggable : boolean = true;
	public static menus : ISLMenus = {};

	public static init() {
		super.init();	
		document.addEventListener(events.EVENT_LAYER_VISIBLE, () => this.updateLayers());
		document.addEventListener(events.EVENT_LAYER_HIDDEN, () => this.updateLayers());
		document.addEventListener(events.EVENT_LAYER_DATE_UPDATE, () => this.updateDisabled());
//		document.addEventListener(menuEvents.EVENT_LAYERS_UPDATE, () => this.updateWindow());
	}
        
	public static open () {
		super.open();
		let mh = (document.getElementById('map') as HTMLDivElement).clientHeight;
		let mw = (document.getElementById('map') as HTMLDivElement).clientWidth;
		let el = document.getElementById(`lmvControls_${this.id}`) as HTMLDivElement;
		let x = (el.style.left as String).replace('px', '');
		let y = (el.style.top as String).replace('px', '');
		if (x != '' && y !='') {
			if (mw - 350 - Number(x) < 0) { el.style.left = '10px'; }
			if (mh - 350 - Number(y) < 0) { el.style.top = '10px'; }
		}
        //this.position((mw - 300) / 2, mh - 260);
	}
	
	public static createWindow () {
		super.createWindow();
		this.updateWindow();
	}

	private static updateWindow () {
		let el = document.getElementById(`lmvControls_${this.id}_Content`) as HTMLDivElement;
		if (! el) { return; }
		el.innerHTML = '';
		let orbits = 0;
		let imagery = 0;
		let overlay = 0;
		let basemap = 0;
		for (let i=0; i< props.layers.length; i++) {
			let lo = props.layers[i];
			if ( lo.category == "layer" ) {
				if (lo.handler && lo.handler == "orbits") { orbits++; }
				if (lo.handler && lo.handler == "imagery" && ! lo.clandestine) { imagery++; }
			}
			if ( lo.category == "overlay" && ! lo.parent ) { overlay ++; }
			if ( lo.category == "basemap" && ! lo.parent ) { basemap ++; }
		}
		if (orbits > 0) {
			this.generateLayers(el, 'orbits', 'supp_lyrs', 'Orbit Tracks and Overpass Times', false);
		}
		if (overlay > 0) {
			this.generateLayers(el, 'overlay', 'supp_lyrs', 'Overlays');
		}
		if (imagery > 0) {
			this.generateLayers(el, 'imagery', 'supp_lyrs', 'Data Layers', true);
		}
		if (basemap > 0) {
			this.generateLayers(el, 'basemap', 'supp_lyrs', 'Backgrounds');
		}
    }
    
	public static generateLayers (menu : HTMLDivElement, type : string, baseId : string, label : string | null = null, opened : boolean = true) {
        this.menus[baseId] = true;
        let id = baseId +'_' + type;
        let lbl = (label) ? label : type;
        GroupContent.create({ id: id, label : lbl, parent: menu, opened : opened});
		let base = GroupContent.getContainer(id);
		let ul = document.createElement('ul');
		ul.id = id + '_content';
		ul.className = 'lmvSupportLayersContent';
		base.appendChild(ul);
		for (let i = props.layers.length-1; i>=0; i--) {
			let lo = props.layers[i];
			if (lo.parent) { continue; }
			let go = false;
			if ((type == "imagery" || type == "orbits") && lo.handler && lo.handler == type && ! lo.clandestine) { go = true;}
			if (lo.tag && lo.tag == type) { go = true; }
			if (lo.category == type) { go = true; }
			if (! go) { continue;}
			this.createLayer(lo, ul, baseId);
        }
		this.updateLayers();
		this.updateDisabled();
    }
    
	/**
	 * 
	 * @param lo - Layer Object
	 * @param ul - parent UL element
	 * @param baseId  - menu unique identifier string (ex. layer_info_help)
	 */
	public static createLayer (lo : Layer, ul : HTMLUListElement, baseId:string) {
		let li = document.createElement("li");
		li.setAttribute("id", `bb_${baseId}_${lo.id}`);
		li.setAttribute("class", "lmvControlsLayer");
		ul.appendChild(li);
//			let cl = 'bottomBarSubMenuItemLabel';	
		let long = (lo.iconLabel && lo.iconLabel.length > 5) ? 'lmvControlsIconLabelLong' : '';
		let iconLabel = (lo.iconLabel) ? `<div class="lmvControlsIconLabel ${long}">${lo.iconLabel}</div>` : '';
		let iconStyle = (lo.iconHasBorder) ? '' : ' style="border:none;"';
		let icon = `<img src="${lo.icon}" ${iconStyle}>`;
		if (lo.iconMatrix && lo.iconMatrix.length == 2) {
			let x = lo.iconMatrix[0] * 70 + 9;
			let y = lo.iconMatrix[1] * 70 + 9;
			icon = `<div class="lmControlsIconDiv" style="background: url(${lo.icon}) ${-x}px ${-y}px;"></div>`;
		}
		let legIcon = (lo.needsLegendIcon) ? 'supp_lyrs_lyr_click_legend' : '';
		let disTxt = '';
		if (lo.minDate || lo.maxDate) {
			let start = (lo.minDate) ? lo.minDate : '...';
			let end = (lo.maxDate) ? lo.maxDate : 'present';
			disTxt = `
				<div id="layerInfo_disabled_${baseId}_${lo.id}" class="lmvControlsLayerDisabled">
					AVAILABLE<br/>
					${start} - ${end}
				</div>
			`;
		}
		let str = `
			<div id="${baseId}_${lo.id}" class="supp_lyrs_lyr_click ${legIcon}">
				${icon}
				${iconLabel}
				<div class="bottomBarSubMenuItemLabel">
					${lo.title}
				</div>
			</div>
			<div id="layerInfo_${baseId}_${lo.id}" class="lmvControlsLayerInfo"></div>
			${disTxt}
		`;
		if (lo.needsLegendIcon) { 
			str +=`<div id="layerLegend_${baseId}_${lo.id}" class="lmvControlsLayerLegendIcon"></div>`;
		}
		if (lo.hasLegend) {
			str += `<div id="legend_${lo.id}" class="lmvControlsLayerLegend"></div>`;
		}
/*			for (let j=0; j<props.layers.length; j++) {
			let lo2 = props.layers[j];
			if (lo2.parent == lo.id) {
				cl = 'bottomBarSubMenuItemLabel2';
				str2 += '<div class="bottomBarSubMenuItemLabelLayer" id="bbLabel_'+lo2.id+'">';
				str2 += lmv.components.controls.setLabelField(lo2);
				str2 += '</div>';
			}
		}*/
		li.innerHTML = str;
		utils.setClick(`${baseId}_${lo.id}`, () => this.selectLayer(lo.id));
		this.setLayerInfoField(`layerInfo_${baseId}_${lo.id}`, lo);
		if (lo.needsLegendIcon) { 
			this.setLayerLegendField(`layerLegend_${baseId}_${lo.id}`, lo);
		}
	}
	
	private static selectLayer (id : string) {
		let lo = mapUtils.getLayerById(id);
		if (lo) {
			if (lo.category == 'overlay') {
				mapUtils.setOverlay(id);
			} else if (lo.category == 'basemap') {
				mapUtils.setBasemap(id);
			} else {
				if (lo.handler && (lo.handler == "orbits" || lo.handler == "imagery" || lo.tag != "")) {
					lo.visible = ! lo.visible;
					events.dispatchLayer(events.EVENT_UI_LAYER_UPDATE, lo.id);
				}
			}
			//support_layers.updateLayers();
			//utils.analyticsTrack(lo.category + '-' + id);
		}
		this.updateLayers();
	}

	public static setLayerInfoField (parentId: string, lo : Layer) {
		let el = document.getElementById(parentId) as HTMLDivElement;
		if (! el) { return; }
		el.innerHTML =`<i class="fa fa-info-circle" aria-hidden="true"></i>`;
		let info = (lo.info) ? lo.info : lo.id;
		utils.setClick(parentId, () => events.infoClicked(info));
	}

	public static setLayerLegendField (parentId: string, lo : Layer) {
		let el = document.getElementById(parentId) as HTMLDivElement;
		if (! el) { return; }
		el.innerHTML =`<i class="fa fa-th-list" aria-hidden="true"></i>`;
		let info = (lo.info) ? lo.info : lo.id;
		utils.setClick(parentId, () => events.legendClicked(info));
	}

	public static updateLayers () {
		for (let menu in this.menus) {
            for (let i=0; i<props.layers.length; i++) {
                let lo = props.layers[i];
                let el = document.getElementById(`bb_${menu}_${lo.id}`) as HTMLDivElement;
				if (! el) { continue;}
				let el2 = null;
				if (lo.hasLegend) {
					el2 = document.getElementById(`legend_${lo.id}`) as HTMLDivElement;
				}
                if (lo.visible) {
					utils.addClass(el.id, 'lmvControlsLayerSelected');
					if (el2) {
						el2.style.display = "block";
					}
                } else {
					utils.removeClass(el.id, 'lmvControlsLayerSelected');
					if (el2) {
						el2.style.display = "none";
					}
				}
            }
        }
	}
	public static updateDisabled() {
		let update = false;
		for (let menu in this.menus) {
            for (let i=0; i<props.layers.length; i++) {
				let lo = props.layers[i];
				if (lo.minDate || lo.maxDate) {
					if ((lo.minDate && lo.minDate > flatpickr.formatDate(lo.time, 'Y-m-d')) || 
						(lo.maxDate && lo.maxDate < flatpickr.formatDate(lo.time, 'Y-m-d'))) {
						utils.show(`layerInfo_disabled_${menu}_${lo.id}`);
						if (props.currentBasemap == lo.id) {
							update = true;
						}
						if (lo.category != "basemap") {
							lo.visible = false;
						}
					} else {
						utils.hide(`layerInfo_disabled_${menu}_${lo.id}`);
					}
				}	
			}
		}
		if (update) {
			mapUtils.setBasemap('earth');
		}
	}
}