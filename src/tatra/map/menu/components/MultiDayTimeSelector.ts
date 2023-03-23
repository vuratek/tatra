import { Module } from "./Module";
import { IMenuModule } from "../../defs/ConfigDef";
import { Timeline, TimelineType } from "../../../timeline/Timeline";
import { props } from "../../props";
import flatpickr from 'flatpickr';
import { utils } from "../../../utils";
import { events } from "../../events";
import { controls } from "../../components/controls";
import { rangePicker } from "../../../timeline/rangePicker";

export class MultiDayTimeSelector extends Module {

    public calendar         		: any;
	private timelineHandler 		: (evt: Event) => void;
    public readonly df              : string = 'M d Y';

	public constructor(props : IMenuModule) {
		super(props);
		this.timelineHandler = () => this.timelineUpdate();
    }
    
    public render(par : HTMLDivElement) {
		super.render(par);
		let el = document.getElementById(`mmm_${this.props.id}`) as HTMLDivElement;
		let th = document.createElement("div");
        th.setAttribute("class", "mds");
        rangePicker.hasDateTime = true;
        el.appendChild(th);
        /*                <div class="mdtsQuickLinks"> 
                    <div>Today</div>
                    <div>24hrs</div>
                    <div>48hrs</div>
                    <div>7days</div>
                    <div>Custom</div>
                </div>
*/
		th.innerHTML = `
            <div id="mdts_content" class="mds_content">
                <div id="mdsHistorical">
                    <span id="mdsCalendar" class="mdsCalendar">
                        <i class="fa fa-calendar-alt fa-lg"></i>
                    </span>
                    <input type="text" id="mds_date" readonly>
                    <span class="mdsCalendar">
                        <i class="fa fa-calendar-minus fa-lg" style="margin-left:1rem;"></i>
                    </span>
                    <select id="mdsDateRange">
                        ${rangePicker.getRangeOptions()}
                    </select>
                </div>
            </div>
        `;
        
        Timeline.init("timeline", TimelineType.RANGE_TIED);
        Timeline.singleDate = props.time.imageryDate;
        Timeline.advancedRange = props.time.range;
        controls.enableBtn("timeline");
		controls.setItem("timeline", true);		
		
        document.dispatchEvent(new CustomEvent(events.EVENT_MENU_RESIZE));
        
        utils.setClick('mdsCalendar', () => this.openCalendar());
		utils.setChange('mdsDateRange', () => this.setDates());
		utils.setSelectValue('mdsDateRange', props.time.range.toString());
		this.initDatePicker(props.time.date);
		rangePicker.timelineUpdate();		

    }
    public activate () {
		super.activate();
		document.addEventListener(Timeline.EVENT_TIMELINE_UPDATED, this.timelineHandler);
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
        let range = utils.getSelectValue(`mdsDateRange`);
        if (range[0] == 'm') {
            props.time.rangeMins = Number(range.replace('m', ''));
            props.time.range = 0;
            if (this.calendar) {
                console.log("HERE -------");
                this.calendar.enableTime = true;
            }
        } else {
            props.time.rangeMins = 0;
            props.time.range = Number(range);
        }

		props.time.date = this.calendar.selectedDates[0];
		props.time.quickTime = 0;
		console.log("SETTING", props.time.date, props.time.range);
		Timeline.setDate(props.time.date, props.time.range, props.time.rangeMins);
		//
        //this.updateHash();
        //this.checkBAYearMismatch();
    }

    public openCalendar() {
		this.calendar.open();
	}

    private timelineUpdate () {
        let obj = Timeline.getDates();
		if (! obj) { return; }
		props.time.imageryDate = utils.sanitizeDate(obj["single"].start, true);
		console.log("after", obj["single"].start);
		
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
		events.dispatch(events.EVENT_SYSTEM_DATE_UPDATE);
    }

}