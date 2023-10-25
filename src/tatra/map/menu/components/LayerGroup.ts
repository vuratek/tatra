import { Module } from "./Module";
import { GroupContent } from "../../../aux/GroupContent";
import { props } from "../../props";
import { Layer } from "../../obj/Layer";
import { utils } from "../../../utils";
import { mapUtils } from "../../mapUtils";
import { events } from "../../events";
import { opacity } from "../../components/opacity";
import { IMenuModuleLayers, IMenuModule } from "../../defs/ConfigDef";
import flatpickr from 'flatpickr';

export enum MenuLayerGroup {
	TYPE_BASEMAPS	= "basemap",
	TYPE_BASIC		= "basic",
	TYPE_CUSTOM		= "custom"
}
export enum LAYER_MESSAGE_TYPE {
	DATE_RANGE 		= "date_range",
	EXTENT 			= "zoom_level",
	NONE 			= "none"
}
export class LayerGroup extends Module {

	// TYPE_CUSTOM will use props.layer_refs to determine which layers to show
	public type	: MenuLayerGroup = MenuLayerGroup.TYPE_CUSTOM; 
	public layerUpdateHandler : (evt: Event) => void;
	public disabledUpdateHandler : (evt: Event) => void;

	public constructor(props : IMenuModule) {
		super(props);
		this.layerUpdateHandler = () => this.updateLayers();
		this.disabledUpdateHandler = () => this.updateDisabled();
	}

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
			this.props.isMultiLayerActive = false;
        }
//		if (type == 'alerts') { this.appendActiveAlertsInfo(ul); }
		// order by layerRef order (if defined in config), otherwise by location in the overall layer list; 
		if (this.props.useLayerRefsOrder && this.props.useLayerRefsOrder === true) {
			if (this.props.layer_refs) {
				for (let i=0; i<this.props.layer_refs.length; i++) {
					let lo = mapUtils.getLayerById(this.props.layer_refs[i].id) as Layer;
					if (lo.parent) { continue;}
					if (lo.type == "label") {
						this.createLabel(lo, ul, baseId);
					} else if (!lo.clandestine || this.type == MenuLayerGroup.TYPE_CUSTOM) {
						if (this.checkLayerRef(lo, this.props.layer_refs, this.props.tag)) {
							this.createLayer(lo, ul, baseId);
						}
					}
				}
			} else {
				console.log("Layers are not defined for the custom module.");
			}
		} else {
			for (let i = props.layers.length-1; i>=0; i--) {
				let lo = props.layers[i];
				if (lo.parent) { continue; }
				let go = false;
				if (! lo.clandestine && this.props.layer_refs) {                 
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
				if (lo.type == "label") {
					this.createLabel(lo, ul, baseId);
				} else {
					this.createLayer(lo, ul, baseId);
				}
			}
		}
		
        this.updateLayers();
        if (this.props.hasMultiLayer) {
            this.setMultiDynamicLayer();
        }
        document.addEventListener(events.EVENT_LAYER_VISIBLE, this.layerUpdateHandler);
        document.addEventListener(events.EVENT_LAYER_HIDDEN, this.layerUpdateHandler);
        document.addEventListener(events.EVENT_COLOR_PALETTE_LOADED, this.layerUpdateHandler);
        document.addEventListener(events.EVENT_LAYER_RANGE_UPDATE, this.layerUpdateHandler);
        document.addEventListener(events.EVENT_GROUP_CONTENT_CHANGE, this.layerUpdateHandler);
//        document.addEventListener(events.EVENT_LAYER_DATE_UPDATE, () => this.updateDisabled());
		document.addEventListener(events.EVENT_MAP_EXTENT_CHANGE, this.disabledUpdateHandler);
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
				return true; 
			}
		}
		return false;
	}

	public onSystemDateUpdate () {
		this.updateDisabled();
	}

	public createLabel (lo : Layer, ul : HTMLUListElement, baseId:string) {
		let li = document.createElement("li");
		li.setAttribute("id", `bb_label_${baseId}_${lo.id}`);
		li.setAttribute("class", "lmvControlsLabel");
		ul.appendChild(li);
		li.innerHTML = lo.title;
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
		let msgTxt = `<div id="layerInfo_msg_${baseId}_${lo.id}" class="lmvControlsLayerMessage"></div>`;

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
        let zoomTo = '';
        if (lo.zoomTo) {
            zoomTo = `
                <div id="layerZoomTo_${lo.id}" class="lmvControlsLayerInfoBtns lmvControlsZoomTo">
                    <span><i class="fa fa-search-plus" aria-hidden="true"></i></span>
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
            ${zoomTo}
			${msgTxt}
			<div id="layerInfo_${baseId}_${lo.id}" class="lmvControlsLayerInfoBtns lmvControlsLayerInfo"></div>
			${expandMenu}
		`;
		if (lo.needsLegendIcon) { 
			str +=`<div id="layerLegend_${baseId}_${lo.id}" class="lmvControlsLayerLegendIcon"></div>`;
		}
		if (lo.hasLegend) {
			str += `<div id="legend_${baseId}_${lo.id}" class="lmvControlsLayerLegend"></div>`;
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
        if (lo.zoomTo) {
            utils.setClick(`layerZoomTo_${lo.id}`, ()=>this.zoomTo(lo.id));
        }
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
    
    private zoomTo(id:string) {
        let lo = mapUtils.getLayerById(id);
        if (lo && lo.zoomTo) {
            let arr = lo.zoomTo.split(',');
            if (arr.length == 3) {
                mapUtils.zoomTo(Number(arr[0]), Number(arr[1]), Number(arr[2]));
            }
        }
    }

	private showExtraOption(id : string) {
		let lo = mapUtils.getLayerById(id);
		if (!lo) { return; }
		if (lo.visible && opacity.isOpened && opacity.currentLayers && opacity.currentLayers[0].id == lo.id) {
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
			} else {
				if (lo.handler && (lo.handler == "orbits" || lo.handler == "imagery" || lo.tag != "")) {
					lo.visible = ! lo.visible;
					lo.refresh();
					if (lo.exclusive) {
						mapUtils.processExclusiveLayer(lo.id);
					} else {
						// if layer is in container that limits multiple layers turned on, check whether it is active
						if (this.props.layer_refs && lo.visible && this.props.isMultiLayerActive === false && this.props.tag == lo.tag) {
							for (let i=0; i<this.props.layer_refs.length; i++) {
								let lo2 = mapUtils.getLayerById(this.props.layer_refs[i].id);
								if (lo2 && lo2.visible && lo2.id != lo.id ) {
									lo2.visible = false;
								}
							}
						}
					}
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
				el2 = document.getElementById(`legend_${this.props.id}_${lo.id}`) as HTMLDivElement;
			}
			if (lo.listItemHandler) {
				lo.listItemHandler(this.props.id, lo.id);
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
		let type = 'adjust';
/*		if (opacity.isOpened && opacity.currentLayers && opacity.currentLayers[0].id == lo.id) {
			type = 'minus';
		}*/
		el.innerHTML = `<i class="fa fa-${type}" aria-hidden="true"></i>`;
	}

	public setLayerMessage(text:string | null, _id:string, type:LAYER_MESSAGE_TYPE) {
		let id = `layerInfo_msg_${this.props.id}_${_id}`;
		let parentId = `bb_${this.props.id}_${_id}`;
		utils.removeClass(parentId, 'date_range');
		utils.removeClass(parentId, 'extent');
		if (type == LAYER_MESSAGE_TYPE.NONE) {
			utils.hide(id);
			utils.html(id,'');
			utils.removeClass(parentId, 'lmvControlsLayerMsg');
		} else {
			let str = `<div>${text as string}</div>`;
			utils.html(id, str);
			utils.removeClass(id, 'date_range');
			utils.removeClass(id, 'extent');
			let cls = (type == LAYER_MESSAGE_TYPE.DATE_RANGE) ? 'date_range' : 'extent';
			utils.addClass(parentId, 'lmvControlsLayerMsg');
			utils.addClass(parentId, cls);
			utils.addClass(id, cls);
			utils.show(id);
		}
	}

	public updateDisabled() {
		let update = false;
		let level = props.map.getView().getZoom();
		if (this.props.layer_refs && level) {
			for (let i=0; i<this.props.layer_refs.length; i++) {
				let msg:string | null = null;
				let msgType = LAYER_MESSAGE_TYPE.NONE;
				let lo = mapUtils.getLayerById(this.props.layer_refs[i].id) as Layer;
				if (lo.minDate || lo.maxDate) {
					if ((lo.minDate && lo.minDate > flatpickr.formatDate(lo.time, 'Y-m-d')) || 
						(lo.maxDate && lo.maxDate < flatpickr.formatDate(lo.time, 'Y-m-d'))) {
						let start = (lo.minDate) ? lo.minDate : '...';
						let end = (lo.maxDate) ? lo.maxDate : 'present';
						msgType = LAYER_MESSAGE_TYPE.DATE_RANGE;
						msg = `DATA ONLY AVAILABLE - ${start} TO ${end}`;				
						if (props.currentBasemap == lo.id) {
							update = true;
						}
						if (lo.category != "basemap") {
							lo.visible = false;
						}
					}
				}
				// secondary check for zoom level. Data range supersedes zoom level
				if (msgType == LAYER_MESSAGE_TYPE.NONE && (level < lo.minLevel || (lo.maxLevel != -1 && level > lo.maxLevel))) {
					let txt = (level < lo.minLevel) ? 'Zoom IN (+)' : 'Zoom OUT (-)';
					msg = `Zoom level not supported - ${txt}`;
					msgType = LAYER_MESSAGE_TYPE.EXTENT;
				}
				this.setLayerMessage(msg, lo.id, msgType);
			}
		}
		// update basemap if basemap is tied to date range and is out of range
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
			this.props.isMultiLayerActive = el.checked;
			mapUtils.resetDynamicLayers(); // old style; remove at some point
			// if multilayer is deactivate, turn off all layers
			if (! this.props.isMultiLayerActive && this.props.layer_refs) {
				let count = 0;
				for (let i=0; i<this.props.layer_refs.length; i++) {
					let lo2 = mapUtils.getLayerById(this.props.layer_refs[i].id);
					if (lo2 && lo2.visible) {
						lo2.visible = false;
						count++;
					}
				}
				if (count > 0) {
					events.dispatchLayer(events.EVENT_UI_LAYER_UPDATE, '');
				}
			}
		}
    }

    private setMultiDynamicLayer() {
		let el = document.getElementById(`ll_dynamic_multi_${this.props.id}`) as HTMLInputElement;
		if (el) {
			el.checked = props.allowMultipleDynamicLayers;
		}
	}
	public deactivate() {
		super.deactivate();
		document.removeEventListener(events.EVENT_LAYER_VISIBLE, this.layerUpdateHandler);
        document.removeEventListener(events.EVENT_LAYER_HIDDEN, this.layerUpdateHandler);
        document.removeEventListener(events.EVENT_COLOR_PALETTE_LOADED, this.layerUpdateHandler);
        document.removeEventListener(events.EVENT_LAYER_RANGE_UPDATE, this.layerUpdateHandler);
		document.removeEventListener(events.EVENT_GROUP_CONTENT_CHANGE, this.layerUpdateHandler);
		document.removeEventListener(events.EVENT_MAP_EXTENT_CHANGE, this.disabledUpdateHandler);
	}
}