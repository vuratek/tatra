// base class for menu module
import { IMenuModule, IMenuModuleLayers } from '../../defs/ConfigDef';
import { GroupContent } from '../../../aux/GroupContent';
import { Layer } from 'ol/layer';
import { props } from '../../props';
import { mapUtils } from '../../mapUtils';
import LayerGroup from 'ol/layer/Group';
import { layerCategories } from '../../obj/Layer';

export class Module {
    public props : IMenuModule;
    public tag : string;
    public _isActive : boolean = false;
    public _hasGroup : boolean = true;  // whether it is closeable

    public constructor(props : IMenuModule, tag : string) {
        this.props = props;
        this.tag = tag;
        if (! props.opened) {
            props.opened = false;
        }
        if (props.hasGroup) {
            this._hasGroup = props.hasGroup;
        } else {
            this._hasGroup = true;
        }
        this.setLayerRefs();
    }

    // create initial div component; customization done in a child class
    public render(div:HTMLDivElement) {
        if (this._hasGroup) {
            GroupContent.create( {id : this.props.id, label : this.props.label, parent: div, opened : this.props.opened} );
        } else {
            let el = document.createElement("div");
            el.id = `mmm_${this.props.id}`;
            div.appendChild(el);
            el.innerHTML = `<div style="color:white;background:black;">${this.props.label}</div>`;
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
        if (this.tag == layerCategories.BASEMAP) {
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
        if (!this.props.layer_refs) {
            this.props.layer_refs = [];
            for (let i=0; i<props.layers.length; i++) {
                let lo = props.layers[i];
                if (lo.tag == this.tag) { 
                    let obj : IMenuModuleLayers = { id: lo.id, visible : lo.visible};
                    this.props.layer_refs.push(obj);
                }
            }
        } else {
            let arr = this.props.layer_refs as Array<IMenuModuleLayers>;   
            for (let i =arr.length-1; i>=0; i--) {
                let lo = mapUtils.getLayerById(arr[i].id);
                if (! lo) {
                    arr.splice(i,1);
                } else {
                    if (!arr[i].visible) {
                        arr[i].visible = false;
                    }
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
}
