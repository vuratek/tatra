import { configProps } from "../support/configProps";
import { props } from "../props";
import { hash } from "../hash";
import { events } from "../events";

export class mapEvent {
    public static init () {
        if (configProps.showLocation) {
            props.map.getView().on('propertychange',(e) => mapEvent.handler(e));                 
        }
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
    
    public static updateHash () {
        hash.update();
    }               
}
