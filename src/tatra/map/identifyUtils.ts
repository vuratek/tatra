import { MapBrowserEvent } from 'ol';
import Overlay from 'ol/Overlay';
import OverlayPositioning from 'ol/OverlayPositioning';

export class identifyUtils {

    public static setWindow(evt:MapBrowserEvent, window : Overlay, windowHeight : number) {
        let mc = evt.pixel;
        let mw = (document.getElementById('map') as HTMLDivElement).clientWidth;
        if (mc[1] < windowHeight) {
            if (mc[0] < 150) {
                window.setPositioning(OverlayPositioning.TOP_LEFT);
                window.setOffset([-20, 10]);    
            } else if (mc[0] > mw - 200) {
                window.setPositioning(OverlayPositioning.TOP_RIGHT);
                window.setOffset([20, 10]);    
            } else {
                window.setPositioning(OverlayPositioning.TOP_CENTER);
                window.setOffset([0, 10]);    
            }
        } else {
            if (mc[0] < 150) {
                window.setPositioning(OverlayPositioning.BOTTOM_LEFT);
                window.setOffset([-20, -17]);    
            } else if (mc[0] > mw - 200) {
                window.setPositioning(OverlayPositioning.BOTTOM_RIGHT);
                window.setOffset([20, -17]);    
            } else {
                window.setPositioning(OverlayPositioning.BOTTOM_CENTER);
                window.setOffset([0, -17]);
            }
        }
    }
}