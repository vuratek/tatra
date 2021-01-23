import { Coord } from "./obj/Coord";
import { mapUtils } from "./mapUtils";
import { Selection } from "./obj/Selection";
import { events } from "./events";
import { Layer } from "./obj/Layer";

export class drawUtils {

    public static drawRectangle (lo : Layer, data : Array <Selection>, coord1 : Array <number>, coord2 : Array <number>) {
        let coord = new Coord(coord1[0].toString(), coord1[1].toString(), coord2[0].toString(), coord2[1].toString());
        mapUtils.setPrecision(coord, 1);
        if (data.length == 0) {
            let id = "classic";
            data.push( new Selection(id, coord, lo.addFeature(coord), coord.formatWNES()) );
        } else {
            let so = data[0];
            lo.removeFeature(so.feature);
            so.feature = lo.addFeature(coord);
            so.value = coord;
            so.label = coord.formatWNES();
        }
        events.selectionUpdate(lo.id);
    }
}