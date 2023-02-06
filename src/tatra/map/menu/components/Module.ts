// base class for menu module
import { IMenuModule, IMenuModuleLayers } from '../../defs/ConfigDef';
import { GroupContent } from '../../../aux/GroupContent';
import { props } from '../../props';
import { mapUtils } from '../../mapUtils';
import { layerCategories } from '../../obj/Layer';

export class Module {
    public props : IMenuModule;
    public _isActive : boolean = false;

    public constructor(props : IMenuModule) {
        this.props = props;
        if (! props.opened) {
            props.opened = false;
        }
        this.setLayerRefs();
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
        this.activate();
    }

    public isActive() : boolean {
		return this._isActive;
	}

    // do something when module becomes active
    public activate() {
        this._isActive = true;
    }

    public hasGroup() : boolean {
        return this._hasGroup;
    }

    // when module is removed from the map menu
    public deactivate() {
        this._isActive = false;
        if (this._hasGroup) {
            this.props.opened = GroupContent.isOpened(this.props.id);
        }
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

    public setLayerRefs() {
        if (! this.props.tag) { return; }
        if (!this.props.layer_refs) {
            this.props.layer_refs = [];
            for (let i=0; i<props.layers.length; i++) {
                let lo = props.layers[i];
                if (lo.tag == this.props.tag) { 
                    let obj : IMenuModuleLayers = { id: lo.id, visible : lo.visible, _defaultVisible : null};
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

    // this will return array list of layers that url hash should display
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

    public presetDefaultLayerVisibility () {
        if (!this.props.layer_refs) { return; }
        let arr = this.props.layer_refs as Array<IMenuModuleLayers>;
        for (let j=0; j<arr.length; j++) {
            arr[j].visible = this.isDefaultLayer(arr[j].id);
        }
    }

    private isDefaultLayer(id:string) : boolean {
        if (! this.props.defaultLayers) { return false;}
        for (let i=0; i < this.props.defaultLayers.length; i++) {
            if (this.props.defaultLayers[i] == id) { return true; }
        }
        return false;
    }

}