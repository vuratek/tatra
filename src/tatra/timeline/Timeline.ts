import './css/*.scss';
import { utils } from '../utils';
import { events } from '../map/events';
import { props } from '../map/props';
import { rangePicker } from './rangePicker';
import { singleDate } from './singleDate';
import { loadHandler } from "./loadHandler";

export enum TimelineType {
    SINGLE      = "single",
    RANGE_TIED  = "range_tied"
}

export enum ActionType {
    CLICK       = "click",      // outside of range
    MOVE        = "move",       // dragging range or inside the range
    NONE        = "none"
}

export enum TimelineAdjustType {
    BACK_RANGE  = "backrange",      // jump entire length of timerange
    BACK_DAY    = "backday",       // move one day forward
    FRONT_DAY   = "frontday",
    FRONT_RANGE = "frontrange"
}

export interface ITimelineRanges {
    start   : Date;
    end     : Date;
}
export interface ITimelineItem {
    [key : string] : ITimelineRanges;
}
interface VisTimeline {}
interface DataSet <T> {}
export class Timeline {

    private static div                  : HTMLDivElement;
    private static id                   : string;
    private static container            : HTMLDivElement;
    private static timeline             : VisTimeline | null = null;
    private static items                : DataSet <any> | null = null;
    private static type                 : TimelineType = TimelineType.SINGLE;
    private static options              : any = {};
    private static timeKeeper           : ITimelineItem | null = null;

    private static actionType           : ActionType = ActionType.NONE;
    private static draggedId            : string = '';
    private static minusDragDirection   : boolean = true;
    private static currentZoomMaxLevel  : number = 30;
    private static currentZoomMinLevel  : number = 30;

    public static readonly EVENT_TIMELINE_UPDATED       : string = "timeline_updated";
    public static readonly EVENT_TIMELINE_LOADED        : string = "timeline_loaded";

    public static MAX_DAYS             : number = 31;
    public static advancedRange         : number = 2;
    public static singleDate            : Date = utils.getGMTTime(new Date());

    public static isActive              : boolean = false;
    private static initialized          : boolean = false;
    private static rendered             : boolean = false;

    public static minDate               : Date = new Date(2000, 10, 11, 0, 0, 0);
    public static maxDate               : Date = utils.sanitizeDate(utils.addDay(utils.getGMTTime(new Date())), true);

    public static singleSliderVisible   : boolean = false;

    public static init (divId : string, type : TimelineType = TimelineType.SINGLE) {
        this.type = type;        
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
            document.addEventListener(Timeline.EVENT_TIMELINE_LOADED, () => this.initTimeline());
            window.addEventListener("resize", () => this.resize());
        }
        this.rendered = false;
    }

    private static initTimeline () {
        // Create a DataSet (allows two way data-binding)

        let arr = [];
        //use this.timeKeeper
        if (!this.timeKeeper) { return; }
        if (! this.items) {
            arr.push({id: 'single', content: '', start: this.timeKeeper["single"].start, end: this.timeKeeper["single"].end, type: 'range', className: 'vis-time-slider-single' });
            if (this.type == TimelineType.RANGE_TIED) {
                if (! this.timeKeeper["range"]) { return; }
                arr.push({id: 'range', content: '', start: this.timeKeeper["range"].start, end: this.timeKeeper["range"].end, type: 'range', className: 'vis-time-slider-range' });
            } 
            
            this.items = new vis.DataSet(arr);
        }
        utils.removeClass('timeline', 'timelineMissing');

        this.setZoomLevel();

        let tl = document.getElementById('timeline') as HTMLDivElement;
        this.options = {
            min: this.minDate,
            max: this.maxDate,
            zoomable : true,
            editable: true,
            margin: {
                axis: 0            
            },
            orientation: 'top',
            selectable : false,
            stack: false,
            horizontalScroll: true,
            /*showMinorLabels : false,*/
            zoomMax : (1000 * 60 * 60 * 24 * this.currentZoomMaxLevel),
            zoomMin : (1000 * 60 * 60 * 24 * this.currentZoomMinLevel),
            zoomFriction : 30,
            timeAxis: {scale: 'day', step: 1},
            
            snap: function (date : Date, scale : string, step : number) {
                let d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
                if (date.getHours() > 12) {
                    d = utils.addDay(d);
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
            this.timeline.moveTo(utils.sanitizeDate(this.singleDate, true));
            if (Timeline.type == TimelineType.SINGLE) {
                this.timeline.on('click', (evt) => this.onClick(evt));
            } else if (Timeline.type == TimelineType.RANGE_TIED) {
                this.timeline.on('mouseUp', (evt)=> this.onMouseUp(evt));
                this.timeline.on("mouseDown", (evt) => this.onMouseDown(evt));
                this.timeline.on("changed", ()=> this.onChanged());    
            }            
        }

        this.setSingleSlider();
    }

    public static resize() {
        this.setZoomLevel();
        if (this.timeline) {
            this.timeline.setOptions(
                {
                    zoomMax : (1000 * 60 * 60 * 24 * this.currentZoomMaxLevel),
                    zoomMin : (1000 * 60 * 60 * 24 * this.currentZoomMinLevel)
                }
            );
            //this.timeline.zoomOut(1);
        } else {
            utils.removeClass('timeline', 'timelineMissing');
            this.initTimeline();
        }
    }

    private static render() {
        this.timeKeeper = {};
        this.timeKeeper["single"] = { start: utils.sanitizeDate(this.singleDate, true), end : utils.sanitizeDate(utils.addDay(this.singleDate), true)};
        if (this.type == TimelineType.RANGE_TIED) {
            this.timeKeeper["range"] = { start: utils.sanitizeDate(utils.addDay(utils.getGMTTime(new Date()), this.advancedRange), true), end : utils.maximizeDate(utils.addDay(utils.getGMTTime(new Date())), true)};
        } 
        if (this.type == TimelineType.RANGE_TIED) {
            rangePicker.render(this.id)
        } else if (this.type == TimelineType.SINGLE) {
            singleDate.render(this.id);
        }
        this.renderTimelineWrap(this.id);
        this.container = document.createElement("div");
        this.container.setAttribute("id", "timeline_main");
        let wrap = document.getElementById('timelineWrap') as HTMLDivElement;        
        wrap.appendChild(this.container); 
    
        utils.addClass('timeline', 'timelineMissing');
        loadHandler.load();        
    }

    private static setZoomLevel () {
        let w = window.innerWidth;
        if (w < 700) { 
            this.currentZoomMaxLevel = 10; 
            this.currentZoomMinLevel = 10; 
        }
        else if (w < 900) { 
            this.currentZoomMinLevel = 10; 
            this.currentZoomMaxLevel = 20; 
        }
        else if ( w < 1200) { 
            this.currentZoomMinLevel = 20;
            this.currentZoomMaxLevel = 30;
        }
        else { 
            this.currentZoomMinLevel = 30; 
            this.currentZoomMaxLevel = 50; 
        }
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

    private static onChanged() {
        if (! Timeline.items) {
            return;
        }
        if (Timeline.type == TimelineType.RANGE_TIED) {
            let range = Timeline.items.get('range');
            let single = Timeline.items.get('single');

            if (range.start > utils.addDay(Timeline.maxDate, -1)) {
                Timeline.items.update({id: 'range', start:  utils.addDay(Timeline.maxDate,-Timeline.advancedRange -1), end: Timeline.maxDate});
            } 
            if (single.start > utils.addDay(Timeline.maxDate, -1)) {
                Timeline.items.update({id: 'single', start:  utils.addDay(Timeline.maxDate,-1), end: Timeline.maxDate});
            } 

            range = Timeline.items.get('range');
            single = Timeline.items.get('single');

            let diff = utils.getDayDiff(new Date(range.start), new Date(range.end));
            let setDate = Timeline.MAX_DAYS;
            if (diff < 1) { setDate = 1;}
            if (diff > Timeline.MAX_DAYS || diff < 1) {
                Timeline.items.update({id: 'range', start: range.start, end: utils.addDay(range.start, setDate)});
                if (Timeline.minusDragDirection) {
                    Timeline.items.update({id: 'range', start: range.start, end: utils.addDay(range.start, setDate)});
                } else {
                    Timeline.items.update({id: 'range', start: utils.addDay(range.end, -setDate), end: range.end});
                }
            }

            if (range.start > single.start) {
                if (Timeline.draggedId == 'single') {
                    Timeline.items.update({id: 'range', start: single.start, end: utils.addDay(single.start, diff)});
                } else {
                    Timeline.items.update({id: 'single', start: range.start, end: utils.addDay(range.start)});
                }
            }
            else if (range.end < single.end) { 
                if (Timeline.draggedId == 'single') {
                    Timeline.items.update({id: 'range', start: utils.addDay(single.end, -diff), end: single.end});
                } else {
                    Timeline.items.update({id: 'single', start: utils.addDay(range.end, -1), end: range.end});
                }
            }
        }
        if (Timeline.type == TimelineType.RANGE_TIED) {
            let range = Timeline.items.get('range');
            if (range.end > Timeline.maxDate) {
                Timeline.items.update({id: 'range', start: utils.addDay(Timeline.maxDate, -Timeline.advancedRange-1), end: Timeline.maxDate});
                Timeline.items.update({id: 'single', start: utils.addDay(Timeline.maxDate, -1), end: Timeline.maxDate});
            }
        }
        let obj = Timeline.getDates();
        if (obj) {
            let diff = utils.getDayDiff(obj["range"].start, obj["range"].end) - 1;
            Timeline.singleDate = obj["single"].start;
            Timeline.advancedRange = diff;
            Timeline.eventTimelineUpdate();
        }
    }

    private static onMouseUp (event : Event) {
        Timeline.onClick(event);
    }

    private static onClick (event : Event) {
        if (! Timeline.items) { return; }
        let time = utils.sanitizeDate(event.time);
        let single = Timeline.items.get('single');
        if (Timeline.type == TimelineType.SINGLE) {
            Timeline.items.update({id: 'single', start: time, end: utils.addDay(time)});
            Timeline.eventTimelineUpdate();
            return;
        }
        let range = Timeline.items.get('range');
        let adjust = (time >= range.start && time <= range.end) ? true : false;
        let diff = utils.getDayDiff(new Date(range.start), new Date(range.end));

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
            Timeline.items.update({id: 'single', start: time, end: utils.addDay(time)});
        }

        single = Timeline.items.get('single');
        Timeline.singleDate = single.start;

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
            if ((lo.handler == "imagery" || lo.handler == 'orbits') && lo.visible) {
                visible = true;
            }
        }
        this.singleSliderVisible = visible;
        if (this.type == TimelineType.RANGE_TIED) {
            Timeline.setSingleDateSlider(visible);
        } else if (this.type == TimelineType.SINGLE) {
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

    private static eventTimelineUpdate () {
        document.dispatchEvent(new CustomEvent(Timeline.EVENT_TIMELINE_UPDATED));
    }

    public static eventTimelineLoaded () {
        document.dispatchEvent(new CustomEvent(Timeline.EVENT_TIMELINE_LOADED));
    }

    public static getDates () : ITimelineItem | null {
        let obj : ITimelineItem = {};
        if (! Timeline.items) { 
            if (! this.timeKeeper) {
                return null;
            }
            obj["single"] = this.timeKeeper["single"];
            if (Timeline.type == TimelineType.RANGE_TIED) {
                obj["range"] = this.timeKeeper["range"];
            }        
        } else {
            obj["single"] = { start: Timeline.items.get("single").start, end : Timeline.items.get("single").end};
            if (Timeline.type == TimelineType.RANGE_TIED) {
                obj["range"] = { start: Timeline.items.get("range").start, end : Timeline.items.get("range").end};
            }
        }
        return obj;
    }

    public static adjustTimeline (type : string) {
        let dates = this.getCurrentRange();
        if (! dates) { return null;}
        let start = dates.start;
        let end = dates.end;
        let range = this.advancedRange;
        switch (type) {
            case TimelineAdjustType.BACK_RANGE:
                start = utils.addDay(start, - range -1);
                end = utils.addDay(end, - range -1);
                break;
            case TimelineAdjustType.BACK_DAY:
                start = utils.addDay(start, - 1);
                end = utils.addDay(end, - 1);
                break;
            case TimelineAdjustType.FRONT_DAY:
                start = utils.addDay(start, 1);
                end = utils.addDay(end, 1);
                break;
            case TimelineAdjustType.FRONT_RANGE:
                start = utils.addDay(start, range + 1);
                end = utils.addDay(end, range + 1);
                break;
        }
        if (end > this.maxDate || start < this.minDate) { return; }
        if (! this.items ) {
            if (! this.timeKeeper) {
                this.timeKeeper = {};
            }
            if (Timeline.type == TimelineType.RANGE_TIED) { 
                this.timeKeeper["range"] = {start: start, end: end}; 
            } else {
                this.timeKeeper["single"] = {start: start, end: end}; 
            }
            this.eventTimelineUpdate();
        } else {
            if (Timeline.type == TimelineType.RANGE_TIED) { 
                this.items.update({id: "range", start: start, end: end});
            } else {
                this.items.update({id: "single", start: start, end: end});
            }
            if (this.timeline) {
                this.timeline.moveTo(start);
                this.eventTimelineUpdate();
            }
        }
    }

    public static setDate (endDay : Date, range : number) {
        this.advancedRange = range;
        let time = utils.sanitizeDate(endDay);
        if (! Timeline.items) { 
            if (! this.timeKeeper) {
                this.timeKeeper = {};
            }
            if (Timeline.type == TimelineType.SINGLE) {
                this.timeKeeper["single"] = {start: time, end: utils.addDay(time)};
            } else if (Timeline.type == TimelineType.RANGE_TIED)  {
                this.timeKeeper["range"] = {start: utils.addDay(time, - range), end: utils.addDay(time)};
            }
            this.eventTimelineUpdate();
        } else {
            if (Timeline.type == TimelineType.SINGLE) {
                Timeline.items.update({id: 'single', start: time, end: utils.addDay(time)});
            } else if (Timeline.type == TimelineType.RANGE_TIED)  {
                Timeline.items.update({id: 'range', start: utils.addDay(time, - range), end: utils.addDay(time)});
            }
            if (this.timeline) {
                this.timeline.moveTo(time);
                this.eventTimelineUpdate();
            }
        }
    }

    public static getCurrentRange () : ITimelineRanges | null {
        let tt = (Timeline.type == TimelineType.RANGE_TIED) ? "range" : "single";
        if (!Timeline.items || ! Timeline.items.get(tt)) { 
            if (! this.timeKeeper) {
                return null;
            }
            return this.timeKeeper[tt];
        }
        let start = Timeline.items.get(tt).start;
        let end = Timeline.items.get(tt).end;
        return {start : start, end : end};
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
        if (Timeline.type == TimelineType.RANGE_TIED) {
            rangePicker.delete();
        } else if (Timeline.type == TimelineType.SINGLE) {
            singleDate.delete();
        }
        this.rendered = false;
    }

}