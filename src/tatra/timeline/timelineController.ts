import { MapTime } from "../map/obj/MapTime";
import { utils } from "../utils";
import flatpickr from "flatpickr";

export enum TimelineType {
    SINGLE      = "single",
    RANGE_TIED  = "range_tied",
    RANGE_SUBHOUR_TIED  = "range_subhour_tied",
    RANGE_HOUR_MIN_TIED = "range_hour_min_tied"
}

export enum TimelineAdjustType {
    BACK_RANGE  = "backrange",      // jump entire length of timerange
//    BACK_DAY    = "backday",       // move one day forward
//    FRONT_DAY   = "frontday",
    FRONT_RANGE = "frontrange"
}

export interface ITimelineRanges {
    start   : Date;
    end     : Date;
}
export interface ITimelineProperties {
    scale       : string;
    step        : number;
    editable    : boolean;
    minDate     : Date;
    maxDate     : Date;
    zoomMax     : number;
    zoomMin     : number;
}
export interface ITimelineItem {
    [key : string] : ITimelineRanges;
}

export class timelineController {
    public static readonly EVENT_TIMELINE_UPDATED       : string = "timeline_updated";
    public static readonly EVENT_TIMELINE_LOADED        : string = "timeline_loaded";
    public static readonly EVENT_ADJUST_TIMELINE        : string = "timeline_adjust";
    public static readonly EVENT_REFRESH_TIMELINE_DATE  : string = "timeline_refresh_date";
    public static type                  : TimelineType = TimelineType.SINGLE;
    public static MAX_DAYS              : number = 31;
    public static MAX_MINUTES           : number = 24*60;   // 1 day
    public static time                  : MapTime = new MapTime();
    public static minDate               : Date = utils.getTimelineDateRange()[0];
    public static maxDate               : Date = utils.addDay(utils.sanitizeDate(utils.getTimelineDateRange()[1]));
    public static currentRange          : ITimelineRanges | null = null;
    public static obj                   : ITimelineItem | null = null;

    public static adjustTimelineEvent (type : string) {
        document.dispatchEvent(new CustomEvent(this.EVENT_ADJUST_TIMELINE, {
            detail: {
                type : type
            },
        }));
    }

    public static refreshTimelineDate() {
        document.dispatchEvent(new CustomEvent(this.EVENT_REFRESH_TIMELINE_DATE));
    }

    public static isPartialDate(date:Date) : boolean {
        if (timelineController.type == TimelineType.RANGE_HOUR_MIN_TIED && flatpickr.formatDate(date, 'H:i') != '00:00') return true;
        return false;
    }
    public static refreshMinMaxDates () {
        this.minDate = utils.getTimelineDateRange()[0];
        this.maxDate = utils.addDay(utils.sanitizeDate(utils.getTimelineDateRange()[1]));
    }
}