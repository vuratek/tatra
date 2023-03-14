import { Module } from "./Module";
import { GroupContent } from "../../../aux/GroupContent";
import { props } from "../../props";
import { Layer } from "../../obj/Layer";
import { utils } from "../../../utils";
import { mapUtils } from "../../mapUtils";
import { events } from "../../events";
import { opacity } from "../../components/opacity";
import { IMenuModuleLayers } from "../../defs/ConfigDef";

export enum MenuLayerGroup {
	TYPE_BASEMAPS	= "basemap",
	TYPE_BASIC		= "basic",
	TYPE_CUSTOM		= "custom"
}

export class LayerGroup extends Module {

	// TYPE_CUSTOM will use props.layer_refs to determine which layers to show
	public type	: MenuLayerGroup = MenuLayerGroup.TYPE_CUSTOM; 

    public render(par : HTMLDivElement) {
        super.render(par);
        let base = GroupContent.getContainer(this.props.id);
		let ul = document.createElement('ul');
        ul.id = this.props.id + '_content';
		ul.className = 'lmvSupportLayersContent';
        base.appendChild(ul);
        let baseId = this.props.id;
        if (this.props.hasMultiLayer) {
            this.appendDynamicLayerSelector(ul); 
        }
//		if (type == 'alerts') { this.appendActiveAlertsInfo(ul); }
		for (let i = props.layers.length-1; i>=0; i--) {
			let lo = props.layers[i];
			if (lo.parent) { continue; }
//			if (! showAll && ! lo.isBasicLayer) { continue; }
			let go = false;
			if (! lo.clandestine && lo.tag == this.props.tag && this.props.layer_refs) {                 
                go = this.checkLayerRef(lo, this.props.layer_refs, this.props.tag);
			}
			else if (this.type == MenuLayerGroup.TYPE_CUSTOM ) {
				if (! this.props.layer_refs) {
					console.log("Layers are not defined for the custom module.");
					go = false;
				} else {
					go = this.checkLayerRef(lo, this.props.layer_refs, this.props.tag);
				}
            }
			if (! go) { continue;}
			this.createLayer(lo, ul, baseId);
		}
        this.updateLayers();
        if (this.props.hasMultiLayer) {
            this.setMultiDynamicLayer();
        }
        document.addEventListener(events.EVENT_LAYER_VISIBLE, () => this.updateLayers());
        document.addEventListener(events.EVENT_LAYER_HIDDEN, () => this.updateLayers());
        document.addEventListener(events.EVENT_COLOR_PALETTE_LOADED, () => this.updateLayers());
        document.addEventListener(events.EVENT_LAYER_RANGE_UPDATE, () => this.updateLayers());
        document.addEventListener(events.EVENT_GROUP_CONTENT_CHANGE, () => this.updateLayers());
        document.addEventListener(events.EVENT_LAYER_DATE_UPDATE, () => this.updateDisabled());
        document.addEventListener(events.EVENT_MAP_EXTENT_CHANGE, () => this.updateDisabled());
	}
	
	private checkLayerRef(lo:Layer, layers:Array<IMenuModuleLayers> | null, tag : string | null) : boolean {
		// check for module.layer_refs, if not found, check for tag
		if (! layers) { 
			if (lo.tag == tag) {
				return true; 
			} else {
				return false;
			}
		}
		for (let i=0; i<layers.length; i++) {
			if (lo.id == layers[i].id) { 
				if(lo.tag == tag) {
					return true; 
				}
				break;
			}
		}
		return false;
	}

    /**
	 * 
	 * @param lo - Layer Object
	 * @param ul - parent UL element
	 * @param baseId  - menu unique identifier string (ex. layer_info_help)
	 */
	public createLayer (lo : Layer, ul : HTMLUListElement, baseId:string) {
		let li = document.createElement("li");
		li.setAttribute("id", `bb_${baseId}_${lo.id}`);
		li.setAttribute("class", "lmvControlsLayer");
		ul.appendChild(li);
//			let cl = 'bottomBarSubMenuItemLabel';	
		let long = (lo.iconLabel && lo.iconLabel.length > 5) ? 'lmvControlsIconLabelLong' : '';
		let iconLabel = (lo.iconLabel) ? `<div class="lmvControlsIconLabel ${long}">${lo.iconLabel}</div>` : '';
		let iconStyle = (lo.iconHasBorder) ? '' : ' style="border:none;"';
		let icon = '';
		if (lo.icon && lo.icon.indexOf('color:') == 0) {
			let color = lo.icon.replace('color:', '');
			icon =`<div class="lmControlsIconDiv" style="background: ${color}"></div>`;
		} else if (lo.iconMatrix && lo.iconMatrix.length == 2) {
			let x = lo.iconMatrix[0] * 70 + 9;
			let y = lo.iconMatrix[1] * 70 + 9;
			icon = `<div class="lmControlsIconDiv" style="background: url(${lo.icon}) ${-x}px ${-y}px;"></div>`;
		} else {
			icon = `<img src="${lo.icon}" ${iconStyle}>`;
		}
		let legIcon = '';
		if (lo.category != "basemap") {
			if (lo.needsLegendIcon) {
				legIcon = 'supp_lyrs_lyr_click_legend';
			} else {
				legIcon = 'supp_lyrs_lyr_click_extra';
			}
		}
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
		let lvlTxt = '';
		if (lo.minLevel != -1 || lo.maxLevel != -1) {
			lvlTxt = `
				<div id="layerInfo_level_disabled_${baseId}_${lo.id}" class="lmvControlsLayerLevelDisabled">
					Current zoom level not supported
				</div>
			`;
		}
		let expandMenu = '';
		if (lo.paletteUrl) {
			expandMenu = `<div id="layerMenu_${baseId}_${lo.id}" class="lmvLayerMenu"></div>`;
		}
		let extraBtn = '';
		if (lo.category != "basemap") {
			extraBtn = `
				<div id="layerExtra_${baseId}_${lo.id}" class="lmvControlsLayerInfoBtns lmvControlsLayerMenu">					
				</div>`;
		}

		let tileBtn = '';
		if (lo.tileErrorUrl) {
			tileBtn = `
				<div class="layerMissingTile">
					<label class="llCheckbox">
						<input type="checkbox" id="layerShowMissingTile_${baseId}_${lo.id}">
						<span class="checkmark"></span>
					</label>
					<div>
						Show unavailable tiles
					</div>
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
			${extraBtn}
			${tileBtn}
			<div id="layerInfo_${baseId}_${lo.id}" class="lmvControlsLayerInfoBtns lmvControlsLayerInfo"></div>
			${disTxt}
			${lvlTxt}
			${expandMenu}
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
		utils.setClick(`layerExtra_${baseId}_${lo.id}`, () => this.showExtraOption(lo.id));
		utils.setChange(`layerShowMissingTile_${baseId}_${lo.id}`, ()=> this.refreshMissingTile(baseId, lo.id));
		let el = document.getElementById(`layerShowMissingTile_${baseId}_${lo.id}`) as HTMLInputElement;
		if (el) {
			el.checked = lo.showTileError;
		}

		if (lo.needsLegendIcon) { 
			this.setLayerLegendField(`layerLegend_${baseId}_${lo.id}`, lo);
		}
    }
    private refreshMissingTile(baseId : string, id: string) {
		let lo = mapUtils.getLayerById(id);
		if (!lo) { return; }
		let el = document.getElementById(`layerShowMissingTile_${baseId}_${lo.id}`) as HTMLInputElement;
		if (!el) { return; }
		lo.showTileError = el.checked;
		lo.refresh();
	}

	private showExtraOption(id : string) {
		let lo = mapUtils.getLayerById(id);
		if (!lo) { return; }
		if (lo.visible && opacity.isOpened && opacity.currentLayer && opacity.currentLayer.id == lo.id) {
			opacity.close();
			return;
		}
		if (! lo.visible) { lo.visible=true;}
		opacity.setLayer(lo.id, lo.title);
    }
    
    private selectLayer (id : string) {
		let lo = mapUtils.getLayerById(id);
		if (lo) {
			if (lo.category == 'overlay') {
				mapUtils.setOverlay(id);
			} else if (lo.category == 'basemap') {
				if (lo.visible && lo.id != props.defaultBasemap) {
					lo.visible = false;
					mapUtils.setBasemap(props.defaultBasemap);	
				} else {
					mapUtils.setBasemap(id);
				}
			} else if (lo.category == 'dynamic') {
				if (lo.visible || props.allowMultipleDynamicLayers) {
					lo.visible = ! lo.visible;
					events.dispatchLayer(events.EVENT_UI_LAYER_UPDATE, lo.id);
				} else {
					// current layer not visible. Disable other dynamic layer
					for (let i=0; i<props.layers.length; i++) {
						let lo2 = props.layers[i];
						if (lo2.category == 'dynamic' && lo2.visible) {
							lo2.visible = false;
						}
					}
					lo.visible = true;
					events.dispatchLayer(events.EVENT_UI_LAYER_UPDATE, lo.id);
				}
			}
			else {
				if (lo.handler && (lo.handler == "orbits" || lo.handler == "imagery" || lo.tag != "")) {
					lo.visible = ! lo.visible;
					events.dispatchLayer(events.EVENT_UI_LAYER_UPDATE, lo.id);
				}
			}
            //utils.analyticsTrack(lo.category + '-' + id);
            this.updateLayers();
		}
    }
    
    public setLayerInfoField (parentId: string, lo : Layer) {
		let el = document.getElementById(parentId) as HTMLDivElement;
		if (! el) { return; }
		el.innerHTML =`<i class="fa fa-info-circle" aria-hidden="true"></i>`;
		let info = (lo.info) ? lo.info : lo.id;
		utils.setClick(parentId, () => events.infoClicked(info));
	}

	public setLayerLegendField (parentId: string, lo : Layer) {
		let el = document.getElementById(parentId) as HTMLDivElement;
		if (! el) { return; }
		el.innerHTML =`<i class="fa fa-th-list" aria-hidden="true"></i>`;
		let info = (lo.info) ? lo.info : lo.id;
		utils.setClick(parentId, () => events.legendClicked(info));
    }
    
    public updateLayers () {
		for (let i=0; i<props.layers.length; i++) {
			let lo = props.layers[i];
			let el = document.getElementById(`bb_${this.props.id}_${lo.id}`) as HTMLDivElement;
			if (! el) { continue;}
			let el2 = null;
			if (lo.hasLegend) {
				el2 = document.getElementById(`legend_${lo.id}`) as HTMLDivElement;
			}
			if (lo.listItemHandler) {
				lo.listItemHandler(lo.id);
			}
			this.renderLayerLegend(this.props.id, lo);
			this.setExtraBtn(this.props.id, lo);
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
        this.updateDisabled();
	}

	private renderLayerLegend (menu : string, lo : Layer) {
		let el = document.getElementById(`layerMenu_${menu}_${lo.id}`);
		if (!el || !lo.colorPaletteId) {
			return;
		}
		if (! lo.visible) {
			utils.hide(`layerMenu_${menu}_${lo.id}`);
			return;
		}
		let cp = props.colorPalettes[lo.colorPaletteId as string];
		utils.show(`layerMenu_${menu}_${lo.id}`);
		let val1 = (lo.variableRange && lo.variableRange["coloring"]) ? lo.variableRange["coloring"][0] : cp.values[0].ref;
		let val2 = (lo.variableRange && lo.variableRange["coloring"]) ? lo.variableRange["coloring"][1] : cp.values[cp.values.length-1].ref;

		let leg1 = (val1 == 1) ? cp.minLabel : cp.values[val1-1].min.toString();		
		let leg2 = (val2 == cp.values.length) ? cp.maxLabel : cp.values[val2-1].max.toString();	
		let units = (cp.units) ? `${cp.units}` : '';
		 	
		el.innerHTML = `
			<div id="lmvControls_${menu}_${lo.id}_SliderClickable" style="display:-webkit-inline-box;" class="opacityMenuLegend">
					<div class="opacityMenuVariableLegendBar">
						<div id="lmvControls_${menu}_${lo.id}_SliderMenuLegendBar" style="width:100%;">
					</div>
				</div>
				<div class="opacityMenuVariableLegendLbl">
					<span style="float:left;">${leg1} ${units}</span><span style="float:right;margin-right:30px">${leg2} ${units}</span>
				</div>
			</div>
		`;
		let cEl = document.getElementById(`lmvControls_${menu}_${lo.id}_SliderMenuLegendBar`) as HTMLDivElement;
		let width = cEl.offsetWidth;
		cEl.innerHTML = `<canvas id="lmvControls_${menu}_${lo.id}_SliderMenuLegendCanvas" width="${width}" height="20"></canvas>`;

		mapUtils.generateColorPaletteLegend(`lmvControls_${menu}_${lo.id}_SliderMenuLegendCanvas`, cp, width, 20, val1, val2);
		utils.setClick(`lmvControls_${menu}_${lo.id}_SliderClickable`, ()=>this.showExtraOption(lo.id));

	}

	private setExtraBtn (menu : string, lo : Layer) {
		let el = document.getElementById(`layerExtra_${menu}_${lo.id}`) as HTMLDivElement;
		if (!el) { return; }
		let type = 'plus';
		if (opacity.isOpened && opacity.currentLayer && opacity.currentLayer.id == lo.id) {
			type = 'minus';
		}
		el.innerHTML = `<i class="fa fa-${type}-circle" aria-hidden="true"></i>`;
	}

	public updateDisabled() {
		let update = false;
		let level = props.map.getView().getZoom();
/*		for (let menu in this.menus) {
            for (let i=0; i<props.layers.length; i++) {
				let lo = props.layers[i];
				let isDisabled = false;
				if (lo.minDate || lo.maxDate) {
					if ((lo.minDate && lo.minDate > flatpickr.formatDate(lo.time, 'Y-m-d')) || 
						(lo.maxDate && lo.maxDate < flatpickr.formatDate(lo.time, 'Y-m-d'))) {
						utils.show(`layerInfo_disabled_${menu}_${lo.id}`);
						isDisabled = true;
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
				if (!isDisabled && (level < lo.minLevel || (lo.maxLevel != -1 && level > lo.maxLevel))) {
					utils.show(`layerInfo_level_disabled_${menu}_${lo.id}`);
				} else {
					utils.hide(`layerInfo_level_disabled_${menu}_${lo.id}`);
				}
			}
		}*/
		if (update) {
			mapUtils.setBasemap('earth');
		}
	}
    private appendDynamicLayerSelector(ul : HTMLUListElement) {
		let li = document.createElement("li");
		li.setAttribute("id", `bb_layer_multi_${this.props.id}`);
		li.setAttribute("class", "lmvControlsLayer lmvControlsMultiLayer");
		ul.appendChild(li);
		li.innerHTML = `
			<label class="llCheckbox">
				<input type="checkbox" id="ll_dynamic_multi_${this.props.id}">
				<span class="checkmark"></span>
			</label>
			<div>
				Allow multi layer selection
			</div>
		`;
        utils.setChange(`ll_dynamic_multi_${this.props.id}`, ()=> this.updateMultiDynamicLayer());
        props.allowMultipleDynamicLayersSelection = true;
    }
    private updateMultiDynamicLayer() {
		let el = document.getElementById(`ll_dynamic_multi_${this.props.id}`) as HTMLInputElement;
		if (el) {
			props.allowMultipleDynamicLayers = el.checked;
			mapUtils.resetDynamicLayers();
		}
    }

    private setMultiDynamicLayer() {
		let el = document.getElementById(`ll_dynamic_multi_${this.props.id}`) as HTMLInputElement;
		if (el) {
			el.checked = props.allowMultipleDynamicLayers;
		}
    }
}