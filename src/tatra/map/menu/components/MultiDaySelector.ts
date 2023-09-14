import '../css/multiDaySelector.scss';
import { Module } from "./Module";
import { utils } from "../../../utils";
import { controls } from "../../components/controls";
import { mapUtils } from '../../mapUtils';
import { bookmark } from "../features/bookmark";
import { time_info } from "../features/time_info";
import { BasicMenuDates, BasicMenuDateValues } from '../../defs/Times';
import { props } from '../../props';
import flatpickr from 'flatpickr';
import { Timeline, TimelineType } from '../../../timeline/Timeline';
import { rangePicker } from "../../../timeline/rangePicker"; 
import { timeline } from '../../components/timeline';
import { events } from '../../events';
import { IMenuModule } from '../../defs/ConfigDef';
import { hash, IHashDates } from '../../hash';
import { hashHandler } from '../hashHandler';

export enum MDSTabs {
	CURRENT 		= "current",
	HISTORICAL	 	= "historical"
}
export class MultiDaySelector extends Module {

	public calendar         		: any;
	public currentTab				: string = '';
	public readonly df              : string = 'M d Y';
	public previousBtn				: number = 0;
	private timelineBtnHandler 		: (evt: Event) => void;
	private timelineHandler 		: (evt: Event) => void;

	public constructor(props : IMenuModule) {
		super(props);
		this.timelineBtnHandler = (evt) => this.timelineBtnClick(evt as CustomEvent);
		this.timelineHandler = () => this.timelineUpdate();
	}

	public render(par : HTMLDivElement) {
		let dates = hash.getDates();
		let startTab = MDSTabs.HISTORICAL;
		props.time.rangeMins = 0;
		props.time.range = 1;
//		this.previousBtn = BasicMenuDateValues.HRS_24;

		if (dates) {
			if (dates.start == 'today') {
				startTab = MDSTabs.CURRENT;
				this.previousBtn = BasicMenuDateValues.TODAY;
			}
			else if (dates.start == '24hrs') {
				startTab = MDSTabs.CURRENT;
			}
			hashHandler.processDateTime(dates);		
		}
		super.render(par);
		if (this.props.descriptionText) {
			bookmark.setDescriptionText(this.props.descriptionText);
		}
		controls.createControlItem('bookmark', bookmark);
		controls.createControlItem('time_info', time_info);
		let el = document.getElementById(`mmm_${this.props.id}`) as HTMLDivElement;
		let th = document.createElement("div");
        th.setAttribute("class", "mds");
        el.appendChild(th);
		th.innerHTML = `
			<div class="mds_selection">
				<div id="mds_tab_${MDSTabs.CURRENT}" class="mds_tab">${MDSTabs.CURRENT}</div>
				<div id="mds_tab_${MDSTabs.HISTORICAL}" class="mds_tab">${MDSTabs.HISTORICAL}</div>
			</div>
            <div id="mds_content" class="mds_content">
            </div>
		`;
		utils.setClick(`mds_tab_${MDSTabs.CURRENT}`, ()=> this.tab(MDSTabs.CURRENT));
		utils.setClick(`mds_tab_${MDSTabs.HISTORICAL}`, ()=> this.tab(MDSTabs.HISTORICAL));
		this.tab(startTab);
	}
	public tab(tab:string) {
		if (this.currentTab == tab) { return; }
		utils.removeClass(`mds_tab_${this.currentTab}`,'active');
		this.currentTab = tab;
		Timeline.delete();
		utils.addClass(`mds_tab_${this.currentTab}`,'active');
		if (this.currentTab == MDSTabs.CURRENT) {
			this.render_current();
		} else {
			this.render_historical();
		}
	}
	public render_current() {
		timeline.close();
		controls.disableBtn("timeline");
//		document.removeEventListener(Timeline.EVENT_TIMELINE_UPDATED, this.timelineHandler);

		this.timelineBtnHandler = (evt) => this.timelineBtnClick(evt as CustomEvent);
		document.addEventListener(events.EVENT_CONTROL_DISABLED, this.timelineBtnHandler);
		document.dispatchEvent(new CustomEvent(events.EVENT_MENU_RESIZE));

		let el = document.getElementById("mds_content") as HTMLDivElement;
		el.innerHTML = `
			<div id="${this.props.id}_mds_btn_1" class="mds_time_btn">
				<div>${BasicMenuDates.TODAY}</div>
			</div> 
			<div id="${this.props.id}_mds_btn_24" class="mds_time_btn">
				<div>${BasicMenuDates.HRS_24}</div>
			</div> 
			<div id="${this.props.id}_mds_btn_7d" class="mds_time_btn">
				<div>${BasicMenuDates.DAY_7}</div>
			</div> 
			<div id="${this.props.id}_mds_btn_bookmark" class="mds_bookmark_btn">
				<i class="far fa-bookmark" aria-hidden="true"></i>
			</div>
			<div id="mdsTimePeriodStatement"></div>
		`;
		utils.setClick(`${this.props.id}_mds_btn_1`, () => this.setTime(BasicMenuDateValues.TODAY));
		utils.setClick(`${this.props.id}_mds_btn_24`, () => this.setTime(BasicMenuDateValues.HRS_24));
		utils.setClick(`${this.props.id}_mds_btn_7d`, () => this.setTime(BasicMenuDateValues.DAY_7));
		utils.setClick(`${this.props.id}_mds_btn_bookmark`, () => this.bookmark());
		if (this.previousBtn > 0 && this.previousBtn <= 24) {
			this.setTime(this.previousBtn);
		} else {
			this.setTime(BasicMenuDateValues.HRS_24);
		}
	
	}
	public deactivate() {
		super.deactivate();
		Timeline.delete();
		document.removeEventListener(events.EVENT_CONTROL_DISABLED, this.timelineBtnHandler);
		document.removeEventListener(Timeline.EVENT_TIMELINE_UPDATED, this.timelineHandler);
		this.currentTab = '';
	}
	private render_historical() {
		document.removeEventListener(events.EVENT_CONTROL_DISABLED, this.timelineBtnHandler);
		Timeline.init("timeline", TimelineType.RANGE_TIED);
        Timeline.singleDate = props.time.imageryDate;
		Timeline.advancedRange = props.time.range;
        controls.enableBtn("timeline");
		controls.setItem("timeline", true);		
		
		document.dispatchEvent(new CustomEvent(events.EVENT_MENU_RESIZE));

		let el = document.getElementById("mds_content") as HTMLDivElement;
		el.innerHTML = `
			<div id="mdsHistorical">
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
		utils.setClick('mdsCalendar', () => this.openCalendar());
		utils.setChange('mdsDateRange', () => this.setDates());
		utils.setSelectValue('mdsDateRange', props.time.range.toString());
		this.initDatePicker(props.time.date);
		rangePicker.timelineUpdate();		

	}
	public openCalendar() {
		this.calendar.open();
	}

	private timelineBtnClick (evt : CustomEvent) {
		if (evt.detail.id == "timeline" && this.currentTab == MDSTabs.CURRENT) {
			if (props.time.quickTime == 24) {
				props.time.date = utils.addDay(utils.getGMTTime(new Date()),-1);
				props.time.range = 1;
			} else if (props.time.quickTime == 1) {
				props.time.date = utils.getGMTTime(new Date());
				props.time.range = 0;
			}
			this.tab(MDSTabs.HISTORICAL);
		}
	}
	private initDatePicker (d : Date) {
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
	private setDates () {
		props.time.date = this.calendar.selectedDates[0];
		props.time.range = Number(utils.getSelectValue(`mdsDateRange`));
		props.time.quickTime = 0;
		//console.log("SETTING", props.time.date, props.time.range);
		Timeline.setDate(props.time.date, props.time.range);
		//
        //this.updateHash();
        //this.checkBAYearMismatch();
    }

	public setTime ( time : number ) {
		if (time == BasicMenuDateValues.DAY_7) {
			props.time.date = utils.sanitizeDate(new Date(), false);
			props.time.imageryDate = utils.addDay(props.time.date, -1);
			props.time.range = 6;
			hashHandler.setDateTime();
			events.dispatch(events.EVENT_SYSTEM_DATE_UPDATE);
			//localUtils.analyticsTab(`tab-${this.menuId}-${time}`);			
			this.tab(MDSTabs.HISTORICAL);
			return;
		}
		utils.removeClass(`${this.props.id}_mds_btn_1`, "mmTimeBtnSelected");
		utils.removeClass(`${this.props.id}_mds_btn_24`, "mmTimeBtnSelected");
		utils.addClass(`${this.props.id}_mds_btn_${time}`, "mmTimeBtnSelected");
		this.previousBtn = props.time.quickTime;

//			if (time == '24') { model.cacheObj.date = CacheLayerDate.HRS_24;}
//			else { model.cacheObj.date = CacheLayerDate.TODAY; }
//			this.validateLayers();
//			this.forceRefreshLayers();
		let txt = document.getElementById('lmvFeatureInfo1');
		if (txt) { 
			let info = (time == 24) ? 'Last 24hrs' : 'Today';
			txt.innerHTML = 'Fires: ' + info;
		}
		let date = utils.sanitizeDate(new Date(), false);
		let end = flatpickr.formatDate(date, 'Y-m-d');
		
		let start = (time == 24) ? flatpickr.formatDate(utils.addDay(date,-1), 'Y-m-d') : end;
/*			for (let group in model.data[TabType.CURRENT]) {
				if (group == GroupType.NONE) {
					for (let layer in model.data[TabType.CURRENT][group].layers) {
						let lo = mapUtils.getLayerById(layer);
						if (!lo) {continue;}
						let refresh = false;
						if (lo.data.start != start) { lo.data.start = start; }
						if (lo.data.end != end) { lo.data.end = end; }
						if (refresh && lo._layer) {
							lo.refresh();	
						}
					}
				}
			}*/
		for (let i=0; i< props.layers.length;i ++) {
			let lo = props.layers[i];
			if (lo.handler == "timeBased") {
				console.log("timebased", lo.id);
				lo.data.start = start;
				lo.data.end = end;
				if (lo._layer && lo.visible) {
					lo.refresh();	
				}
			}
		}
			//hash.dates({start :start, end : end}); ** not needed?
//			hash.dates({start: model.cacheObj.date});
//			localUtils.analyticsTab(`tab-${this.menuId}-${time}`);
		props.time.quickTime = time;
		this.setTimeInfoLabel();
		this.updateImageryDate();
		mapUtils.setImageryInfo();
	}
	public activate () {
		super.activate();
		document.addEventListener(events.EVENT_CONTROL_DISABLED, this.timelineBtnHandler);
		document.addEventListener(Timeline.EVENT_TIMELINE_UPDATED, this.timelineHandler);
	}
    private bookmark() {
		controls.activateControlItem('bookmark');
	}

	private timelineUpdate () {
        let obj = Timeline.getDates();
		if (! obj) { return; }
		props.time.imageryDate = utils.sanitizeDate(obj["single"].start, false);
//		console.log("after", obj["single"].start);
		
        if (Timeline.isPartialDate(obj["range"].end)) {
            this.calendar.setDate(utils.sanitizeDate(obj["range"].end));
        } else {
            this.calendar.setDate(utils.addDay(obj["range"].end,-1));
        }
        utils.setSelectValue('mdsDateRange', Timeline.advancedRange.toString());
        let _dt = utils.addDay(obj["range"].end,-1);
		let _range = Timeline.advancedRange;
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

	private updateImageryDate () {
        if (props.time.quickTime == 1) {
			props.time.date = utils.getGMTTime(new Date());
			props.time.imageryDate = props.time.date;
			props.time.range = 0;
        } else {
			props.time.date = utils.getGMTTime(new Date());
			props.time.imageryDate = utils.addDay(props.time.date, -1);
//			props.time.imageryDate.setTime(props.time.imageryDate.getTime() - 1000*60*60*24);
			props.time.range = 1;
		}
//	    mapUtils.updateImageryLayers(props.time.imageryDate);
		hashHandler.setDateTime();
		events.dispatch(events.EVENT_SYSTEM_DATE_UPDATE);
	}
	
	

	private setTimeInfoLabel () {
		let txt = (props.time.quickTime == 1)  ? BasicMenuDates.TODAY : BasicMenuDates.HRS_24;
		let label = `<span class="mds_btn_timeInfoTitle">${txt}</span><br/>`;
		label += (props.time.quickTime == 1) ? "From [Today 00:00:00 GMT] to present" : "From [Yesterday 00:00:00 GMT] to present";
		label += `<span id="mds_btn_timeInfo"> <i class="fa fa-info-circle" aria-hidden="true"></i></span>`;
//        label += '<br><a target="_blank" rel="noopener" href="https://greenwichmeantime.com/uk/time/">Current Date/Time in GMT</a>';
        let el = document.getElementById('mdsTimePeriodStatement');
        if (el) {
			el.innerHTML = label;
			utils.setClick('mds_btn_timeInfo', () => this.displayTimeInfoDetail());
        }
	}
	private displayTimeInfoDetail() {
		controls.activateControlItem('time_info');
        time_info.open();
	}
}