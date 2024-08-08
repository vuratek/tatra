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
import { timeline } from '../../components/timeline'; 
import { singleDatePicker } from '../../../timeline/singleDatePicker2';
import { mapUtils } from '../../mapUtils';
import { navProps } from '../../../page/navProps';

export class MultiDaySelectorSimple extends Module {

	public calendar         		: any;
	public readonly df              : string = 'M d Y';
	public timelineHandler 			: (evt: Event) => void;
	public timelineBtnHandler 		: (evt: Event) => void;
	private isSingle				: boolean = false;

	public constructor(props : IMenuModule) {
		super(props);
		this.timelineHandler = () => this.timelineUpdate();
		this.timelineBtnHandler = (evt) => this.timelineBtnClick(evt as CustomEvent);	// handle disabled timeline if needed
		if (this.props.options && this.props.options.isSingle === true) {
			this.isSingle = true;
		}
		if (this.props.options && this.props.options.enableVideo) {
			Timeline.allowVideo(this.props.options.enableVideo);
		}
	}

	public render(par : HTMLDivElement) {
		let dates = hash.getDates();
		props.time.rangeMins = 0;
		props.time.range = 0;
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
		document.removeEventListener(events.EVENT_CONTROL_DISABLED, this.timelineBtnHandler);
	}
	public setTimelineController() {
		timelineController.time.imageryDate = props.time.imageryDate;
		timelineController.time.date = props.time.date;
		timelineController.time.range = props.time.range;
		timelineController.time.rangeMins = props.time.rangeMins;
	}
	public render_menu() {

		let el = document.getElementById("mds_content") as HTMLDivElement;
		el.innerHTML = MultiDaySelectorSimple.renderCalendarConent(true, this.isSingle);
		utils.setClick('mdsCalendar', () => this.openCalendar());
		utils.setChange('mdsDateRange', () => this.setDates());
		utils.setSelectValue('mdsDateRange', props.time.range.toString());
		this.initDatePicker(props.time.date);
		this.displayTimeline(true);
		timelineController.refreshTimelineDate();
		document.dispatchEvent(new CustomEvent(events.EVENT_MENU_RESIZE));		
	}
	public static renderCalendarConent(isLarge : boolean, isSingle : boolean) {
		let icon1 = (isLarge) ? `<span id="mdsCalendar" class="mdsCalendar"><i class="fa fa-calendar-alt fa-lg"></i></span>` : '';
		let icon2 = (isLarge && ! isSingle) ? `<span class="mdsCalendar"><i class="fa fa-calendar-minus fa-lg" style="margin-left:1rem;"></i></span>` : '';
		let brk = (isLarge) ? '' : '<br/>';
		let cls = (isLarge) ? '' : 'isSmall';
		let options = (isSingle) ? '' : `<select id="mdsDateRange" class="mdsDateRange">${rangePicker.getRangeOptions()}</select>`;

		return `
			<div id="mdsCalendarContent" class="mdsCalendarContent ${cls}">
				${icon1}
				<input type="text" id="mds_date" readonly>
				${brk}
				${icon2}
				${options}
			</div>
		`;
	}
	public openCalendar() {
		this.calendar.open();
	}

	public displayTimeline(show : boolean) {
		if (show) {
			if (this.isSingle) {
				Timeline.init("timeline", TimelineType.SINGLE);
			} else {
				Timeline.init("timeline", TimelineType.RANGE_TIED);
			}
			controls.enableBtn("timeline");
			controls.setItem("timeline", true);		
			this.setTimelineController();
			if (this.isSingle) {
				singleDatePicker.timelineUpdate();
			} else {
				rangePicker.timelineUpdate();		
			}
		} else {
			timeline.close();
			document.addEventListener(events.EVENT_CONTROL_DISABLED, this.timelineBtnHandler);
			controls.disableBtn("timeline");
		}
	}

	public initDatePicker (d : Date) {
		let option = this;
		if (this.calendar) {
			this.calendar.destroy();
		}
		let [minDate, maxDate] = utils.getTimelineDateRange();
        this.calendar = flatpickr("#mds_date", {
            dateFormat : this.df,
            defaultDate : d,
            minDate : minDate,
            maxDate : maxDate,
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
//		props.time.imageryDate = this.calendar.selectedDates[0];
		props.time.rangeMins = 0;
		props.time.quickTime = 0;
		this.setTimelineController();
		timelineController.refreshTimelineDate();
		events.dispatch(events.EVENT_SYSTEM_DATE_UPDATE);

        //this.updateHash();
        //this.checkBAYearMismatch();
    }

	public activate () {
		super.activate();
		document.addEventListener(timelineController.EVENT_TIMELINE_UPDATED, this.timelineHandler);
	}

	public timelineUpdate () {
		let obj = timelineController.obj;
		if (! obj || (!obj["range"] && !this.isSingle)) { return; }
		let pastImageryDate = props.time.imageryDate;
        //props.time.imageryDate = utils.sanitizeDate(obj["single"].start, false);
        props.time.imageryDate = obj["single"].start;
//		props.time.imageryDate = utils.sanitizeDate(obj["single"].start, false);
		
		if (this.isSingle) {
			props.time.date = props.time.imageryDate;
			props.time.range = 0;

		} else {
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
			if (!_refresh) {
	//            return;
			}
		}
//		this.refreshLayers();
		hashHandler.setDateTime();
		events.dispatch(events.EVENT_SYSTEM_DATE_UPDATE);
		this.updateInfoLabel();

	}

	public updateInfoLabel() {
		mapUtils.setInfoDate(flatpickr.formatDate(props.time.date, 'Y-m-d'));
		let prefix = (props.showLabelPrefix && navProps.settings.app.applicationLabel) ? navProps.settings.app.applicationLabel + ': ' : '';
		let str = flatpickr.formatDate(props.time.date, 'Y-m-d');
		let range = ` (${utils.getSelectText('mdsDateRange')})`; 
		mapUtils.setInfoLabel((prefix + str + range).toUpperCase(), (prefix + str + range).toUpperCase());
	}

	public timelineBtnClick (evt : CustomEvent) {}
}