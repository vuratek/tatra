import { utils } from "../utils";
import { flatpickr } from "../aux/flatpickr";
import { Instance } from "flatpickr/dist/types/instance";
import { timelineController, TimelineAdjustType, TimelineType } from "./timelineController";

export class basePicker {

    public static id                : string = '';
    public static timelineHandler   : (evt: Event) => void;
    public static isSingle          : boolean = true;
    public static calendar          : Instance;

    public static render (id: string) {

        let div = document.getElementById(id) as HTMLDivElement;
        if (! div) { return; }

        this.timelineHandler = () => this.timelineUpdate ();
        document.addEventListener(timelineController.EVENT_TIMELINE_UPDATED, this.timelineHandler);

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

        utils.setClick(`${id}_${TimelineAdjustType.BACK_RANGE}`, () => timelineController.adjustTimelineEvent(TimelineAdjustType.BACK_RANGE));
        utils.setClick(`${id}_${TimelineAdjustType.FRONT_RANGE}`, () => timelineController.adjustTimelineEvent(TimelineAdjustType.FRONT_RANGE));

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
        console.log("setRangeSelect", timelineController.type);
        let select = document.getElementById(id);
        if (! select) { return; }
        if (timelineController.type== TimelineType.RANGE_SUBHOUR_TIED) {
            select.innerHTML = this.getSubdailyRangeOptions(timelineController.time.rangeMins);
            console.log(">>>", id, 'm' + timelineController.time.rangeMins.toString());
            utils.setSelectValue(id, 'm' + timelineController.time.rangeMins.toString());
        } else {
            select.innerHTML = this.getRangeOptions();
            utils.setSelectValue(id, timelineController.time.range.toString());
        }
    }

    public static initDatePicker (d : Date) {
        if (this.calendar) {
            this.calendar.destroy();
        }
        let handler = () => this.setDates();
        let format = (timelineController.type == TimelineType.RANGE_HOUR_MIN_TIED || timelineController.type == TimelineType.RANGE_SUBHOUR_TIED) ? 'M d Y H:i' : 'M d Y';
        let hasTime = (timelineController.type == TimelineType.RANGE_HOUR_MIN_TIED || timelineController.type == TimelineType.RANGE_SUBHOUR_TIED) ? true : false;
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
            let rangeMins = 0;
            let rangeDays = 0;
            if (opt[0] == 'm') {
                rangeMins = Number(opt.replace('m', '')); 
            } else {
                rangeDays = Number(utils.getSelectValue(`${this.id}_DR`));
            }
            timelineController.time.range = rangeDays;
            timelineController.time.rangeMins = rangeMins;
            timelineController.time.date = this.calendar.selectedDates[0];
            timelineController.refreshTimelineDate();
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
        for (let i=0; i<= timelineController.MAX_DAYS -1; i++) {
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
        let range = (timelineController.type== TimelineType.RANGE_SUBHOUR_TIED) ? 'm' + timelineController.time.rangeMins.toString() : timelineController.time.range.toString();
        utils.setSelectValue(`${this.id}_DR`, range);
//        $(`#${this.id}_DR`).val(timelineController.time.range);
        if (timelineController.obj && this.calendar) {
            let type = (this.isSingle) ? 'single' : 'range';
            if (timelineController.type == TimelineType.RANGE_HOUR_MIN_TIED) {
                this.calendar.setDate(timelineController.obj['single'].start);
                console.log('setting', timelineController.obj['single'].start);
            } else {
                console.log('setting2', utils.addDay(timelineController.obj[type].end,-1));
                this.calendar.setDate(utils.addDay(timelineController.obj[type].end,-1));
            }
        }
        this.setCtrlBtns();
    }

    public static openCalendar() {
        this.calendar.open();
    }

    public static setCtrlBtns () {
        //timelineCtrlBtnDisabled
        let range = timelineController.currentRange;
        if (! range) { return; }
        let max2 = utils.addDay(range.end, timelineController.time.range + 1);
        let min2 = utils.addDay(range.start, - timelineController.time.range - 1);
        if (max2 > timelineController.maxDate) { this.setBtn(TimelineAdjustType.FRONT_RANGE, true); } 
        else { this.setBtn(TimelineAdjustType.FRONT_RANGE, false); }
        if (min2 < timelineController.minDate) { this.setBtn(TimelineAdjustType.BACK_RANGE, true); } 
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
        document.removeEventListener(timelineController.EVENT_TIMELINE_UPDATED, this.timelineHandler);
    }
}