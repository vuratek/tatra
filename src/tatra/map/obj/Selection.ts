import {Feature} from 'ol';
import { Coord } from './Coord';

export class Selection {
    public id           : string;
    public value        : Coord;
    public feature      : Feature;
    public label        : string;
    public short        : string = "";
    public valid        : boolean = true;			// set to false when feature is unknown - ex. pre-populate values before the layer is loaded

    public constructor (id : string, value : Coord, feature : Feature, label : string) {
        this.id = id;
        this.value = value;
        this.feature = feature;
        this.label = label;
    }

}