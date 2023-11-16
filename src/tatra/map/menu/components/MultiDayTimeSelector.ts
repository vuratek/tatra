import { Module } from "./Module";
import { IMenuModule } from "../../defs/ConfigDef";
import { Timeline } from "../../../timeline/Timeline2";
import { props } from "../../props";
import flatpickr from 'flatpickr';
import { utils } from "../../../utils";
import { events } from "../../events";
import { controls } from "../../components/controls";
import { rangePicker } from "../../../timeline/rangePicker2";
import { time_info, tio } from "../features/time_info";
import { hash } from "../../hash";
import { hashHandler } from "../hashHandler";
import { TimelineType, timelineController } from '../../../timeline/timelineController';

export class MultiDayTimeSelector extends Module {

    public calendar         		: any;
    public clock                    : any;
	private timelineHandler 		: (evt: Event) => void;
    public readonly df              : string = 'M d Y';

    private lastRangeMins                : number = 240;
    private lastRangeDays                : number = 1;
    private currentDayMode               : string = '';

	public constructor(props : IMenuModule) {
		super(props);
		this.timelineHandler = () => this.timelineUpdate();
    }
    
    public render(par : HTMLDivElement) {
        super.render(par);

        let dates = hash.getDates();
        hashHandler.processDateTime(dates);		
        this.lastRangeDays = props.time.range;
        
        controls.createControlItem('time_info', time_info);
		let el = document.getElementById(`mmm_${this.props.id}`) as HTMLDivElement;
		let th = document.createElement("div");
        th.setAttribute("class", "mds");
        el.appendChild(th);

		th.innerHTML = `
            <div id="mdts_content" class="mds_content">
                <div id="ql_subdaily" class="mdtsQuickLinks"> 
                    <div id="ql_1h">1 hr</div>
                    <div id="ql_2h">2 hr</div>
                    <div id="ql_4h">4 hrs</div>
                    <div id="ql_6h">6 hrs</div>
                    <div id="ql_info"><span id="mds_btn_timeInfo"><i class="fa fa-info-circle" aria-hidden="true"></i></span></div>
                </div>
                <div id="ql_daily" class="mdtsQuickLinks">
                    <div id="ql_today">Today</div>
                    <div id="ql_24h">~24hrs</div>
                    <div id="ql_48h">3 days</div>
                    <div id="ql_7d">7 days</div>
                    <div id="ql_info2"><span id="mds_btn_timeInfo2"><i class="fa fa-info-circle" aria-hidden="true"></i></span></div>
                </div>
                <div class="fmmModeWrap">
                    <div id="mmm_${this.props.id}-btn-daily" class="fmmModeBtn">
                        DAILY
                    </div>
                    <div id="mmm_${this.props.id}-btn-sub-daily" class="fmmModeBtn">
                        SUB-DAILY
                    </div>
                </div>
                
                <div id="mdsHistorical">
                    <span id="mdsCalendar" class="mdsCalendar">
                        <i class="fa fa-calendar-alt fa-lg"></i>
                    </span>
                    <input type="text" id="mds_date" readonly>
                    <div id="mdsCalendar2"></div>
                    <div id="mdsDailySetting"></div>
                </div>
            </div>
        `;

        utils.setClick('mdsCalendar', () => this.openCalendar());
        utils.setClick('ql_1h', ()=>this.onQuickLinksUpdate('1h'));
        utils.setClick('ql_2h', ()=>this.onQuickLinksUpdate('2h'));
        utils.setClick('ql_4h', ()=>this.onQuickLinksUpdate('4h'));
        utils.setClick('ql_6h', ()=>this.onQuickLinksUpdate('6h'));
        utils.setClick('ql_today', ()=>this.onQuickLinksUpdate('today'));
        utils.setClick('ql_24h', ()=>this.onQuickLinksUpdate('24h'));
        utils.setClick('ql_48h', ()=>this.onQuickLinksUpdate('48h'));
        utils.setClick('ql_7d', ()=>this.onQuickLinksUpdate('7d'));
        utils.setClick('ql_info', ()=>this.displayTimeInfoDetail());
        utils.setClick('ql_info2', ()=>this.displayTimeInfoDetail());
        utils.setClick(`mmm_${this.props.id}-btn-daily`, ()=>this.onDailySubDaily('daily'));
        utils.setClick(`mmm_${this.props.id}-btn-sub-daily`, ()=>this.onDailySubDaily('subdaily'));

        // set timeline
        let ttype = (props.time.rangeMins == 0) ? TimelineType.RANGE_TIED : TimelineType.RANGE_SUBHOUR_TIED;
		timelineController.time.imageryDate = props.time.imageryDate;
		timelineController.time.date = props.time.date;
		timelineController.time.range = props.time.range;
        timelineController.time.rangeMins = props.time.rangeMins;
        Timeline.init("timeline", ttype);
        controls.enableBtn("timeline");
		controls.setItem("timeline", true);				
        
        let format = (props.time.rangeMins > 0) ? 'Y-m-d' : 'Y-m-d H:i';
        if (flatpickr.formatDate(props.time.date, format) == flatpickr.formatDate(utils.getGMTTime(new Date()), format)) {
            if (props.time.rangeMins > 0) {
                props.time.date = utils.getGMTTime(new Date());
            } else {
                props.time.date = utils.sanitizeTime(utils.getGMTTime(new Date()), true);
            }
        }

        this.initDatePicker(props.time.date);
        rangePicker.timelineUpdate();
        if (props.time.rangeMins > 0) {
            this.onDailySubDaily('subdaily');
        } else {
            this.onDailySubDaily('daily');
        }
        document.dispatchEvent(new CustomEvent(events.EVENT_MENU_RESIZE));
    }
    public onDailySubDaily(option:string) {
        if (this.currentDayMode == option) { return; }
        if (option == 'daily') {
            utils.hide('ql_subdaily');
            utils.show('ql_daily');

            this.setLastMinValues(this.lastRangeDays);
            time_info.setDisplayOptions([tio.TODAY, tio.DAY2, tio.DAY3, tio.DAY7]);
        } else {
            utils.show('ql_subdaily');
            utils.hide('ql_daily');
            props.time.date = utils.sanitizeTime(utils.getGMTTime(new Date()), true);
            this.setLastDayValues(this.lastRangeMins);
            time_info.setDisplayOptions([tio.HOUR1, tio.HOUR2, tio.HOUR4, tio.HOUR6]);
        }
        this.setDates();
        Timeline.setSelectOption();
    }
    public setDailySubDailyOption(option:string) {
        if (this.currentDayMode == option) { 
            if (option == 'daily') {
                utils.setSelectValue('mdsDateRange', props.time.range.toString());
            } else {
                utils.setSelectValue('mdsSubDateRange', 'm' + props.time.rangeMins.toString());
            }
            return; 
        }
        this.currentDayMode = option;
        let content = document.getElementById('mdsDailySetting') as HTMLDivElement;
        let cal2 = document.getElementById('mdsCalendar2') as HTMLDivElement;

        if (option == 'daily') {
            content.innerHTML = '';
            cal2.innerHTML = `
                <span class="mdsCalendar"><i class="fa fa-calendar-minus fa-lg" style="margin-left:1rem;"></i></span>
                <select id="mdsDateRange" class="mdsDateRange">
                    ${rangePicker.getRangeOptions()}
                </select>
            `;
            utils.setSelectValue('mdsDateRange', props.time.range.toString());
            utils.addClass('mdsDailySetting', 'daily');
            utils.removeClass('mdsDailySetting', 'subdaily');    
            utils.addClass(`mmm_${this.props.id}-btn-daily`, 'active');
            utils.removeClass(`mmm_${this.props.id}-btn-sub-daily`, 'active');
            utils.setChange('mdsDateRange', () => this.setDates());
        } else {
            cal2.innerHTML = `
                <span class="mdsCalendar"><i class="fa fa-clock fa-lg" style="margin-left:1rem;"></i></span>
                <input type="text" id="mds_clock" readonly>
                UTC
            `;
            content.innerHTML = `
                <div id="mds_min_10" class="mds_subdaily_time">-10 mins</div>
                <select id="mdsSubDateRange" class="mdsDateRange">
                    ${rangePicker.getSubdailyRangeOptions(props.time.rangeMins)}
                </select>
                <div id="mds_plus_10" class="mds_subdaily_time">+10 mins</div>
            `;
            utils.setSelectValue('mdsSubDateRange', 'm' + props.time.rangeMins.toString());
            utils.addClass('mdsDailySetting', 'subdaily');
            utils.removeClass('mdsDailySetting', 'daily');
            utils.addClass(`mmm_${this.props.id}-btn-sub-daily`, 'active');
            utils.removeClass(`mmm_${this.props.id}-btn-daily`, 'active');
            utils.setClick('mds_min_10', ()=>this.shift10Mins(-10));
            utils.setClick('mds_plus_10', ()=>this.shift10Mins(10));
            utils.setChange('mdsSubDateRange', () => this.updateSubDailyMenu());
            this.initClockPicker(props.time.date);

//            ${utils.getMinHourValue(props.time.rangeMins)}
        }
        if (option == 'daily') {
            Timeline.setTimelineRangeMode(TimelineType.RANGE_TIED);
        } else {
            Timeline.setTimelineRangeMode(TimelineType.RANGE_SUBHOUR_TIED);
        }
    }
    private renderSubDailyMenu() {
        if (this.currentDayMode == 'subdaily') {
            if (props.time.rangeMins>=20) {
                utils.removeClass('mds_min_10', 'disabled');
            } else {
                utils.addClass('mds_min_10', 'disabled');
            }
            if (props.time.rangeMins<1440) {
                utils.removeClass('mds_plus_10', 'disabled');
            } else {
                utils.addClass('mds_plus_10', 'disabled');
            }
        }
    }
    private shift10Mins(amount:number) {
        if (this.currentDayMode == 'subdaily') {
            if ( (amount < 0 && props.time.rangeMins > 10) || (amount > 0 && props.time.rangeMins < 1440) ) {
                props.time.rangeMins += amount;
                let el = document.getElementById('mdsSubDateRange') as HTMLSelectElement;
                if (el) {
                    el.innerHTML = `${rangePicker.getSubdailyRangeOptions(props.time.rangeMins)}`
                }
                utils.setSelectValue('mdsSubDateRange', 'm' + props.time.rangeMins);
                this.setDates();
                rangePicker.setRangeSelect();
            }
        }
    }
    private updateSubDailyMenu() {
        this.setDates();
    }
    private onQuickLinksUpdate(val : string) {
        let dt = utils.sanitizeTime(utils.getGMTTime(new Date()), true);
        props.time.date = utils.sanitizeTime(utils.getGMTTime(new Date()), true);
        if (val == 'today') {
            this.setLastMinValues(0);
        } else if (val == '24h') {
            this.setLastMinValues(1);
        } else if (val == '48h') {
            this.setLastMinValues(2);
        } else if (val == '7d') {
            this.setLastMinValues(6);
        } else if (val == '1h') {
            this.setLastDayValues(60);
        } else if (val == '2h') {
            this.setLastDayValues(120);
        } else if (val == '4h') {
            this.setLastDayValues(240);
        } else if (val == '6h') {
            this.setLastDayValues(360);
        }     
        this.calendar.selectedDates[0] = dt;
        this.setDates();
        Timeline.setSelectOption();
        events.dispatch(events.EVENT_SYSTEM_DATE_UPDATE);
    }
    private setLastMinValues(val : number) {
        if (props.time.rangeMins > 0) {
            this.lastRangeMins = props.time.rangeMins;
            props.time.rangeMins = 0;
        }
        props.time.range = val;
        this.setDailySubDailyOption('daily');
    }
    private setLastDayValues(val : number) {
        if (props.time.range > 0) {
            this.lastRangeDays = props.time.range;
            props.time.range = 0;
        }
        props.time.rangeMins  = val;
        this.setDailySubDailyOption('subdaily');
        this.clock.selectedDates.push(props.time.date);
        this.clock.setDate(props.time.date);
    }
    private setQuickLinks() {
        let dt = utils.sanitizeDate(utils.getGMTTime(new Date()));
        let links = ['1h', '2h', '4h', '6h', 'today', '24h', '48h', '7d'];
        for (let i=0; i<links.length;i++) {
            utils.removeClass(`ql_${links[i]}`, 'selected');            
        }
        if (flatpickr.formatDate(props.time.date, 'Y-m-d') == flatpickr.formatDate(dt, 'Y-m-d')) {
            if (props.time.range == 0 && props.time.rangeMins == 0) {
                utils.addClass('ql_today', 'selected');
            } else if (props.time.range == 1 && props.time.rangeMins == 0) {
                utils.addClass('ql_24h', 'selected');
            } else if (props.time.range == 2 && props.time.rangeMins == 0) {
                utils.addClass('ql_48h', 'selected');
            } else if (props.time.range == 6 && props.time.rangeMins == 0) {
                utils.addClass('ql_7d', 'selected');
            } else if (this.getClockMaxTime(utils.getGMTTime(new Date())) == flatpickr.formatDate(props.time.date, 'H:i')) {
                if (props.time.range == 0 && props.time.rangeMins == 60) {
                    utils.addClass('ql_1h', 'selected');
                } else if (props.time.range == 0 && props.time.rangeMins == 120) {
                    utils.addClass('ql_2h', 'selected');
                } else if (props.time.range == 0 && props.time.rangeMins == 240) {
                    utils.addClass('ql_4h', 'selected');
                } else if (props.time.range == 0 && props.time.rangeMins == 360) {
                    utils.addClass('ql_6h', 'selected');
                }                    
            }   
        }
        this.renderSubDailyMenu();
    }
    public activate () {
		super.activate();
		document.addEventListener(timelineController.EVENT_TIMELINE_UPDATED, this.timelineHandler);
    }
    public deactivate() {
        Timeline.setTimelineRangeMode(TimelineType.RANGE_TIED);
		super.deactivate();
		Timeline.delete();
        document.removeEventListener(timelineController.EVENT_TIMELINE_UPDATED, this.timelineHandler);
        this.currentDayMode = '';
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
    }
    private initClockPicker(d:Date) {
        let option = this;
		if (this.clock) {
			this.clock.destroy();
        }
        let max = this.getClockMaxTime(utils.getGMTTime(new Date()));
        this.clock = flatpickr("#mds_clock", {
            dateFormat : 'H:i',
            enableTime: true,
            noCalendar: true,
            time_24hr: true,
            minuteIncrement: 10,
            minTime : "00:00",
            maxTime : '23:50',
            defaultDate : max,
            onChange : function () {
                option.setClock();
            }
        }) as Instance;
        this.clock.selectedDates.push(props.time.date);
//        this.clock.setDate(props.time.date);
            
//        this.clock.selectedDates.push(d);
    }
    private getClockMaxTime(date : Date) : string {
        let dt = utils.getGMTTime(new Date());
        if (flatpickr.formatDate(date,'Y-m-d') == flatpickr.formatDate(dt, 'Y-m-d')) {            
            let hrs = dt.getHours();
            let mins = Math.ceil(dt.getMinutes() / 10) * 10;
            if (mins == 60) {
                hrs++;
                mins = 0;
            }
            return utils.padFill(hrs.toString(), 2) + ':' + utils.padFill(mins.toString(),2);
        } else {
            return '23:50';
        }

    }
    private setClock() {
        this.setDates();
    }
	private setDates () {
        let range = (document.getElementById('mdsDateRange')) ? utils.getSelectValue(`mdsDateRange`) : utils.getSelectValue(`mdsSubDateRange`);
        props.time.date = this.calendar.selectedDates[0];

        if (range[0] == 'm') {
            props.time.rangeMins = Number(range.replace('m', ''));
            props.time.range = 0;
            props.time.date.setHours((this.clock.selectedDates[0] as Date).getHours());
            props.time.date.setMinutes((this.clock.selectedDates[0] as Date).getMinutes());
            props.time.date.setSeconds(0);
        } else {
            props.time.rangeMins = 0;
            props.time.range = Number(range);
            props.time.date = utils.sanitizeTime(props.time.date);
        }

        props.time.quickTime = 0;
        timelineController.time.range = props.time.range;
		timelineController.time.rangeMins = props.time.rangeMins;
        timelineController.time.date = props.time.date;
        timelineController.time.imageryDate = props.time.imageryDate;
        timelineController.refreshTimelineDate();

        this.setQuickLinks();
        events.dispatch(events.EVENT_SYSTEM_DATE_UPDATE);

		//
        //this.updateHash();
        //this.checkBAYearMismatch();
    }

    public openCalendar() {
		this.calendar.open();
	}

    private timelineUpdate () {
        let obj = timelineController.obj;
        if (! obj) { return; }
        let pastImageryDate = props.time.imageryDate;
        //props.time.imageryDate = utils.sanitizeDate(obj["single"].start, false);
        props.time.imageryDate = obj["single"].start;
        
        let _refresh = false;

        if (timelineController.type == TimelineType.RANGE_SUBHOUR_TIED) {
            let _dt = obj["range"].end;
            this.calendar.setDate(utils.sanitizeDate(obj["range"].end));
            this.clock.maxTime = this.getClockMaxTime(_dt);
            this.clock.setDate(obj["range"].end);
            if (flatpickr.formatDate(_dt, 'Y-m-d H:i') != flatpickr.formatDate(props.time.date, 'Y-m-d H:i')) {
                _refresh = true;
                props.time.date = utils.sanitizeTime(_dt);
            }
            let _rangeMin = timelineController.time.rangeMins;
            if (_rangeMin != props.time.rangeMins) {
                _refresh = true;
                props.time.rangeMins = _rangeMin;
            }
            let el = document.getElementById('mdsSubDateRange') as HTMLSelectElement;
            if (el) {
                el.innerHTML = `${rangePicker.getSubdailyRangeOptions(props.time.rangeMins)}`
            }
            utils.setSelectValue('mdsSubDateRange', 'm' + props.time.rangeMins);


//            this.clock.setDate(end);
            //utils.setSelectValue('mdsSubDateRange', 'm' + Timeline.advancedMinuteRange.toString());

        } else {
            if (! obj["range"]) { return; }
            if (timelineController.isPartialDate(obj["range"].end)) {
                this.calendar.setDate(utils.sanitizeDate(obj["range"].end));
            } else {
                this.calendar.setDate(utils.addDay(obj["range"].end,-1));
            }

            utils.setSelectValue('mdsDateRange', timelineController.time.range.toString());
            let _dt = utils.addDay(obj["range"].end,-1);
            let _range = timelineController.time.range;
            if (flatpickr.formatDate(_dt, 'Y-m-d') != flatpickr.formatDate(props.time.date, 'Y-m-d')) {
                _refresh = true;
                props.time.date = _dt;
            }
            if (_range != props.time.range) {
                _refresh = true;
                props.time.range = _range;
            }
        }
        if (pastImageryDate != props.time.imageryDate) {
            _refresh = true;
        }
		if (!_refresh) {
            return;
        }
        this.setQuickLinks();
		events.dispatch(events.EVENT_SYSTEM_DATE_UPDATE);
    }
    private displayTimeInfoDetail() {
		controls.activateControlItem('time_info');
        time_info.open();
	}
}