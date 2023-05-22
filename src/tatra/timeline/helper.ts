import {ITimelineProperties, TimelineType, Timeline, ITimelineRanges} from "./Timeline";
import flatpickr from 'flatpickr';

export class helper {

    private static currentZoomMaxLevel  : number = 30;
    private static currentZoomMinLevel  : number = 30;

    public static getTimeLineProperties():ITimelineProperties {
        this.setZoomLevel();
        let scale = 'day';
        let step = 1;
        let editable = true;
        if (Timeline.type == TimelineType.RANGE_HOUR_MIN_TIED || Timeline.type == TimelineType.RANGE_SUBHOUR_TIED) {
            scale = 'hour';
            step = 1;
            editable = (Timeline.type == TimelineType.RANGE_SUBHOUR_TIED) ? true : false;
        }
        let zoomMax = (1000 * 60 * 60 * 24 * this.currentZoomMaxLevel);
        let zoomMin = (1000 * 60 * 60 * 24 * this.currentZoomMinLevel);
        let minDate = Timeline.minDate;
        let maxDate = Timeline.maxDate;
        return {
            scale:      scale,
            step:       step,
            editable:   editable,
            zoomMax:    zoomMax,
            zoomMin:    zoomMin,
            minDate:    minDate,
            maxDate:    maxDate
        };
    }

    private static setZoomLevel () {
        let w = window.innerWidth;
        if (Timeline.type == TimelineType.RANGE_HOUR_MIN_TIED || Timeline.type == TimelineType.RANGE_SUBHOUR_TIED) {
            if (w < 700) { 
                this.currentZoomMinLevel = 1; 
                this.currentZoomMaxLevel = 1; 
            }
            else if (w < 900) { 
                this.currentZoomMinLevel = 1; 
                this.currentZoomMaxLevel = 1; 
            }
            else if ( w < 1200) { 
                this.currentZoomMinLevel = 1;
                this.currentZoomMaxLevel = 1;
            }
            else { 
                this.currentZoomMinLevel = 1; 
                this.currentZoomMaxLevel = 1; 
            }
        } else {
            if (w < 700) { 
                this.currentZoomMinLevel = 10; 
                this.currentZoomMaxLevel = 10; 
            }
            else if (w < 900) { 
                this.currentZoomMinLevel = 10; 
                this.currentZoomMaxLevel = 20; 
            }
            else if ( w < 1200) { 
                this.currentZoomMinLevel = 20;
                this.currentZoomMaxLevel = 30;
            }
            else { 
                this.currentZoomMinLevel = 30; 
                this.currentZoomMaxLevel = 50; 
            }
        }
    }

    public static eventTimelineUpdate () {
        document.dispatchEvent(new CustomEvent(Timeline.EVENT_TIMELINE_UPDATED));
    }

    public static isDiff(first : ITimelineRanges, second : ITimelineRanges ):boolean {
        if (flatpickr.formatDate(first.start, 'Y-m-d H:i') != flatpickr.formatDate(second.start, 'Y-m-d H:i')) return true;
        if (flatpickr.formatDate(first.end, 'Y-m-d H:i') != flatpickr.formatDate(second.end, 'Y-m-d H:i')) return true;
        return false;
    }
}