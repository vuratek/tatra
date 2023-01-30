import { IMenuModule } from '../../defs/ConfigDef';
import { LayerGroup, MenuLayerGroup } from './LayerGroup';

export class Orbits extends LayerGroup {

    public constructor(props : IMenuModule) {
        super(props,  MenuLayerGroup.TYPE_ORBITS);
        this.type = MenuLayerGroup.TYPE_ORBITS;
    }

    public activate() {
        super.activate();
        this.showLayers();
    }

    public deactivate() {
        super.deactivate();
        this.hideLayers();
    }
}