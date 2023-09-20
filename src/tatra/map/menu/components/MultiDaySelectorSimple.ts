import '../css/multiDaySelector.scss';
import { Module } from "./Module";
import { utils } from "../../../utils";
import { controls } from "../../components/controls";
import { props } from '../../props';
import flatpickr from 'flatpickr';
import { Timeline } from '../../../timeline/Timeline2';
import { rangePicker } from "../../../timeline/rangePicker2"; 
import { events } from '../../events';
import { IMenuModule } from '../../defs/ConfigDef';
import { hash, IHashDates } from '../../hash';
import { hashHandler } from '../hashHandler';
import { TimelineType, timelineController } from '../../../timeline/timelineController';

export class MultiDaySelectorSimple extends Module {

	public calendar         		: any;
	public readonly df              : string = 'M d Y';
	public timelineHandler 		: (evt: Event) => void;

	public constructor(props : IMenuModule) {
		super(props);
		this.timelineHandler = () => this.timelineUpdate();
	}

	public render(par : HTMLDivElement) {
		let dates = hash.getDates();
		props.time.rangeMins = 0;
		props.time.range = 1;
//		this.previousBtn = BasicMenuDateValues.HRS_24;

		if (dates) {
			hashHandler.processDateTime(dates);		
		}
		super.render(par);
		Timeline.delete();
		let el = document.getElementById(`mmm_${this.props.id}`) as HTMLDivElement;
		let th = document.createElement("div");
		th.setAttribute("class", "mds");
		el.appendChild(th);
		th.innerHTML = `
			<div id="mds_content" class="mds_content">
			</div>
		`;
		this.render_menu();
	}

	public deactivate() {
		super.deactivate();
		Timeline.delete();
		document.removeEventListener(timelineController.EVENT_TIMELINE_UPDATED, this.timelineHandler);
	}
	public setTimelineController() {
		timelineController.time.imageryDate = props.time.imageryDate;
		timelineController.time.date = props.time.imageryDate;
		timelineController.time.range = props.time.range;
		timelineController.time.rangeMins = props.time.rangeMins;

	}
	public render_menu() {
		Timeline.init("timeline", TimelineType.RANGE_TIED);
        controls.enableBtn("timeline");
		controls.setItem("timeline", true);		
		this.setTimelineController();

		let el = document.getElementById("mds_content") as HTMLDivElement;
		el.innerHTML = MultiDaySelectorSimple.renderCalendarConent();
		utils.setClick('mdsCalendar', () => this.openCalendar());
		utils.setChange('mdsDateRange', () => this.setDates());
		utils.setSelectValue('mdsDateRange', props.time.range.toString());
		this.initDatePicker(props.time.date);
		rangePicker.timelineUpdate();		
		document.dispatchEvent(new CustomEvent(events.EVENT_MENU_RESIZE));
	}
	public static renderCalendarConent() {
		return `
			<div id="mdsCalendarContent" class="mdsCalendarContent">
				<span id="mdsCalendar" class="mdsCalendar">
					<i class="fa fa-calendar-alt fa-lg"></i>
				</span>
				<input type="text" id="mds_date" readonly>
				<span class="mdsCalendar">
					<i class="fa fa-calendar-minus fa-lg" style="margin-left:1rem;"></i>
				</span>
				<select id="mdsDateRange" class="mdsDateRange">
					${rangePicker.getRangeOptions()}
				</select>
			</div>
		`;
	}
	public openCalendar() {
		this.calendar.open();
	}

	public initDatePicker (d : Date) {
		let option = this;
		if (this.calendar) {
			this.calendar.destroy();
		}
        this.calendar = flatpickr("#mds_date", {
            dateFormat : this.df,
            defaultDate : d,
            minDate : new Date(2000,11-1, 11),
            maxDate : utils.getGMTTime(new Date()),
            onChange : function () {
                option.setDates();
            }
        }) as Instance;
        this.calendar.selectedDates.push(d);
        this.setDates();
	}
	public setDates () {
		props.time.date = this.calendar.selectedDates[0];
		props.time.range = Number(utils.getSelectValue(`mdsDateRange`));
		props.time.quickTime = 0;
		//console.log("SETTING", props.time.date, props.time.range);
		timelineController.time.range = props.time.range;
		timelineController.time.rangeMins = 0;
		timelineController.time.date = props.time.date;
		timelineController.refreshTimelineDate();

        //this.updateHash();
        //this.checkBAYearMismatch();
    }

	public activate () {
		super.activate();
		document.addEventListener(timelineController.EVENT_TIMELINE_UPDATED, this.timelineHandler);
	}

	public timelineUpdate () {
        let obj = timelineController.obj;
		if (! obj || !obj["range"]) { return; }
		props.time.imageryDate = utils.sanitizeDate(obj["single"].start, false);
		
        if (timelineController.isPartialDate(obj["range"].end)) {
            this.calendar.setDate(utils.sanitizeDate(obj["range"].end));
        } else {
            this.calendar.setDate(utils.addDay(obj["range"].end,-1));
        }
        utils.setSelectValue('mdsDateRange', timelineController.time.range.toString());
        let _dt = utils.addDay(obj["range"].end,-1);
		let _range = timelineController.time.range;
        let _refresh = false;
        if (flatpickr.formatDate(_dt, 'Y-m-d') != flatpickr.formatDate(props.time.date, 'Y-m-d')) {
            _refresh = true;
            props.time.date = _dt;
        }
        if (_range != props.time.range) {
            _refresh = true;
            props.time.range = _range;
		}
/*		if (!_refresh) {
            return;
        }
		this.refreshLayers();*/
		hashHandler.setDateTime();
		events.dispatch(events.EVENT_SYSTEM_DATE_UPDATE);
	}
}