import { tileUrlHandler } from './tileUrlHandler';
import { mapUtils } from '../mapUtils';
import { Layer } from '../obj/Layer';
import flatpickr from 'flatpickr';
import TileLayer from 'ol/layer/Tile';

export class tileUrlFunctions {

    public static init() {
        tileUrlHandler.register("basic", this._basic);
        tileUrlHandler.register("gibs", this._GIBS);
        tileUrlHandler.register("orbit", this._orbit);
    }
    /**
     * _basic - most basic tile service used for ESRI blue marble basemap
     * @param id 
     * @param tileCoord 
     */
    public static _basic (id : string, tileCoord : Array <number>) {
        let lo = mapUtils.getLayerById(id);
		if (!lo || !lo.source || !lo.source.url ) { return ''; }
//		let ext = (lo.id.indexOf('test') > 0 ) ? '' : '.png';
        let str = lo.source.url.slice();
		return str
            .replace('{z}', (tileCoord[0] - 1).toString())
            .replace('{x}', tileCoord[1].toString())
            .replace('{y}', (tileCoord[2]).toString());	    
    }

    /**
     * _orbit - sets GIBS orbit layer
     * @param id 
     * @param tileCoord 
     */
    public static _orbit(id : string, tileCoord : Array <number>) {
        let lo = mapUtils.getLayerById(id);
        if (!lo || !lo.source || !lo.source.url) { return; }
        
        let url = lo.source.url as string;
        if (lo.replace) {
            for (let i=0; i< lo.replace.length / 2; i++) {
                url = url.replace(`#${lo.replace[i*2]}#`, lo.replace[i*2 + 1]);
            }
        }

        let dt = flatpickr.formatDate(lo.time, 'Y-m-d');
        url += "&TIME=" + dt;
        url += '&BBOX=' + mapUtils.tile2coord(tileCoord[1], tileCoord[2], tileCoord[0]-1);
        return url;			    
    }
    
    /**
     * _GIBS - NASA GIBS tiles with time updates
     * @param tile 
     * @param src 
     * @param id 
     */
    public static _GIBS (tile : TileLayer, src : string, id : string) {
        let lo = mapUtils.getLayerById(id) as Layer;
        if (! lo) { return; }
        let dt = flatpickr.formatDate(lo.time, lo.dateFormat);
        if (lo.dateFormat.indexOf('H:i')>=0) {
            dt = dt.replace(' ', 'T') + 'Z';
        }
        return src.replace("*TIME*", dt);    
    }

		
}