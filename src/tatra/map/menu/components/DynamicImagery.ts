import { IMenuModule } from '../../defs/ConfigDef';
import { LayerGroup, MenuLayerGroup } from './LayerGroup';

export class DynamicImagery extends LayerGroup {

    public constructor(props : IMenuModule) {
        super(props,  MenuLayerGroup.TYPE_IMAGERY);
        this.type = MenuLayerGroup.TYPE_IMAGERY;
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