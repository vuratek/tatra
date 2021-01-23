import { Measure } from "./_Measure";

export class MeasureDistance extends Measure {
    public type: string = 'LineString';

    public constructor () {
        super('measureDistance');
    }
}