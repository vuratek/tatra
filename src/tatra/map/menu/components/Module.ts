// base class for menu module
import { IMenuModule, IMenuModuleLayers } from '../../defs/ConfigDef';
import { GroupContent, IGroupContentOptions } from '../../../aux/GroupContent';
import { props } from '../../props';
import { mapUtils } from '../../mapUtils';
import { layerCategories, Layer } from '../../obj/Layer';
import { IHashLayer } from '../../hash';
import { events } from '../../events';
import { controls } from '../../components/controls';
import { lg_info } from '../../components/lg_info';
import { utils } from '../../../utils';
import flatpickr from 'flatpickr';
import { opacity } from '../../components/opacity';

export interface ILastRefreshUrl {
    [id : string] : string;
}

export enum LAYER_MESSAGE_TYPE {
	DATE_RANGE 		= "date_range",
	EXTENT 			= "zoom_level",
	NONE 			= "none"
}
export class Module {
    public props : IMenuModule;
    public _isActive : boolean = false;
    public _hasGroup : boolean = true;
    public systemDateUpdateHandler : (evt: Event) => void;
    public labelHandler : (evt: Event) => void;
    public disabledUpdateHandler : (evt: Event) => void;
    public lastRefreshUrl : ILastRefreshUrl = {};
    public overrideOpened : boolean | null = null;

    public constructor(props : IMenuModule) {
        this.props = props;
        if (props.opened == undefined) {
            props.opened = false;
        }
        if (this.props.layer_refs && ! this.props.useLayerRefsOrder) {
            this.props.useLayerRefsOrder = true;
        }
        if (props.usePresetLayers == undefined) {
            props.usePresetLayers = true;
        }
        if (this.props.defaultLayers) {
            this.props.defaultLayers.sort();
        }
        this.setLayerRefs();
        this.systemDateUpdateHandler = () => this.onSystemDateUpdate();
        this.disabledUpdateHandler = () => this.updateDisabled();
        this.labelHandler = () => this.updateInfoLabel();
    }

    // create initial div component; customization done in a child class
    public render(div:HTMLDivElement) {
        if (this.props.noGroup) {
            let el = document.createElement("div");
            el.id = `mmm_${this.props.id}`;
            div.appendChild(el);
        } else {
            let opened = (this.overrideOpened != null) ? this.overrideOpened : this.props.opened;
            let options:IGroupContentOptions =  {
                id : this.props.id,
                label : this.props.label, 
                parent: div, 
                opened : opened
            };
            if (this.props.menuDescription) {
                options.infoIcon = 'clone';
                options.info = () => this.infoHandler();
            }
            GroupContent.create( options );
        }
        //this.activate();
    }

    public isActive() : boolean {
		return this._isActive;
	}

    // do something when module becomes active
    public activate() {
        this._isActive = true;
        document.addEventListener(events.EVENT_SYSTEM_DATE_UPDATE, this.systemDateUpdateHandler);
        document.addEventListener(events.EVENT_LABEL_UPDATE, this.labelHandler);
        this.lastRefreshUrl = {};
    }

    public hasGroup() : boolean {
        return this._hasGroup;
    }

    public onSystemDateUpdate () {
    }
 
    public infoHandler() {
        if (this.props.menuDescription) {
            controls.activateControlItem('lg_info');
            lg_info.setLabel(this.props.label);
            lg_info.setContent(this.props.menuDescription);
            lg_info.open();
        }
    }

    // when module is removed from the map menu
    public deactivate() {
        this._isActive = false;
        if (this._hasGroup) {
            this.props.opened = GroupContent.isOpened(this.props.id);
        }
        document.removeEventListener(events.EVENT_SYSTEM_DATE_UPDATE, this.systemDateUpdateHandler);
        document.removeEventListener(events.EVENT_LABEL_UPDATE, this.labelHandler);
    }

    public presetLayers() {
        return;
        /* rethink this?
        if (!this.props.tag || this.props.tag == layerCategories.BASEMAP) {
            return;
        }
        let arr = this.props.layer_refs as Array<IMenuModuleLayers>;   
        for (let i =arr.length-1; i>=0; i--) {
            let lo = mapUtils.getLayerById(arr[i].id);
            if (lo) {
//                arr[i].visible = lo.visible;
            }
        }*/
    }

    // set layer_refs either from config or from layer_refs (validate layer exists)
    public setLayerRefs() {
        if (! this.props.tag) { return; }
        // if there is no layer_refs, use tag to locate corresponding layers
        if (!this.props.layer_refs) {
            this.props.layer_refs = [];
            for (let i=0; i<props.layers.length; i++) {
                let lo = props.layers[i];
                if (lo.tag == this.props.tag) { 
                    let obj : IMenuModuleLayers = { id: lo.id, visible : lo.visible, _defaultVisible : null, settings : null};
                    this.props.layer_refs.push(obj);
                }
            }
        } else {
            let arr = this.props.layer_refs as Array<IMenuModuleLayers>;   
            for (let i = arr.length-1; i>=0; i--) {
                let lo = mapUtils.getLayerById(arr[i].id);
                if (! lo) {
                    arr.splice(i,1);
                } else {
                    arr[i].visible = lo.visible;
                }
            }
        }
    }

    /**
     * setDateTime() - datetime handler for date/time updates
     */
    public setDateTime() { }

    // whether module handles subdaily
    public isSubDaily() : boolean {
        return false;
    }

    public showLayers() {
        let arr = this.props.layer_refs as Array<IMenuModuleLayers>;   
        for (let i=0; i< arr.length; i++) {
            let lo = mapUtils.getLayerById(arr[i].id);
            if (lo) {
                lo.visible = arr[i].visible;
            }
        }
    }

    public hideLayers() {
        let arr = this.props.layer_refs as Array<IMenuModuleLayers>;
        for (let i=0; i< arr.length; i++) {
            let lo = mapUtils.getLayerById(arr[i].id);
            if (lo) {
                arr[i].visible = lo.visible;
                if (lo.visible) {
                    lo.visible = false;
                }
            }                
        }
    }

    /**
     * getHashLayers() - returns list of layers that should be included in url hash
     */
    /*public getHashLayers() : Array<string> {
        let res:Array<string> = [];
        let arr = this.props.layer_refs as Array<IMenuModuleLayers>;
        for (let i=0; i< arr.length; i++) {
            let lo = mapUtils.getLayerById(arr[i].id);
            if (lo && lo.visible) {
                if (! this.isDefaultLayer(lo.id)) {
                    res.push(lo.id);
                }
            }
        }
        return res;
    }*/

    public presetDefaultLayerVisibility (isActiveModule:boolean, hashLayers:Array<IHashLayer>) {
        if (!this.props.layer_refs) { return; }
        let arr = this.props.layer_refs as Array<IMenuModuleLayers>;
        for (let j=0; j<arr.length; j++) {
            // set only active module to URL hash layers if they are defined
            if (isActiveModule && hashLayers.length > 0) {
                arr[j].visible = this.isHashLayer(arr[j].id, hashLayers);
                let info = this.getHashLayerId(arr[j].id, hashLayers);
                if (arr[j].visible && info) {
                    this.setAdditionalLayerInfo(arr[j], info);
                }
            } else {
                arr[j].visible = this.isDefaultLayer(arr[j].id);
            }
        }
    }

    // set default layer visibility based on being a defaultLayer; this may get overwritten by isHashLayer
    private isDefaultLayer(id:string) : boolean {
        if (! this.props.defaultLayers) { return false;}
        for (let i=0; i < this.props.defaultLayers.length; i++) {
            if (this.props.defaultLayers[i] == id) { return true; }
        }
        return false;
    }

    public setAdditionalLayerInfo(lyr : IMenuModuleLayers, info:string) {}

    private getHashLayerId(id:string, hashLayers:Array<IHashLayer>) : string | null {
        for (let i=0; i<hashLayers.length; i++) {
            if (hashLayers[i].layerId == id && hashLayers[i].classifier != undefined) {
                return hashLayers[i].classifier as string;
            }
        }
        return null;
    }

    // check if the layer is defined in url hash
    private isHashLayer(id:string, hashLayers:Array<IHashLayer>) : boolean {
        for (let i=0; i<hashLayers.length; i++) {
            if (hashLayers[i].layerId == id) {
                return true;
            }
        }
        return false;
    }

    public getLayerHashValue(lo : Layer) : string {
        //console.log(lo.id);
        if (lo.classifier) {
            return lo.id + '=' + lo.classifier;
        }
        return lo.id;
    }

    // provide list of all visible layers within the module
    public getHashLayerInformation() : Array <IHashLayer> | null {
        if (! this.isActive() || ! this.props.layer_refs) { return null;}
        let arr : Array <string> = [];
        for (let i=0; i<this.props.layer_refs.length; i++) {
            let lo = mapUtils.getLayerById(this.props.layer_refs[i].id)
            if (lo && ! lo.clandestine && ! lo.parent && lo.visible) {
                arr.push(this.getLayerHashValue(lo));
            }
        }
        if (arr.length > 0) {
            arr.sort();
            let list : Array<IHashLayer> = []
            for (let i=0; i<arr.length; i++) {
                list.push({"layerId":arr[i]});
            }
            return list;
        }
        return null;
    }

    // provide list of all default layers (visible or not)
    public getHashDefaultLayerInformation() : Array <IHashLayer> | null {
        if (! this.isActive() || ! this.props.defaultLayers) { return null;}
        let arr : Array <IHashLayer> = [];
        for (let i=0; i<this.props.defaultLayers.length; i++) {
            arr.push({"layerId":this.props.defaultLayers[i]});
        }
        if (arr.length > 0) {
            return arr;
        }
        return null;
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
		el.innerHTML =`<i class="fa fa-list" aria-hidden="true"></i>`;
		let info = (lo.info) ? lo.info : lo.id;
		utils.setClick(parentId, () => events.legendClicked(info));
    }
    public setLayerOpacityField (parentId : string, lo : Layer) {
		let el = document.getElementById(parentId) as HTMLDivElement;
		if (!el) { return; }
        el.innerHTML = `<i class="fa fa-adjust" aria-hidden="true"></i>`;
        utils.setClick(parentId, () => this.showExtraOption(lo.id));
    }
    
    public showExtraOption(id : string) {
		let lo = mapUtils.getLayerById(id);
		if (!lo) { return; }
		if (lo.visible && opacity.isOpened && opacity.currentLayers && opacity.currentLayers[0].id == lo.id) {
			opacity.close();
			return;
		}
//		if (! lo.visible) { lo.visible=true;}
		opacity.setLayer(lo.id, lo.title);
    }

    public renderKioskLegend() : string | null {
        let legends : Array <{ icon: string | null, label : string, lo : Layer }> = [];
        if (this.props.layer_refs) {
			for (let i=0; i<this.props.layer_refs.length; i++) {
                let lo = mapUtils.getLayerById(this.props.layer_refs[i].id) as Layer;
                if (lo && lo.visible && lo.kioskLegendLabel) {
                    let found = false;
                    let comp = lo.kioskLegendLabel;
                    if (comp.indexOf('#') >= 0) {
                        comp = lo[comp.replace('#','')];
                    }
                    for (let l = 0; l<legends.length; l++) {
                        let leg = legends[l];
                        if (leg.icon == lo.icon && leg.label == comp) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        legends.push( {icon : lo.icon, label : comp, lo : lo});
                    }
                }
            }
        }
        if (legends.length == 0) { return null; }
        let str = '';
        for (let i=0; i<legends.length; i++) {
            let lo = legends[i].lo;
            let icon = mapUtils.renderLayerIcon(lo);
            if (lo.kioskLegendHander) {
                let leg = lo.kioskLegendHander(lo, legends[i].label);
                str += `
                    <div class="kioskLegendCustom">
                        ${leg}
                    </div>
                `;
            } else {
                str += `
                    <div class="kioskLegendItem">
                        <div>${icon}</div>
                        <div>${legends[i].label}</div>
                    </div>
                `;
            }
        }
        return str;
    }

    public updateInfoLabel() {}

}
