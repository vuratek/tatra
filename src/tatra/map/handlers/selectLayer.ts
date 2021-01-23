import { Selection } from "../obj/Selection";
import { Coord } from "../obj/Coord";
import { Feature } from 'ol';
import { mapUtils } from "../mapUtils";
import { BaseSelectGeoJSONTool } from "../mapTools/BaseSelectGeoJSONTool";
import { DrawEvent } from "ol/interaction/Draw";

export class selectLayer {     

    public static country (e : any, base : BaseSelectGeoJSONTool) {
        let selectedFeatures = e.target.getFeatures();
        selectedFeatures.forEach(function(feature : Feature) {
            base.insertItem(selectLayer.getCountrySO(feature));
        });
    }
    
    public static tile (e : any, base : BaseSelectGeoJSONTool) {
        let selectedFeatures = e.target.getFeatures();
        selectedFeatures.forEach(function(feature : Feature) {
            base.insertItem(selectLayer.getTileSO(feature));
        });
    }
    
    public static site (e : any, base : BaseSelectGeoJSONTool) {
        let selectedFeatures = e.target.getFeatures();
        selectedFeatures.forEach(function(feature : Feature) {            
            base.insertItem(selectLayer.getSiteSO(feature));
        });
    }
    
    public static getCountrySO (feature : Feature) : Selection {
        let extent = feature.getGeometry().getExtent();
        let coord = new Coord(extent[0].toString(), extent[1].toString(), extent[2].toString(), extent[3].toString());
        let so = new Selection( feature.getId().toString(), coord, feature, feature.get("name"));
        so.short = feature.get("__id").toString();
//        let so = new Selection(feature.get("ObjectID"), coord, feature, feature.get("CNTRY_NAME"));
//        so.short = feature.get("ISO_3DIGIT");
        return so;
    }
    
    public static getTileSO (feature : Feature) : Selection {
        let extent = feature.getGeometry().getExtent();
        let coord = new Coord(extent[0].toString(), extent[1].toString(), extent[2].toString(), extent[3].toString());
        let h = feature.get("h");
        let v = feature.get("v");
        let label = "H: " + h + ", V: " + v;
        let short = "H" + h + "V" + v; 
        let so = new Selection(feature.get("OBJECTID"), coord, feature, label);
        so.short = short;
        return so;
    }
    
    public static getSiteSO (feature : Feature) : Selection {
        let extent = feature.getGeometry().getExtent();
        let coord = new Coord(extent[0].toString(), extent[1].toString(), extent[2].toString(), extent[3].toString());
        let si = feature.get("site_name_full");
        if (!si || si == "") {
            si = "N/A";
        }
        si = si.substring(0,25);
        let network = feature.get("Network");
        let id = feature.get("Site_Id");
        let so = new Selection(id, coord, feature, "<b>" + si + "</b><br>[" + id + "] " + network);
        so.short = id;
        return so;
    }
    
    public static drawBox (e : any) : Selection {
        let extent = e.feature.getGeometry().getExtent();
        // let geom = e.feature.getGeometry();
        // let feat = new ol.Feature({
        //     geometry: geom,
        // });
        //reset the view to the extent of the polygon
        // self.state.map.getView().fit(extent, self.state.map.getSize());
        let coord = new Coord(extent[0].toString(), extent[1].toString(), extent[2].toString(), extent[3].toString());
        let id = "draw" + mapUtils.formatValues(coord);
        let so = new Selection(id, coord, e.feature, mapUtils.formatValues(coord));
        return so;
    }
    
    public static drawPolygon (e : DrawEvent) : Selection {
        let extent = e.feature.getGeometry().getExtent();
        let coord = new Coord(extent[0].toString(), extent[1].toString(), extent[2].toString(), extent[3].toString());
        let id = "drawP" + mapUtils.formatValues(coord);
        let so = new Selection(id, coord, e.feature, 'Polygon');
        so.short = id.replace(/ /g,'');
        return so;
    }
}
