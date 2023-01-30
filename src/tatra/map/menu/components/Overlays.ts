import { IMenuModule } from '../../defs/ConfigDef';
import { LayerGroup, MenuLayerGroup } from './LayerGroup';

export class Overlays extends LayerGroup {

    public constructor(props : IMenuModule) {
        super(props,  MenuLayerGroup.TYPE_OVERLAYS);
        this.type = MenuLayerGroup.TYPE_OVERLAYS;
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