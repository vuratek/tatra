import { IMenuModule } from '../../defs/ConfigDef';
import { LayerGroup, MenuLayerGroup } from './LayerGroup';

export class Basic extends LayerGroup {

    public constructor(props : IMenuModule) {
        super(props);
        this.type = MenuLayerGroup.TYPE_BASIC;
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