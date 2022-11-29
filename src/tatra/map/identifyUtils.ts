import { MapBrowserEvent } from 'ol';
import Overlay from 'ol/Overlay';

export class identifyUtils {

    public static setWindow(evt:MapBrowserEvent, window : Overlay, windowHeight : number) {
        let mc = evt.pixel;
        let mw = (document.getElementById('map') as HTMLDivElement).clientWidth;
        if (mc[1] < windowHeight) {
            if (mc[0] < 150) {
//                window.setPositioning(OverlayPositioning.TOP_LEFT);
                window.setPositioning('top-left');
                window.setOffset([-20, 10]);    
            } else if (mc[0] > mw - 200) {
                window.setPositioning('top-right');
                window.setOffset([20, 10]);    
            } else {
                window.setPositioning('top-center');
                window.setOffset([0, 10]);    
            }
        } else {
            if (mc[0] < 150) {
                window.setPositioning('bottom-left');
                window.setOffset([-20, -17]);    
            } else if (mc[0] > mw - 200) {
                window.setPositioning('bottom-right');
                window.setOffset([20, -17]);    
            } else {
                window.setPositioning('bottom-center');
                window.setOffset([0, -17]);
            }
        }
    }
}