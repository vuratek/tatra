import { utils } from "../../../utils";
import { controls } from "../../components/controls";
import { props } from '../../props';
import { events } from '../../events';
import { hash } from '../../hash';
import { hashHandler } from '../hashHandler';
import { time_info, tio } from "../features/time_info";
import { MultiDaySelectorSimple } from "./MultiDaySelectorSimple";
import { BasicMenuDates, BasicMenuDateValues } from "../../defs/Times";
import { timelineController } from "../../../timeline/timelineController";
import { mapUtils } from "../../mapUtils";
import { navProps } from "../../../page/navProps";
import flatpickr from "flatpickr";

export class MultiDaySelector extends MultiDaySelectorSimple {
	public currentSelection			: BasicMenuDates = BasicMenuDates.CUSTOM;

	public render(par : HTMLDivElement) {;
		super.render(par);
//		if (this.props.descriptionText) {
//			bookmark.setDescriptionText(this.props.descriptionText);
//		}
//		controls.createControlItem('bookmark', bookmark);
		controls.createControlItem('time_info', time_info);

	}
	public render_menu() {
		// check for preset URL hash values
		let dates = hash.getDates();
		let type : BasicMenuDates | null = null;
		if (dates) {
			if (dates.start == 'today') {
				type = BasicMenuDates.TODAY;
			} else if (dates.start == '24hrs') {
				type = BasicMenuDates.HRS_24;
			} else {
				type = BasicMenuDates.CUSTOM;
			} 
		}

		let el = document.getElementById("mds_content") as HTMLDivElement;
		el.innerHTML = this.renderMenu();
		utils.setClick(`${this.props.id}_mds_btn_${BasicMenuDates.TODAY}`, () => this.setTab(BasicMenuDates.TODAY));
		utils.setClick(`${this.props.id}_mds_btn_${BasicMenuDates.HRS_24}`, () => this.setTab(BasicMenuDates.HRS_24));
		utils.setClick(`${this.props.id}_mds_btn_${BasicMenuDates.DAY_7}`, () => this.setTab(BasicMenuDates.DAY_7));
		utils.setClick(`${this.props.id}_mds_btn_${BasicMenuDates.CUSTOM}`, () => this.openCustomTab());
//		utils.setClick(`${this.props.id}_mds_btn_bookmark`, () => this.bookmark());

		utils.setClick('mdsCalendar', () => this.openCalendar());
		utils.setChange('mdsDateRange', () => this.setDates());
		utils.setSelectValue('mdsDateRange', props.time.range.toString());
		this.initDatePicker(props.time.date);
		
		this.setTab(type);
		this.setTimelineController();
		timelineController.refreshTimelineDate();
		document.dispatchEvent(new CustomEvent(events.EVENT_MENU_RESIZE));
		time_info.setDisplayOptions([tio.TODAY, tio.DAY2, tio.DAY7]);

	}
	private openCustomTab () {
		this.setTab(BasicMenuDates.CUSTOM);
		this.openCalendar();
	}
	public renderMenu () : string {
		let cal = MultiDaySelectorSimple.renderCalendarConent(false, false);
		return `
			<div id="${this.props.id}_mds_btn_${BasicMenuDates.TODAY}" class="mds_time_btn">
				<div>${BasicMenuDates.TODAY}</div>
			</div> 
			<div id="${this.props.id}_mds_btn_${BasicMenuDates.HRS_24}" class="mds_time_btn">
				<div>${BasicMenuDates.HRS_24}</div>
			</div> 
			<div id="${this.props.id}_mds_btn_${BasicMenuDates.DAY_7}" class="mds_time_btn">
				<div>${BasicMenuDates.DAY_7}</div>
			</div> 
			<div id="${this.props.id}_mds_btn_${BasicMenuDates.CUSTOM}" class="mds_time_btn">
				<div><span><i class="fa fa-calendar-alt fa-lg"></i></span></div>
			</div> 
			<div id="mdsTimePeriodStatement"></div>
			${cal}
		`;
		/*
					<div id="${this.props.id}_mds_btn_bookmark" class="mds_bookmark_btn">
				<i class="far fa-bookmark" aria-hidden="true"></i>
			</div>
			*/
	}
	private setTab(tab : BasicMenuDates | null) {
		if (tab && this.currentSelection == tab) {
			return;
		}
		let previousSelection = this.currentSelection;
		this.currentSelection = (tab) ? tab : BasicMenuDates.HRS_24;
		let range = 1;
		if (this.currentSelection == BasicMenuDates.TODAY) {
			range = 0;
		} else if (this.currentSelection == BasicMenuDates.DAY_7) {
			range = 6;
			props.time.imageryDate = utils.addDay(utils.getGMTTime(new Date()), -1);
		}
		if (previousSelection == BasicMenuDates.HRS_24 && this.currentSelection ==  BasicMenuDates.CUSTOM) {
			range = 0;
		}
		if ((this.currentSelection != BasicMenuDates.CUSTOM) || (previousSelection == BasicMenuDates.HRS_24 && this.currentSelection == BasicMenuDates.CUSTOM)) {
			let date = utils.sanitizeDate(utils.getGMTTime(new Date()));
			this.calendar.setDate(date);
			utils.setSelectValue(`mdsDateRange`, range.toString());
		}
		this.setDates(); 
		events.menuOpen(`module-mds-${this.currentSelection}`);
	}
//	private bookmark() {
//		controls.activateControlItem('bookmark');
//	}
	public setDates() {
		super.setDates();
		this.setQuickLinks();
	}
	private setQuickLinks() {
        let dt = utils.sanitizeDate(utils.getGMTTime(new Date()));
        let links = [BasicMenuDates.TODAY, BasicMenuDates.HRS_24, BasicMenuDates.DAY_7, BasicMenuDates.CUSTOM];
        for (let i=0; i<links.length;i++) {
            utils.removeClass(`${this.props.id}_mds_btn_${links[i]}`, 'mmTimeBtnSelected');            
		}
		props.time.quickTime == 0;
		let showCalendar = true;
		hashHandler.allowAbbreviatedDates = true;
		
		if (this.currentSelection != BasicMenuDates.CUSTOM) {
            if (props.time.range == 0) {
				props.time.quickTime == BasicMenuDateValues.TODAY;
				props.time.imageryDate = utils.getGMTTime(new Date());
//				timelineController.time.imageryDate = props.time.imageryDate;
				showCalendar = false;
            } else if (props.time.range == 1) {
				props.time.quickTime == BasicMenuDateValues.HRS_24;
				props.time.imageryDate = utils.addDay(utils.getGMTTime(new Date()), -1);
//				timelineController.time.imageryDate = props.time.imageryDate;
				showCalendar = false;
			} else if (props.time.range == 6) {
				props.time.quickTime == BasicMenuDateValues.DAY_7;
				props.time.imageryDate = utils.addDay(utils.getGMTTime(new Date()), -1);
//				timelineController.time.imageryDate = props.time.imageryDate;
			} else {
				this.currentSelection = BasicMenuDates.CUSTOM;
			}
        } else {
			this.currentSelection = BasicMenuDates.CUSTOM;
		}
		if (this.currentSelection == BasicMenuDates.CUSTOM) {
			hashHandler.allowAbbreviatedDates = false;
		}
		utils.addClass(`${this.props.id}_mds_btn_${this.currentSelection}`, 'mmTimeBtnSelected');
		if (showCalendar) {
			utils.show('mdsCalendarContent');
		} else {
			utils.hide('mdsCalendarContent');
		}
		this.setTimeInfoLabel();
		hashHandler.setDateTime();
		let show = (this.currentSelection == BasicMenuDates.CUSTOM || this.currentSelection == BasicMenuDates.DAY_7) ? true : false;
		this.displayTimeline(show);
		events.dispatch(events.EVENT_SYSTEM_DATE_UPDATE);
	}
	private setTimeInfoLabel () {
		if (this.currentSelection != BasicMenuDates.HRS_24 && this.currentSelection != BasicMenuDates.TODAY) {
			utils.hide('mdsTimePeriodStatement');
			return;
		}
		let txt = (props.time.quickTime == 1)  ? BasicMenuDates.TODAY : BasicMenuDates.HRS_24;
		let label = `<span class="mds_btn_timeInfoTitle">${txt}</span><br/>`;
		label += (props.time.quickTime == 1) ? "From [Today 00:00:00 UTC] to present" : "From [Yesterday 00:00:00 UTC] to present";
		label += `<span id="mds_btn_timeInfo"> <i class="fa fa-info-circle" aria-hidden="true"></i></span>`;
//        label += '<br><a target="_blank" rel="noopener" href="https://greenwichmeantime.com/uk/time/">Current Date/Time in UTC</a>';
        let el = document.getElementById('mdsTimePeriodStatement');
        if (el) {
			el.innerHTML = label;
			utils.setClick('mdsTimePeriodStatement', () => this.displayTimeInfoDetail());
		}
		utils.showCustom('mdsTimePeriodStatement','inline-block');
	}
	private displayTimeInfoDetail() {
		controls.activateControlItem('time_info');
        time_info.open();
	}
	public timelineUpdate () {
		super.timelineUpdate();
		if (this.currentSelection == BasicMenuDates.DAY_7 
			&& (flatpickr.formatDate(props.time.date, 'Y-m-d') != flatpickr.formatDate(utils.getGMTTime(new Date()), 'Y-m-d') ||
			(flatpickr.formatDate(props.time.imageryDate, 'Y-m-d') != flatpickr.formatDate(utils.addDay(utils.getGMTTime(new Date()), -1), 'Y-m-d')))) {
			this.setTab(BasicMenuDates.CUSTOM);
		} else {
			this.setQuickLinks();
		}
	}
	public timelineBtnClick (evt : CustomEvent) {
		if (evt.detail.id == "timeline") {
			if (this.currentSelection != BasicMenuDates.CUSTOM) {
				this.setTab(BasicMenuDates.CUSTOM);
			}
		}
	}
	
	public updateInfoLabel() {
		super.updateInfoLabel();

		let prefix = (props.showLabelPrefix && navProps.settings.app.applicationLabel) ? navProps.settings.app.applicationLabel + ': ' : '';
		let dates = '';
		if (this.currentSelection !=  BasicMenuDates.CUSTOM && this.currentSelection!= BasicMenuDates.DAY_7) {
			dates = this.currentSelection;
		} else {
			dates = utils.getSelectText('mdsDateRange');
		}
		let str = `${flatpickr.formatDate(props.time.date, 'Y-m-d')} (${dates})`;
		mapUtils.setInfoLabel((prefix + str).toUpperCase(), (prefix + dates).toUpperCase());
	}
}