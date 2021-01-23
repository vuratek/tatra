import { utils } from "../utils";
import { SensorData } from "./sensorData";

export class tools {
    public static isSwathValid (swath : string, list : Array <string>) {
        for (let i=0; i< list.length; i++) {
            if (list[i] == swath) { return true;}
        }
        return false;
    }

    private static updateStyleSheets(sensorData : SensorData, fitScreen : boolean, border : number) {
        utils.removeClass('body', 'swathViewerFit', false);        
        utils.removeClass('body', 'swathViewerFull', false);        
        let cls = (fitScreen) ? 'swathViewerFit' : 'swathViewerFull';
        utils.addClass('body', cls, false);   
        let sheets = document.styleSheets;
        for ( let i=0; i < sheets.length; i++) {
            let sheet = sheets[i] as CSSStyleSheet;
            for (let j =0; j < sheet.cssRules.length; j++) {
                let rule = sheet.cssRules[j] as CSSStyleRule;
                if (rule.cssText.indexOf('.swathViewerFit #swathTable td') >= 0) {
                    rule.style.height = sensorData.info._y + "px";
                    rule.style.width = sensorData.info._x + "px";
                } 
                if (rule.cssText.indexOf('.swathViewerFit #swathTable') >= 0) {
                    rule.style.marginLeft = sensorData.info._offsetX + "px";
                    rule.style.marginTop = sensorData.info._offsetY + "px";
                }
                if (rule.cssText.indexOf('.swathViewer table td img') >= 0) {
                    rule.style.height = sensorData.info.imageY + "px";
                    rule.style.width = sensorData.info.imageX + "px";
                }
                if (rule.cssText.indexOf('.swathViewer table') >= 0) {
                    rule.style.borderSpacing = border + "px";
                }                
            }
        }
    }

    public static computeResize (sensorData : SensorData, fitScreen : boolean, border : number) {
        let map = document.getElementById('map') as HTMLDivElement;
        if (!map) { return;}
        let timeline = document.getElementById('timeline') as HTMLDivElement;
        let mtx = 15;
        let mty = sensorData.info._maxRows;
        let screenX = map.clientWidth - (mtx+1) * border;
        let screenY = map.clientHeight - (mty+1) * border;
        let tileMaxX = Math.floor(screenX / mtx);
        let tl = (timeline && timeline.style.display != "none") ? 60 : 0;
        let tileMaxY = Math.floor((screenY - tl) / mty);
        // space is larger than default tiles
        if (tileMaxX >= sensorData.info.imageX && tileMaxY >= sensorData.info.imageY) {
            sensorData.info._x = sensorData.info.imageX;
            sensorData.info._y = sensorData.info.imageY;
        } else {
            let ratx = tileMaxX / sensorData.info.imageX;
            let raty = tileMaxY / sensorData.info.imageY;
            let ratio = (ratx > raty) ? raty : ratx;
            sensorData.info._x = sensorData.info.imageX * ratio;
            sensorData.info._y = sensorData.info.imageY * ratio;
        }
        sensorData.info._offsetX = Math.round((screenX - mtx * sensorData.info._x) / 2);
        sensorData.info._offsetY = Math.round((screenY - tl - mty * sensorData.info._y) / 2);
        this.updateStyleSheets(sensorData, fitScreen, border);
    }
}