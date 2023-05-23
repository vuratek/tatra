import { tileUrlHandler } from './tileUrlHandler';
import { mapUtils } from '../mapUtils';
import { Layer } from '../obj/Layer';
import flatpickr from 'flatpickr';
import TileLayer from 'ol/layer/Tile';

export class tileUrlFunctions {

    public static init() {
        tileUrlHandler.register("basic", this._basic);
        tileUrlHandler.register("gibs", this._gibs);
        tileUrlHandler.register("orbit", this._orbit);
        tileUrlHandler.register("esri_vector", this._esri_vector);
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
        // zoom level is one off for EPSG:4326
        let off = (lo.source.projection == 'EPSG:3857') ? 0 : 1;
        return str
            .replace('#id#', lo.id)
            .replace('{z}', (tileCoord[0] - off).toString())
            .replace('{x}', tileCoord[1].toString())
            .replace('{y}', tileCoord[2].toString());
    }

    /**
     * _orbit - sets GIBS orbit layer
     * @param id 
     * @param tileCoord 
     */
    public static _orbit(id : string, tileCoord : Array <number>) : string {
        let lo = mapUtils.getLayerById(id);
        if (!lo || !lo.source || !lo.source.url) { return ''; }
        
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
    public static _gibs (tile : TileLayer, src : string, id : string) : string {
        let lo = mapUtils.getLayerById(id) as Layer;
        if (! lo) { return ''; }
        let dt = flatpickr.formatDate(lo.time, lo.dateFormat);
        if (lo.dateFormat.indexOf('H:i')>=0) {
            dt = dt.replace(' ', 'T') + 'Z';
        }
        return src.replace("*TIME*", dt);    
    }

    public static _esri_vector (id : string, tileCoord : Array <number>) : string {
		let lo = mapUtils.getLayerById(id);

		if (!lo || !lo.source || lo.source.url) { return ''; }
	
		let url = lo.source.url as string;
		let x = tileCoord[1];
		let y = tileCoord[2];
		let z = tileCoord[0]-1;
		if (lo.minLevel >=0 && z < lo.minLevel) { return ''; }
		let precision = 1;
		if (z > 9) {
			precision = 4;
		}
		else if (z > 7) {
			precision = 3;
		} else if (z > 5) {
			precision = 3;
		} else if (z > 3) {
			precision = 2;
		} 
		let minx = mapUtils.tile2long(x,z);
		let miny = mapUtils.tile2lat(y+1,z)
		let maxx = mapUtils.tile2long(x+1,z);
		let maxy = mapUtils.tile2lat(y,z);
		url += `&geometry={"spatialReference":{"latestWkid":4326,"wkid":4326},"xmin":${minx},"ymin":${miny},"xmax":${maxx},"ymax":${maxy}}`;
		url += `&maxRecordCountFactor=3&outFields=&outSR=4326`;
		url += `&resultType=tile&returnExceededLimitFeatures=false`;
		url += `&spatialRel=esriSpatialRelIntersects&where=1=1&geometryType=esriGeometryEnvelope&inSR=4326`;
		url += `&geometryPrecision=${precision}`;
		return url;
	}
		
}