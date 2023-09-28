import './css/*.scss';
import { utils } from '../utils';
import { events } from '../map/events';
import { props } from '../map/props';
import { rangePicker } from './rangePicker2';
import { singleDatePicker } from './singleDatePicker2';
import { loadHandler } from "./loadHandler";
import { helper } from './helper2';
import { TimelineType, ITimelineItem, timelineController, TimelineAdjustType, ITimelineRanges } from './timelineController';

export enum ActionType {
    CLICK       = "click",      // outside of range
    MOVE        = "move",       // dragging range or inside the range
    NONE        = "none"
}

interface VisTimeline {}
interface DataSet <T> {}
export class Timeline {

    private static div                  : HTMLDivElement;
    private static id                   : string;
    private static container            : HTMLDivElement;
    private static timeline             : VisTimeline | null = null;
    private static items                : DataSet <any> | null = null;
    private static options              : any = {};
    private static timeKeeper           : ITimelineItem | null = null;

    private static actionType           : ActionType = ActionType.NONE;
    private static draggedId            : string = '';
    private static minusDragDirection   : boolean = true;
    
//    public static singleTime            : Date = utils.getGMTTime(new Date());

    public static isActive              : boolean = false;
    private static initialized          : boolean = false;
    private static rendered             : boolean = false;

    private static timeUpdateHandler    : Function;

    public static singleSliderVisible   : boolean = false;

    public static init (divId : string, type : TimelineType = TimelineType.SINGLE) {
        timelineController.type= type;        
        this.id = divId;
        this.div = document.getElementById(this.id) as HTMLDivElement;
        if (! this.div) {
            console.log("Div " + divId + ' is not defined.');
            return;
        }
        if (! this.initialized) {
            this.initialized = true;
            document.addEventListener(events.EVENT_CONTROL_BTN, (evt) => this._setTimeline(evt));
            document.addEventListener(events.EVENT_LAYER_VISIBLE, () => this.setSingleSlider());
            document.addEventListener(events.EVENT_LAYER_HIDDEN, () => this.setSingleSlider());
            document.addEventListener(events.EVENT_LAYERS_REFRESH, () => this.setSingleSlider());
            document.addEventListener(timelineController.EVENT_TIMELINE_LOADED, () => this.initTimeline());
            document.addEventListener(timelineController.EVENT_ADJUST_TIMELINE, (evt) => this.adjustTimeline(evt as CustomEvent));
            document.addEventListener(timelineController.EVENT_REFRESH_TIMELINE_DATE, () => this.refreshDate());
            window.addEventListener("resize", () => this.resize());
            this.timeUpdateHandler = this.updateTimelineTime;
            setInterval(this.timeUpdateHandler,1000*60);
        }
        //this.rendered = false;
    }

    public static setTimelineRangeMode(mode:TimelineType) {
        if (timelineController.type== mode) { return; }
        if (mode == TimelineType.RANGE_TIED) {
            this.setModeRangeTied();
        } else if (mode == TimelineType.RANGE_SUBHOUR_TIED) {
            this.setModeRangeSubHourTied();
        } else if (mode == TimelineType.RANGE_HOUR_MIN_TIED) {
            this.setModeRangeHourMinTied();
        }
    }

    private static changeTimelineRangeMode() {
        let hourly = false;
        for (let i=0; i < props.layers.length; i++) {
            let lo = props.layers[i];
            if (lo.visible && lo.hasTime && lo.timeStep) {
                hourly = true;
            }
            // remove ??
            if (((lo.handler == "imagery" && ! lo.noDateRefresh)|| lo.handler == 'orbits') && lo.visible && lo.timeStep) {
                hourly = true;
            }
        }
        if (timelineController.type== TimelineType.RANGE_TIED && hourly) {
            this.setModeRangeHourMinTied();
            //rangePicker.timelineUpdate();
        } else if (timelineController.type== TimelineType.RANGE_HOUR_MIN_TIED && ! hourly) {
            this.setModeRangeTied();
        } else if (timelineController.type== TimelineType.RANGE_SUBHOUR_TIED) {
            this.setModeRangeSubHourTied();
        }
        
    }

    private static setModeRangeTied() {
        timelineController.type= TimelineType.RANGE_TIED;
        timelineController.maxDate = utils.addDay(utils.sanitizeDate(utils.getGMTTime(new Date())));
        rangePicker.initDatePicker(utils.getGMTTime(new Date()));
        this.setSingleTimeKeeper();
        this.timeKeeper["range"] = { start: utils.sanitizeDate(utils.addDay(utils.getGMTTime(new Date()), timelineController.time.range)), end : utils.maximizeDate(utils.addDay(utils.sanitizeDate(new Date())))};
        //this.timeKeeper["range"] = { start: utils.addDay(utils.sanitizeDate(utils.getGMTTime(new Date()), false), - timelineController.time.range), end : utils.addDay(utils.getGMTTime(new Date()))};
        
        if (this.timeKeeper) {
            Timeline.items.update({id: 'single', start: this.timeKeeper['single'].start, end: this.timeKeeper['single'].end, content : "<div></div>"});
            Timeline.items.update({id: 'range', start: this.timeKeeper['range'].start, end: this.timeKeeper['range'].end});
        }
        this._finalizeRangeLoading(utils.addDay(timelineController.maxDate, -2));
    }

    // used for daily but with GOES 15 min imagery
    private static setModeRangeHourMinTied() {
        if (timelineController.type== TimelineType.RANGE_HOUR_MIN_TIED) { return; }
        timelineController.type= TimelineType.RANGE_HOUR_MIN_TIED;
        let maxdate = utils.getGMTTime(new Date());
        maxdate.setMinutes(Math.floor(maxdate.getMinutes() / 10) * 10.0 + 10);
        maxdate.setSeconds(0);
        timelineController.maxDate = maxdate;
        let mindate = new Date(timelineController.maxDate.getTime());
        rangePicker.initDatePicker(mindate);
        mindate.setMinutes(mindate.getMinutes() - 10);
        if (this.timeKeeper) {
            this.timeKeeper["single"].start == mindate;
        }
        Timeline.items.update({id: 'single', start:  mindate, end: timelineController.maxDate});
        let zoomDate = new Date(mindate.getTime());
        zoomDate.setMinutes(-120);

        this._finalizeRangeLoading(zoomDate);
    }

    // used for sub daily (2, 4 hours)
    private static setModeRangeSubHourTied() {
        if (timelineController.type== TimelineType.RANGE_SUBHOUR_TIED) { return; }
        timelineController.type= TimelineType.RANGE_SUBHOUR_TIED;

        let maxdate = utils.getGMTTime(new Date());
        maxdate.setMinutes(Math.floor(maxdate.getMinutes() / 10) * 10.0 + 10);
        maxdate.setSeconds(0);
        timelineController.maxDate = maxdate;

        let mindate = new Date(timelineController.maxDate.getTime());
        mindate.setMinutes(mindate.getMinutes() - 10);
        rangePicker.initDatePicker(mindate);
        this.timeKeeper["single"] = { start: mindate, end : maxdate};
        this.timeKeeper["range"] = { start: utils.addMinutes(maxdate, -timelineController.time.rangeMins), end : maxdate};
        //console.log(">>> ", this.timeKeeper);
        if (this.timeKeeper && Timeline.items) {
            Timeline.items.update({id: 'single', start: this.timeKeeper['single'].start, end: this.timeKeeper['single'].end, content : "<div></div>"});
            Timeline.items.update({id: 'range', start: this.timeKeeper['range'].start, end: this.timeKeeper['range'].end});
        }

        let zoomDate = new Date(mindate.getTime());
        zoomDate.setMinutes(-120);

        this._finalizeRangeLoading(zoomDate);
    }

    public static setSelectOption() {
        rangePicker.setRangeSelect();
    }

    private static _finalizeRangeLoading(date : Date) {
        this.resize();
        if (this.timeline) {
            this.timeline.zoomOut(1);
            this.timeline.moveTo(date);
        }
    }

    private static initTimeline () {
        // Create a DataSet (allows two way data-binding)
        let arr = [];
        //use this.timeKeeper
        if (!this.timeKeeper) { return; }
        if (! loadHandler.isLoaded()) { return; }
        if (! this.items) {
            arr.push({id: 'single', content: '', start: this.timeKeeper["single"].start, end: this.timeKeeper["single"].end, type: 'range', className: 'vis-time-slider-single' });
            if (timelineController.type== TimelineType.RANGE_TIED || timelineController.type== TimelineType.RANGE_HOUR_MIN_TIED || timelineController.type== TimelineType.RANGE_SUBHOUR_TIED) {
                if (! this.timeKeeper["range"]) { return; }
                arr.push({id: 'range', content: '', start: this.timeKeeper["range"].start, end: this.timeKeeper["range"].end, type: 'range', className: 'vis-time-slider-range' });
            } 
            
            this.items = new vis.DataSet(arr);
        }
        utils.removeClass('timeline', 'timelineMissing');

        let props = helper.getTimeLineProperties();  

        let tl = document.getElementById('timeline') as HTMLDivElement;
        this.options = {
            min: props.minDate,
            max: props.maxDate,
            zoomable : true,
            editable: props.editable,
            margin: {
                axis: 0            
            },
            orientation: 'top',
            selectable : false,
            stack: false,
            horizontalScroll: true,
            /*showMinorLabels : false,*/
            zoomMax : props.zoomMax,
            zoomMin : props.zoomMin,
            zoomFriction : 30,
            timeAxis: {scale: props.scale, step: props.step},
            
            snap: function (date : Date, scale : string, step : number) {
                let d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
                if (timelineController.type == TimelineType.RANGE_HOUR_MIN_TIED || timelineController.type == TimelineType.RANGE_SUBHOUR_TIED) {
                    d.setHours(date.getHours());
                    let min = Math.floor(date.getMinutes() / 10.0);
                    d.setMinutes(min * 10);
                } else {
                    if (date.getHours() > 12) {
                        d = utils.addDay(d);
                    }
                }
                return d;                
            },

            itemsAlwaysDraggable: {
                item: true,
                range: true
            }
        };
        this.timeline = new vis.Timeline(this.container, this.items, this.options);
        if (this.timeline) {
            this.timeline.zoomOut(1);
            if (timelineController.time.rangeMins > 0) {
                this.timeline.moveTo(timelineController.time.imageryDate);
            } else {
                this.timeline.moveTo(utils.sanitizeDate(timelineController.time.imageryDate));
            }
            if (timelineController.type == TimelineType.SINGLE) {
                this.timeline.on('click', (evt) => this.onClick(evt));
            } else if (timelineController.type == TimelineType.RANGE_TIED || timelineController.type == TimelineType.RANGE_HOUR_MIN_TIED || timelineController.type == TimelineType.RANGE_SUBHOUR_TIED) {
                this.timeline.on('mouseUp', (evt)=> this.onMouseUp(evt));
                this.timeline.on("mouseDown", (evt) => this.onMouseDown(evt));
                this.timeline.on("changed", ()=> this.onChanged());    
            }            
        }

        this.setSingleSlider();
    }

    public static resize() {
        if (this.timeline) {
            let props = helper.getTimeLineProperties();    
            this.timeline.setOptions(
                {
                    editable : props.editable,
                    zoomMax : props.zoomMax,
                    zoomMin : props.zoomMin,
                    timeAxis: {scale: props.scale, step: props.step}
                }
            );
            //this.timeline.zoomOut(1);
        } else {
            utils.removeClass('timeline', 'timelineMissing');
            this.initTimeline();
        }
    }

    private static setSingleTimeKeeper() {
        if (this.timeKeeper) {
            if (timelineController.type== TimelineType.RANGE_SUBHOUR_TIED) {
        
                let maxdate = new Date(timelineController.time.imageryDate.getTime());
                maxdate.setMinutes(timelineController.time.imageryDate.getMinutes() + timelineController.time.rangeMins);
                this.timeKeeper["single"] = { start: timelineController.time.imageryDate, end : maxdate};
            } else {
                this.timeKeeper["single"] = { start: utils.sanitizeDate(timelineController.time.imageryDate), end : utils.sanitizeDate(utils.addDay(timelineController.time.imageryDate))};
            }
        }
    }

    private static render() {
        this.timeKeeper = {};
        this.setSingleTimeKeeper();
        if (timelineController.type== TimelineType.RANGE_TIED || timelineController.type== TimelineType.RANGE_HOUR_MIN_TIED ) {
            this.timeKeeper["range"] = { start: utils.sanitizeDate(utils.addDay(utils.getGMTTime(new Date()), timelineController.time.range)), end : utils.maximizeDate(utils.addDay(utils.getGMTTime(new Date())))};
            //this.timeKeeper["range"] = { start: utils.addDay(utils.sanitizeDate(utils.getGMTTime(new Date())), - timelineController.time.range), end : utils.addDay(utils.sanitizeDate(utils.getGMTTime(new Date()),false))};
            rangePicker.render(this.id)
        } else if (timelineController.type== TimelineType.SINGLE) {
            singleDatePicker.render(this.id);
        } else if (timelineController.type== TimelineType.RANGE_SUBHOUR_TIED) {
            let maxdate = utils.getGMTTime(new Date());
            maxdate.setMinutes(Math.floor(maxdate.getMinutes() / 10) * 10.0);
            maxdate.setSeconds(0);

            let mindate = new Date(maxdate.getTime());
            mindate.setMinutes(mindate.getMinutes() - 10);
            this.timeKeeper["range"] = { start: utils.addMinutes(maxdate, timelineController.time.rangeMins), end : maxdate};
            rangePicker.render(this.id)
        }
        this.renderTimelineWrap(this.id);
        this.container = document.createElement("div");
        this.container.setAttribute("id", "timeline_main");
        let wrap = document.getElementById('timelineWrap') as HTMLDivElement;        
        wrap.appendChild(this.container); 
    
        utils.addClass('timeline', 'timelineMissing');
        loadHandler.load();        
    }


    private static renderTimelineWrap (id : string) {
        let div = document.getElementById(id) as HTMLDivElement;
        if (! div) { return; }
        
        let cont = document.createElement("div");
        cont.setAttribute("class", "timelineWrap")
        cont.setAttribute("id", id + 'Wrap');
        div.appendChild(cont);
    }

    private static onMouseDown (event : Event) {
        Timeline.draggedId = '';

        if (event.item) {
            Timeline.actionType = ActionType.MOVE;
            if (event.item == 'single') {
                Timeline.draggedId = 'single';
            }
        } else {
            Timeline.actionType = ActionType.CLICK;
        }
    }

    private static _getTimelineCloneValue(id:string) : ITimelineRanges | null {
        let item = {start: new Date(), end: new Date()};
        let _item = Timeline.items.get(id);
        if (_item) {
            item.start = new Date((_item.start as Date).getTime());
            item.end = new Date((_item.end as Date).getTime());
        } else {
            return null;
        }
        return item;
    }

    private static updateTimelineTime(){
        if (timelineController.type == TimelineType.RANGE_HOUR_MIN_TIED) {
            //console.log("UPDATE");
            
        }
    }

    private static onChangedHourMin() {
        let iSingle = this._getTimelineCloneValue('single');
        let iRange = this._getTimelineCloneValue('range');
        let origSingle = this._getTimelineCloneValue('single');
        let origRange = this._getTimelineCloneValue('range');

        if (iRange && iSingle) {
            if (iRange.start > utils.addMinutes(timelineController.maxDate, -timelineController.time.rangeMins)) {
                iRange.start = utils.addMinutes(timelineController.maxDate, -timelineController.time.rangeMins);
                iRange.end = timelineController.maxDate;
            } 
            if (iSingle.start > timelineController.maxDate) {
                iSingle.start = utils.addMinutes(timelineController.maxDate, -10);
                iSingle.end =  timelineController.maxDate;
            }     
            let diff = utils.getMinuteDiff(iRange.start, iRange.end);
            let setMins = timelineController.MAX_MINUTES;
            if (diff < 10) { setMins = 10;}
            if (diff > timelineController.MAX_MINUTES || diff < 10) {

                iRange.end = utils.addMinutes(iRange.start, setMins);
                if (Timeline.minusDragDirection) {
                    iRange.end =  utils.addMinutes(iRange.start, setMins);
                } else {
                    iRange.start = utils.addMinutes(iRange.end, -setMins);
                }
            }
  
            if (iRange.start > iSingle.start) {
                if (Timeline.draggedId == 'single') {
                    iRange.start = iSingle.start;
                    iRange.end = utils.addMinutes(iSingle.start, diff);
                } else {
                    iSingle.start = iRange.start;
                    iSingle.end = utils.addMinutes(iRange.start, 10);
                }
            }
            else if (iRange.end < iSingle.end) { 
                if (Timeline.draggedId == 'single') {
                    iRange.start = utils.addMinutes(iSingle.end, -diff);
                    iRange.end = iSingle.end;
                } else {
                    iSingle.start = utils.addMinutes(iRange.end, -10)
                    iSingle.end = iRange.end;
                }
            }

            if (iRange.end > timelineController.maxDate) {
                iRange.start = utils.addMinutes(timelineController.maxDate, -timelineController.time.rangeMins);
                iRange.end = timelineController.maxDate;

                iSingle.start = utils.addMinutes(timelineController.maxDate, -10);
                iSingle.end = timelineController.maxDate;
            }
            if (helper.isDiff(iSingle, origSingle as ITimelineRanges)) {
                Timeline.items.update(
                    {id: 'single', start: iSingle.start, end: iSingle.end},
                    {id: 'range', start: iRange.start, end: iRange.end}
                );
            } else if (helper.isDiff(iRange, origRange as ITimelineRanges)) {
                Timeline.items.update({id: 'range', start: iRange.start, end: iRange.end});
            }
        }

        let obj = Timeline.getDates();
        if (obj) {
            let diff = utils.getMinuteDiff(obj["range"].start, obj["range"].end);
            timelineController.time.imageryDate = obj["single"].start;
            timelineController.time.rangeMins = diff;
            this.notifyTimelineUpdate();
        }
    }

    private static onChanged() {
        if (! Timeline.items) {
            return;
        }
        if (timelineController.type == TimelineType.RANGE_SUBHOUR_TIED) {
            this.onChangedHourMin();
            return;
        }

        let iSingle = this._getTimelineCloneValue('single');
        let iRange = this._getTimelineCloneValue('range');
        let origSingle = this._getTimelineCloneValue('single');
        let origRange = this._getTimelineCloneValue('range');
        
        if (iRange && iSingle && (timelineController.type != TimelineType.SINGLE)) {
            if (iRange.start > utils.addDay(timelineController.maxDate, -1)) {
                iRange.start = utils.addDay(timelineController.maxDate,-timelineController.time.range -1);
                iRange.end = timelineController.maxDate;
            } 
            if (timelineController.type == TimelineType.RANGE_HOUR_MIN_TIED) {
            } else {
                if (iSingle.start > utils.addDay(timelineController.maxDate, -1)) {
                    iSingle.start = utils.addDay(timelineController.maxDate,-1);
                    iSingle.end =  timelineController.maxDate;
                }
            }     

            let diff = utils.getDayDiff(iRange.start, iRange.end);
            let setDate = timelineController.MAX_DAYS;
            if (diff < 1) { setDate = 1;}
            if (diff > timelineController.MAX_DAYS || diff < 1) {

                iRange.end = utils.addDay(iRange.start, setDate);
                if (Timeline.minusDragDirection) {
                    iRange.end =  utils.addDay(iRange.start, setDate);
                } else {
                    iRange.start = utils.addDay(iRange.end, -setDate);
                }
            }
  
            if (iRange.start > iSingle.start) {
                if (Timeline.draggedId == 'single') {
                    iRange.start = iSingle.start;
                    iRange.end = utils.addDay(iSingle.start, diff);
                } else {
                    if (timelineController.type == TimelineType.RANGE_HOUR_MIN_TIED) {
                        iSingle.start = iRange.start;
                        iSingle.end = utils.addMinutes(iRange.start, 10);
                    } else {
                        iSingle.start = iRange.start;
                        iSingle.end = utils.addDay(iRange.start);
                    }
                }
            }
            else if (iRange.end < iSingle.end) { 
                if (Timeline.draggedId == 'single') {
                    iRange.start = utils.addDay(iSingle.end, -diff);
                    iRange.end = iSingle.end;
                } else {
                    if (timelineController.type == TimelineType.RANGE_HOUR_MIN_TIED) {
                        iSingle.start = utils.addMinutes(iRange.end, -10)
                        iSingle.end = iRange.end;
                    } else {
                        iSingle.start = utils.addDay(iRange.end, -1);
                        iSingle.end = iRange.end;
                    }
                }
            }

            if (iRange.end > timelineController.maxDate) {
                if (timelineController.type == TimelineType.RANGE_HOUR_MIN_TIED) {
                    iRange.start = utils.sanitizeDate(utils.addDay(timelineController.maxDate, -timelineController.time.range));

                } else {
                    iRange.start = utils.sanitizeDate(utils.addDay(timelineController.maxDate, -timelineController.time.range-1));
                }
                iRange.end = timelineController.maxDate;
                if (timelineController.type == TimelineType.RANGE_HOUR_MIN_TIED) {
                    iSingle.start = utils.addMinutes(timelineController.maxDate, -10);
                    iSingle.end = timelineController.maxDate;
                } else {
                    iSingle.start = utils.addDay(timelineController.maxDate, -1);
                    iSingle.end = timelineController.maxDate;
                }
            }
            if (timelineController.isPartialDate(iRange.start)) {
                iRange.start = utils.sanitizeDate(utils.addDay(iRange.start));
            }
            if (helper.isDiff(iSingle, origSingle as ITimelineRanges)) {
                let diff = utils.getDayDiff(iRange.start, iRange.end) - 1;
                if (timelineController.isPartialDate(iRange.end)) {
                    diff ++;
                    timelineController.time.range = diff;
                }

                Timeline.items.update(
                    {id: 'single', start: iSingle.start, end: iSingle.end},
                    {id: 'range', start: iRange.start, end: iRange.end}
                );
            }
            if (helper.isDiff(iRange, origRange as ITimelineRanges)) {
                let diff = utils.getDayDiff(iRange.start, iRange.end) - 1;
                if (timelineController.isPartialDate(iRange.end)) {
                    diff ++;
                    timelineController.time.range = diff;
                }
                Timeline.items.update({id: 'range', start: iRange.start, end: iRange.end});
            }
        }

        let obj = Timeline.getDates();
        if (obj) {
            let diff = utils.getDayDiff(obj["range"].start, obj["range"].end) - 1;
            if (timelineController.isPartialDate(obj["range"].end)) {
                diff ++;
            }
            timelineController.time.imageryDate = obj["single"].start;
            timelineController.time.range = diff;
            this.notifyTimelineUpdate();
        }
    }

    public static eventTimelineLoaded () {
        document.dispatchEvent(new CustomEvent(timelineController.EVENT_TIMELINE_LOADED));
    }

    private static notifyTimelineUpdate() {
        this.setCurrentRange();
        timelineController.obj = this.getDates();
        helper.eventTimelineUpdate();
    }

    private static onMouseUp (event : Event) {
        Timeline.onClick(event);
    }

    private static onClick (event : Event) {
        if (! Timeline.items) { return; }
        let time = utils.sanitizeDate(event.time);
        let single = Timeline.items.get('single');
        if (timelineController.type == TimelineType.SINGLE) {
            Timeline.items.update({id: 'single', start: time, end: utils.addDay(time)});
            this.notifyTimelineUpdate();
            return;
        }
        let range = Timeline.items.get('range');
        if (timelineController.type == TimelineType.RANGE_SUBHOUR_TIED) {
            let time = event.time as Date;
            time.setMinutes(Math.floor(time.getMinutes() / 10) * 10);
            time.setSeconds(0);

            let adjust = (time >= range.start && time <= range.end) ? true : false;
            let diff = utils.getMinuteDiff(new Date(range.start), new Date(range.end));
            if (time >= range.end) { Timeline.minusDragDirection = false; }
            else { Timeline.minusDragDirection = true;}
            if (Timeline.actionType == ActionType.CLICK) {
                if (time < range.start) {
                    Timeline.items.update({id: 'range', start: utils.addMinutes(time, - diff), end: time});
    //                Timeline.items.update({id: 'range', start: time, end: utils.addDay(time, diff)});
                } else if (time > range.end) {
                    Timeline.items.update({id: 'range', start: time, end: utils.addMinutes(time, diff)});
                }   
            }    
            if (range.start > single.start || range.end < single.end) { 
                adjust = true;
            }

            if (Timeline.actionType == ActionType.CLICK || adjust) {
                let sanTime = event.snappedTime;
                Timeline.items.update({id: 'single', start: sanTime, end: utils.addMinutes(sanTime,10)});
            }     

        } else {
            let adjust = (time >= range.start && time <= range.end) ? true : false;
            let diff = utils.getDayDiff(new Date(range.start), new Date(range.end));
            if (timelineController.isPartialDate(range.end)) { diff++; }

            if (time >= range.end) { Timeline.minusDragDirection = false; }
            else { Timeline.minusDragDirection = true;}

            if (Timeline.actionType == ActionType.CLICK) {
                if (time < range.start) {
                    Timeline.items.update({id: 'range', start: utils.addDay(time, - diff + 1), end: utils.addDay(time)});
    //                Timeline.items.update({id: 'range', start: time, end: utils.addDay(time, diff)});
                } else if (time >  utils.addDay(range.end, -1)) {
                    Timeline.items.update({id: 'range', start: utils.addDay(time, - diff + 1), end: utils.addDay(time)});
                }            
            } 

            if (range.start > single.start || range.end < single.end) { 
                adjust = true;
            }

            if (Timeline.actionType == ActionType.CLICK || adjust) {
                if (timelineController.type == TimelineType.RANGE_HOUR_MIN_TIED) {
                    let sanTime = event.snappedTime;
                    Timeline.items.update({id: 'single', start: sanTime, end: utils.addMinutes(sanTime,10)});
                } else {
                    Timeline.items.update({id: 'single', start: time, end: utils.addDay(time)});
                }
            }
        }

        single = Timeline.items.get('single');
        timelineController.time.imageryDate = single.start;
    }

    public static setTimeline() {
        if (! Timeline.rendered) {
            Timeline.rendered = true;      
            Timeline.render();
        }
    }

    private static _setTimeline ( evt : Event ) {
        if ((evt as CustomEvent).detail.id != "timeline") {
            return;
        }
        if ((evt as CustomEvent).detail.visible && ! Timeline.rendered) {   
            this.setTimeline();   
        }
        //window.dispatchEvent(new Event('resize'));
    }

    private static setSingleSlider() {
        let visible = false;
        if (!this.timeline) {
            return;
        }
        for (let i=0; i < props.layers.length; i++) {
            let lo = props.layers[i];
            if (lo.visible && lo.hasTime === true) {
                visible = true;
            }
            // remove ???
            if (((lo.handler == "imagery" && lo.noDateRefresh !== true)|| lo.handler == 'orbits' || lo.handler == "sentinel") && lo.visible) {
                visible = true;
            }
        }
        this.singleSliderVisible = visible;
        if (timelineController.type== TimelineType.RANGE_TIED || timelineController.type== TimelineType.RANGE_HOUR_MIN_TIED || timelineController.type== TimelineType.RANGE_SUBHOUR_TIED) {
            Timeline.setSingleDateSlider(visible);
            this.changeTimelineRangeMode();
        } else if (timelineController.type== TimelineType.SINGLE) {
            if (visible) {
                events.setControlState("timeline", true);
            } else {
                events.setControlState("timeline", false);
            }
            events.dispatch(events.EVENT_MENU_RESIZE);
        }
    }


    private static setSingleDateSlider (visible : boolean) {
        let els = document.getElementsByClassName("vis-time-slider-single");
        for (let i=0; i<els.length; i++) {
            (els[i] as HTMLDivElement).style.display = (visible) ? "block" : "none";
        }
    }


    public static getDates () : ITimelineItem | null {
        let obj : ITimelineItem = {};
        if (! Timeline.items) { 
            if (! this.timeKeeper) {
                return null;
            }
            obj["single"] = this.timeKeeper["single"];
            if (timelineController.type != TimelineType.SINGLE) {
                obj["range"] = this.timeKeeper["range"];
            }        
        } else {
            obj["single"] = { start: Timeline.items.get("single").start, end : Timeline.items.get("single").end};
            if (timelineController.type != TimelineType.SINGLE) {
                obj["range"] = { start: Timeline.items.get("range").start, end : Timeline.items.get("range").end};
            }
        }
        console.log(obj);
        return obj;
    }

    public static adjustTimeline (evt : CustomEvent) {
        console.log("ADJUSTING", evt);
        let type = evt.detail.type;
        let dates = timelineController.currentRange;
        if (! dates) { return null;}
        let start = dates.start;
        let end = dates.end;
        let end_simple = utils.addDay(start);
        let range = (timelineController.type == TimelineType.RANGE_SUBHOUR_TIED) ? timelineController.time.rangeMins : timelineController.time.range;
        switch (type) {
            case TimelineAdjustType.BACK_RANGE:
                if (timelineController.type == TimelineType.RANGE_SUBHOUR_TIED) {
                    start = utils.addMinutes(start, -range);
                    end = utils.addMinutes(end, -range);
                } else {
                    start = utils.addDay(start, - range -1);
                    end = utils.addDay(end, - range -1);
                    end_simple = utils.addDay(start);
                }
                break;
/*            case TimelineAdjustType.BACK_DAY:
                start = utils.addDay(start, - 1);
                end = utils.addDay(end, - 1);
                break;
            case TimelineAdjustType.FRONT_DAY:
                start = utils.addDay(start, 1);
                end = utils.addDay(end, 1);
                break;*/
            case TimelineAdjustType.FRONT_RANGE:
                if (timelineController.type == TimelineType.RANGE_SUBHOUR_TIED) {
                    start = utils.addMinutes(start, range);
                    end = utils.addMinutes(end, range);
                } else {
                    start = utils.addDay(start, range + 1);
                    end = utils.addDay(end, range + 1);
                    end_simple = utils.addDay(start);
                }
                break;
        }
        if (end > timelineController.maxDate || start < timelineController.minDate) { return; }
        if (! this.items ) {
            if (! this.timeKeeper) {
                this.timeKeeper = {};
            }
            if (timelineController.type == TimelineType.RANGE_TIED || timelineController.type == TimelineType.RANGE_HOUR_MIN_TIED || timelineController.type == TimelineType.RANGE_SUBHOUR_TIED) { 
                this.timeKeeper["range"] = {start: start, end: end}; 
            } 
            this.timeKeeper["single"] = {start: start, end: end_simple}; 
            this.notifyTimelineUpdate();
        } else {
            if (timelineController.type == TimelineType.RANGE_TIED || timelineController.type == TimelineType.RANGE_HOUR_MIN_TIED || timelineController.type == TimelineType.RANGE_SUBHOUR_TIED) { 
                this.items.update({id: "range", start: start, end: end});
            } 
            this.items.update({id: "single", start: start, end: end_simple});

            if (this.timeline) {
                this.timeline.moveTo(start);
            }
        }
        this.notifyTimelineUpdate();
    }

    private static refreshDate () {
        let range = timelineController.time.range;
        let mins = timelineController.time.rangeMins;
        let endDay = timelineController.time.date;
        let time = utils.sanitizeDate(endDay, false);
        if (! Timeline.items) { 
            if (! this.timeKeeper) {
                this.timeKeeper = {};
            }
            if (timelineController.type == TimelineType.SINGLE) {
                this.timeKeeper["single"] = {start: time, end: utils.addDay(time)};
            } else if (timelineController.type == TimelineType.RANGE_TIED || timelineController.type == TimelineType.RANGE_HOUR_MIN_TIED )  {
                this.timeKeeper["range"] = {start: utils.addDay(time, - range), end: utils.addDay(time)};
            } else if (timelineController.type == TimelineType.RANGE_SUBHOUR_TIED) {
                this.timeKeeper["range"] = {start: utils.addMinutes(endDay, -mins), end: utils.addDay(time)};                
            }
            if (timelineController.type != TimelineType.SINGLE) {
                this.timeKeeper["single"] = {start: time, end: utils.addDay(time)};
            }

            this.notifyTimelineUpdate();
        } else {
            if (timelineController.type == TimelineType.SINGLE) {
                Timeline.items.update({id: 'single', start: time, end: utils.addDay(time)});
            } else if (timelineController.type == TimelineType.RANGE_TIED ) {
                Timeline.items.update({id: 'range', start: utils.addDay(time, - range), end: utils.addDay(time)});
            } else if (timelineController.type == TimelineType.RANGE_HOUR_MIN_TIED) {
                if (endDay > timelineController.maxDate) { 
                    endDay = timelineController.maxDate; 
                }
                let startDay = utils.addMinutes(endDay, -10);
                Timeline.items.update(
                    {id: 'range', start: utils.addDay(time, - range), end: utils.addDay(time)}
                );
                Timeline.items.update(
                    {id: 'single', start: startDay, end: endDay}
                );
            } else if (timelineController.type == TimelineType.RANGE_SUBHOUR_TIED) {
                if (endDay > timelineController.maxDate) { 
                    endDay = timelineController.maxDate; 
                }
                let startDay = utils.addMinutes(endDay, -mins);
                Timeline.items.update(
                    {id: 'range', start: startDay, end: endDay}
                );
                let mindate = new Date(endDay.getTime());
                mindate.setMinutes(mindate.getMinutes() - 10);
    
                Timeline.items.update(
                    {id: 'single', start: mindate, end: endDay}
                );
            }
            if (this.timeline) {
                this.timeline.moveTo(endDay);
                this.notifyTimelineUpdate();
            }
        }
    }

    private static setCurrentRange() {
        // set timelineController.currentRange;
        let tt = (timelineController.type == TimelineType.RANGE_TIED || timelineController.type == TimelineType.RANGE_HOUR_MIN_TIED 
            || timelineController.type == TimelineType.RANGE_SUBHOUR_TIED) ? "range" : "single";
        if (!Timeline.items || ! Timeline.items.get(tt)) { 
            if (! this.timeKeeper) {
                timelineController.currentRange = null;
            }
            timelineController.currentRange = this.timeKeeper[tt];
        } else {
            let start = Timeline.items.get(tt).start;
            let end = Timeline.items.get(tt).end;
            timelineController.currentRange = {start : start, end : end};
        }
    }

    public static delete () {
        if (this.div) {
            this.div.innerHTML = '';
        }
        if (this.timeline) {
            this.timeline.destroy();
            this.timeline = null;
            this.items = null;   
        }
        if (timelineController.type == TimelineType.RANGE_TIED || timelineController.type == TimelineType.RANGE_HOUR_MIN_TIED || timelineController.type == TimelineType.RANGE_SUBHOUR_TIED) {
            rangePicker.delete();
        } else if (timelineController.type == TimelineType.SINGLE) {
            singleDatePicker.delete();
        }
        this.rendered = false;
    }

}