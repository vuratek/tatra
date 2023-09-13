// base class for menu module
import { IMenuModule, IMenuModuleLayers } from '../../defs/ConfigDef';
import { GroupContent } from '../../../aux/GroupContent';
import { props } from '../../props';
import { mapUtils } from '../../mapUtils';
import { layerCategories } from '../../obj/Layer';
import { IHashLayer } from '../../hash';
import { events } from '../../events';

export class Module {
    public props : IMenuModule;
    public _isActive : boolean = false;
    public _hasGroup : boolean = true;
    public systemDateUpdateHandler : (evt: Event) => void;

    public constructor(props : IMenuModule) {
        this.props = props;
        if (props.opened == undefined) {
            props.opened = false;
        }
        if (props.usePresetLayers == undefined) {
            props.usePresetLayers = true;
        }
        if (this.props.defaultLayers) {
            this.props.defaultLayers.sort();
        }
        this.setLayerRefs();
        this.systemDateUpdateHandler = () => this.onSystemDateUpdate();
    }

    // create initial div component; customization done in a child class
    public render(div:HTMLDivElement) {
        if (this.props.noGroup) {
            let el = document.createElement("div");
            el.id = `mmm_${this.props.id}`;
            div.appendChild(el);
        } else {
            GroupContent.create( {id : this.props.id, label : this.props.label, parent: div, opened : this.props.opened} );
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
    }

    public hasGroup() : boolean {
        return this._hasGroup;
    }

    public onSystemDateUpdate () {
    }
 

    // when module is removed from the map menu
    public deactivate() {
        this._isActive = false;
        if (this._hasGroup) {
            this.props.opened = GroupContent.isOpened(this.props.id);
        }
        document.removeEventListener(events.EVENT_SYSTEM_DATE_UPDATE, this.systemDateUpdateHandler);
    }

    public presetLayers() {
        if (!this.props.tag || this.props.tag == layerCategories.BASEMAP) {
            return;
        }
        let arr = this.props.layer_refs as Array<IMenuModuleLayers>;   
        for (let i =arr.length-1; i>=0; i--) {
            let lo = mapUtils.getLayerById(arr[i].id);
            if (lo) {
                arr[i].visible = lo.visible;
            }
        }
    }

    // set layer_refs either from config or from layer_refs (validate layer exists)
    public setLayerRefs() {
        if (! this.props.tag) { return; }
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
    public getHashLayers() : Array<string> {
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
    }

    public presetDefaultLayerVisibility (isActiveModule:boolean, hashLayers:Array<IHashLayer>) {
        if (!this.props.layer_refs) { return; }
        let arr = this.props.layer_refs as Array<IMenuModuleLayers>;
        for (let j=0; j<arr.length; j++) {
            // set only active module to URL hash layers if they are defined
            if (isActiveModule && hashLayers.length > 0) {
                arr[j].visible = this.isHashLayer(arr[j].id, hashLayers);
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

    // check if the layer is defined in url hash
    private isHashLayer(id:string, hashLayers:Array<IHashLayer>) : boolean {
        for (let i=0; i<hashLayers.length; i++) {
            if (hashLayers[i].layerId == id) {
                return true;
            }
        }
        return false;
    }

    // provide list of all visible layers within the module
    public getHashLayerInformation() : Array <IHashLayer> | null {
        if (! this.isActive() || ! this.props.layer_refs) { return null;}
        let arr : Array <string> = [];
        for (let i=0; i<this.props.layer_refs.length; i++) {
            let lo = mapUtils.getLayerById(this.props.layer_refs[i].id)
            if (lo && ! lo.clandestine && lo.visible) {
                arr.push(lo.id);
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

}
