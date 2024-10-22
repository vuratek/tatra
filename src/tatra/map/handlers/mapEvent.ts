import { configProps } from "../support/configProps";
import { props } from "../props";
import { hash } from "../hash";
import { events } from "../events";
import { mapUtils } from "../mapUtils";

export class mapEvent {
    public static init () {
//        if (configProps.showLocation) {
            props.map.getView().on('propertychange',(e) => mapEvent.handler(e));                 
//        }
        props.map.on('change:size',()=> this.checkSize());
    }
    
    public static handler (e:any) {
        if (e.key == 'center' || e.key ==  'resolution') {
            switch (e.key) {
                case 'resolution':
                case 'center':
                    if (configProps.showLocation) {
                        mapEvent.updateHash();
                    }
                    events.dispatch(events.EVENT_MAP_EXTENT_CHANGE);
                    break;
            }
        }
    }

    private static checkSize() {
        if (props.is3DMode) {
            let ext = mapUtils.getMapExtent();
            let size = props.map.getSize();
            if (ext && size) {
                let z = ext[2];
                let w = size[0];
                if (w == 1024 && z != 2) {
                    props.map.getView().setZoom(2);
                } else if (w == 2048 && z != 3) {
                    props.map.getView().setZoom(3);
                }
            }
        }
    }
    
    public static updateHash () {
        hash.update();
    }               
}
