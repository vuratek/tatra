import { IMenuModule, IMenuModuleLayers } from '../../defs/ConfigDef';
import { LayerGroup, MenuLayerGroup } from './LayerGroup';
import { props } from '../../props';
import { mapUtils } from '../../mapUtils';
import { layerCategories } from '../../obj/Layer';
import { IHashLayer } from '../../hash';

export class Basemaps extends LayerGroup {

    public constructor(props : IMenuModule) {
        super(props);
        this.type = MenuLayerGroup.TYPE_BASEMAPS;
    }

    public activate() {
        super.activate();
        // set default basemap as defined in config if not already set by other process
        let basemap = 'earth';
        let defBasemap = props.currentBasemap;
        // check if currentBasemap is set, if not set to defaultBasemap (if defined in config)
        if (defBasemap == '') {
            if (this.props.defaultLayers) {
                defBasemap = this.props.defaultLayers[0];
            } else {
                defBasemap = 'earth';
            }
        }

        let arr = this.props.layer_refs as Array<IMenuModuleLayers>;
        for (let i=0; i< arr.length; i++) {
            if (arr[i].id == defBasemap) {
                basemap = defBasemap;
                break;
            }
        }

        // validate that the basemap exists within all layers
        let lo = mapUtils.getLayerById(basemap);
        if (! lo || lo.tag != layerCategories.BASEMAP) {
            basemap = 'earth';
        }        
        mapUtils.setBasemap(basemap);
    }

    public presetDefaultLayerVisibility (isActiveModule:boolean, hashLayers:Array<IHashLayer>) {
        super.presetDefaultLayerVisibility(isActiveModule, hashLayers);
        if (isActiveModule) {
            let arr = this.props.layer_refs as Array<IMenuModuleLayers>;
            for (let i=0; i< arr.length; i++) {
                if (arr[i].visible) {
                    props.currentBasemap = arr[i].id;
                    break;
                }
            }
        }
    }
}