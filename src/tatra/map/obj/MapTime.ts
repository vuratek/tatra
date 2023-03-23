import { utils } from '../../utils';

export class MapTime {
    public date : Date;                                 // keep track of timeline date; either start or end date, used along with range
    public imageryDate : Date;
    public range : number  = 0;                         // range of days used in timeline. Value '0' indicates one day
    public rangeMins : number = 0;                      // if timeline uses time, this is minute range
    public quickTime : number = 0;                     // 0 - invalid, 1 - 1 today, 24  - 24 hours; 168 - 7 days;

    public constructor() {
        this.date = utils.getGMTTime(new Date());
        this.imageryDate = utils.getGMTTime(new Date()); 
    }
}