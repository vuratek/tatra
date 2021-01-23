import { Measure } from "./_Measure";

export class MeasureArea extends Measure {
    public type: string = 'Polygon';

    public constructor () {
        super('measureArea');
    }
}