import { utils } from "../utils";
import { Timeline, TimelineAdjustType, TimelineType } from "./Timeline";
import { flatpickr } from "../aux/flatpickr";
import { Instance } from "flatpickr/dist/types/instance";

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
        str += `
            <span id="${id}_${TimelineAdjustType.BACK_RANGE}" class="timelineCtrlBtn"><i class="fa fa-step-backward fa-lg"></i></span>
        `;
        if (! this.isSingle) {
            str += `               
                <select id="${id}_DR">
                </select>
            `;
        }
        str += `<span id="${id}_${TimelineAdjustType.FRONT_RANGE}" class="timelineCtrlBtn"><i class="fa fa-step-forward fa-lg"></i></span>`;
            
        cont.innerHTML = str;

        this.setRangeSelect();

        utils.setClick(`${id}_${TimelineAdjustType.BACK_RANGE}`, () => Timeline.adjustTimeline(TimelineAdjustType.BACK_RANGE));
        utils.setClick(`${id}_${TimelineAdjustType.FRONT_RANGE}`, () => Timeline.adjustTimeline(TimelineAdjustType.FRONT_RANGE));

        if (! this.isSingle) {
  //          utils.setClick(`${id}_${TimelineAdjustType.BACK_RANGE}`, () => Timeline.adjustTimeline(TimelineAdjustType.BACK_RANGE));
//            utils.setClick(`${id}_${TimelineAdjustType.FRONT_RANGE}`, () => Timeline.adjustTimeline(TimelineAdjustType.FRONT_RANGE));
            utils.setChange(`${id}_DR`, () => this.setDates());
        }

//        utils.setClick(`${id}_date`, () => this.openCalendar());
        this.initDatePicker(utils.getGMTTime(new Date()));
        this.timelineUpdate();
    }

    public static setRangeSelect() {
        let id = `${this.id}_DR`
        let select = document.getElementById(id);
        if (! select) { return; }
        if (Timeline.type == TimelineType.RANGE_SUBHOUR_TIED) {
            select.innerHTML = this.getSubdailyRangeOptions(Timeline.advancedMinuteRange);
            console.log(">>>", id, 'm' + Timeline.advancedMinuteRange.toString());
            utils.setSelectValue(id, 'm' + Timeline.advancedMinuteRange.toString());
        } else {
            select.innerHTML = this.getRangeOptions();
            utils.setSelectValue(id, Timeline.advancedRange.toString());
        }
    }

    public static initDatePicker (d : Date) {
        if (this.calendar) {
            this.calendar.destroy();
        }
        let handler = () => this.setDates();
        let format = (Timeline.getTimelineType() == TimelineType.RANGE_HOUR_MIN_TIED || Timeline.getTimelineType() == TimelineType.RANGE_SUBHOUR_TIED) ? 'M d Y H:i' : 'M d Y';
        let hasTime = (Timeline.getTimelineType() == TimelineType.RANGE_HOUR_MIN_TIED || Timeline.getTimelineType() == TimelineType.RANGE_SUBHOUR_TIED) ? true : false;
        this.calendar = flatpickr(`#${this.id}_date`, {
            enableTime: hasTime,
            dateFormat : format,
            defaultDate : d,
            minDate : new Date(2000,11-1, 11),
            maxDate : utils.getGMTTime(new Date()),
            onChange : handler
        }) as Instance;
    }

    public static setDates () {
        if (this.calendar) {
            let opt = utils.getSelectValue(`${this.id}_DR`);
            if (opt[0] == 'm') {
                opt = opt.replace('m', '');
                Timeline.setDate(this.calendar.selectedDates[0], 0, Number(opt));
            } else {
                Timeline.setDate(this.calendar.selectedDates[0], Number(utils.getSelectValue(`${this.id}_DR`)));
            }
        }
    }
    public static getSubdailyRangeOptions(_custom:number | null = null) : string {
        let options = [10,20,30,40,50,60,120,180,240,360,480,600,720,1080,1440];
        let select = '';
        let custom = _custom;
        for (let i=0; i<options.length; i++) {
            if (custom) {
                if (custom < options[i]) {
                    select += `<option value="m${custom.toString()}">${utils.getMinHourValue(custom)}</option>`;
                    custom = null;
                } else if (custom == options[i]) {
                    custom = null;
                }
            }
            select += `<option value="m${options[i].toString()}">${utils.getMinHourValue(options[i])}</option>`;
        }
        return select;
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
        let range = (Timeline.type == TimelineType.RANGE_SUBHOUR_TIED) ? 'm' + Timeline.advancedMinuteRange.toString() : Timeline.advancedRange.toString();
        utils.setSelectValue(`${this.id}_DR`, range);
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
        let max2 = utils.addDay(range.end, Timeline.advancedRange + 1);
        let min2 = utils.addDay(range.start, - Timeline.advancedRange - 1);
        if (max2 > Timeline.maxDate) { this.setBtn(TimelineAdjustType.FRONT_RANGE, true); } 
        else { this.setBtn(TimelineAdjustType.FRONT_RANGE, false); }
        if (min2 < Timeline.minDate) { this.setBtn(TimelineAdjustType.BACK_RANGE, true); } 
        else { this.setBtn(TimelineAdjustType.BACK_RANGE, false); }

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