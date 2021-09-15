import { utils } from "../utils";
import { Timeline, TimelineAdjustType, TimelineType } from "./Timeline";
import { flatpickr } from "../aux/flatpickr";
import { Instance } from "flatpickr/dist/types/instance";
import LRUCache from "ol/structs/LRUCache";

export class basePicker {

    public static id                : string = '';
    public static timelineHandler   : (evt: Event) => void;
    public static isSingle          : boolean = true;
    public static calendar          : Instance;

    public static render (id: string) {

        let div = document.getElementById(id) as HTMLDivElement;
        if (! div) { return; }

        this.timelineHandler = () => this.timelineUpdate ();
        document.addEventListener(Timeline.EVENT_TIMELINE_UPDATED, this.timelineHandler);

        this.id = id;
        let cont = document.createElement("div");
        cont.setAttribute("class", "timelineRangePicker")
        cont.setAttribute("id", id + 'RP');
        div.appendChild(cont);

        let str = `<input type="text" id="${id}_date" readonly><br>`;
        if (! this.isSingle) {
            str += `<span id="${id}_${TimelineAdjustType.BACK_RANGE}" class="timelineCtrlBtn"><i class="fa fa-fast-backward fa-lg"></i></span>`;
        }
        str += `
            <span id="${id}_${TimelineAdjustType.BACK_DAY}" class="timelineCtrlBtn"><i class="fa fa-step-backward fa-lg"></i></span>
        `;
        if (! this.isSingle) {
            str += `               
                <select id="${id}_DR">
                    ${this.getRangeOptions()}
                </select>
            `;
        }
            str += `<span id="${id}_${TimelineAdjustType.FRONT_DAY}" class="timelineCtrlBtn"><i class="fa fa-step-forward fa-lg"></i></span>`;
        if (! this.isSingle) {
            str += `<span id="${id}_${TimelineAdjustType.FRONT_RANGE}" class="timelineCtrlBtn"><i class="fa fa-fast-forward fa-lg"></i></span>`;
        }
            
        cont.innerHTML = str;

        utils.setClick(`${id}_${TimelineAdjustType.BACK_DAY}`, () => Timeline.adjustTimeline(TimelineAdjustType.BACK_DAY));
        utils.setClick(`${id}_${TimelineAdjustType.FRONT_DAY}`, () => Timeline.adjustTimeline(TimelineAdjustType.FRONT_DAY));

        if (! this.isSingle) {
            utils.setClick(`${id}_${TimelineAdjustType.BACK_RANGE}`, () => Timeline.adjustTimeline(TimelineAdjustType.BACK_RANGE));
            utils.setClick(`${id}_${TimelineAdjustType.FRONT_RANGE}`, () => Timeline.adjustTimeline(TimelineAdjustType.FRONT_RANGE));
            utils.setChange(`${id}_DR`, () => this.setDates());
        }

//        utils.setClick(`${id}_date`, () => this.openCalendar());

        this.initDatePicker(utils.getGMTTime(new Date()));
        this.timelineUpdate();
    }

    public static initDatePicker (d : Date) {
        if (this.calendar) {
            this.calendar.destroy();
        }
        let handler = () => this.setDates();
        let format = (Timeline.getTimelineType() == TimelineType.RANGE_HOUR_MIN_TIED) ? 'M d Y H:i' : 'M d Y';
        this.calendar = flatpickr(`#${this.id}_date`, {
            enableTime: true,
            dateFormat : format,
            defaultDate : d,
            minDate : new Date(2000,11-1, 11),
            maxDate : utils.getGMTTime(new Date()),
            onChange : handler
        }) as Instance;
    }

    public static setDates () {
        if (this.calendar) {
            Timeline.setDate(this.calendar.selectedDates[0], Number(utils.getSelectValue(`${this.id}_DR`)));
        }
    }

    public static getRangeOptions() : string {
        let select = '';
        for (let i=0; i<= Timeline.MAX_DAYS -1; i++) {
            let label = `${i+1} days`;
            if (i == 0) { label = '1 day'; }
            else if (i == 6) { label = 'WEEK'; }
            else if (i == 13) { label = '2 WEEKS'; }            
            else if (i == 20) { label = '3 WEEKS'; }            
            else if (i == 27) { label = '4 WEEKS'; }            
            select += `<option value="${i}">${label}</option>`;
        }
        return select;
    }

    public static timelineUpdate() {
        let obj = Timeline.getDates();
        utils.setSelectValue(`${this.id}_DR`, Timeline.advancedRange.toString());
//        $(`#${this.id}_DR`).val(Timeline.advancedRange);
        if (obj && this.calendar) {
            let type = (this.isSingle) ? 'single' : 'range';
            if (Timeline.getTimelineType() == TimelineType.RANGE_HOUR_MIN_TIED) {
                this.calendar.setDate(obj['single'].start);
            } else {
                this.calendar.setDate(utils.addDay(obj[type].end,-1));
            }
        }
        this.setCtrlBtns();
    }

    public static openCalendar() {
        this.calendar.open();
    }

    public static setCtrlBtns () {
        //timelineCtrlBtnDisabled
        let range = Timeline.getCurrentRange();
        if (! range) { return; }
        let max1 = utils.addDay(range.end);
        let max2 = utils.addDay(range.end, Timeline.advancedRange + 1);
        let min1 = utils.addDay(range.start, -1);
        let min2 = utils.addDay(range.start, - Timeline.advancedRange - 1);
        if (max1 > Timeline.maxDate) { this.setBtn(TimelineAdjustType.FRONT_DAY, true);} 
        else { this.setBtn(TimelineAdjustType.FRONT_DAY, false); }
        if (min1 < Timeline.minDate) { this.setBtn(TimelineAdjustType.BACK_DAY, true);} 
        else { this.setBtn(TimelineAdjustType.BACK_DAY, false); }
        if (!this.isSingle) {
            if (max2 > Timeline.maxDate) { this.setBtn(TimelineAdjustType.FRONT_RANGE, true); } 
            else { this.setBtn(TimelineAdjustType.FRONT_RANGE, false); }
            if (min2 < Timeline.minDate) { this.setBtn(TimelineAdjustType.BACK_RANGE, true); } 
            else { this.setBtn(TimelineAdjustType.BACK_RANGE, false); }
        }

    }

    private static setBtn (type: string, disabled : boolean) {
        if (disabled) {
            utils.addClass(`${this.id}_${type}`,'timelineCtrlBtnDisabled');
        } else {
            utils.removeClass(`${this.id}_${type}`,'timelineCtrlBtnDisabled');
        }
    }

    public static delete() {
        document.removeEventListener(Timeline.EVENT_TIMELINE_UPDATED, this.timelineHandler);
    }
}