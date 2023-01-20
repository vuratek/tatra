import { IMenuModule } from '../../defs/ConfigDef';
import { LayerGroup, MenuLayerGroup } from './LayerGroup';
export class Overlays extends LayerGroup {

    public constructor(props : IMenuModule) {
        super(props);
        this.type = MenuLayerGroup.TYPE_OVERLAYS;
    }
}