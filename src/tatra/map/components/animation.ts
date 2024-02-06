import { baseComponent } from "./BaseComponent";;
import flatpickr from 'flatpickr';
import { utils } from "../../utils";
import { props } from "../props";
import { timelineController } from "../../timeline/timelineController";
import { events } from "../events";
import { MapTime } from "../obj/MapTime";
import { Modal } from "../../aux/Modal";
import { IImageObj, imageUtils } from "../imageUtils";
import { GroupContent } from "../../aux/GroupContent";

export enum VIDEO_TRANSITION {
    HARD            = "hard",
    SOFT            = "soft",
    CONTINUOUS      = "continuous"
}
export interface IVideoFrame {
    date            : Date;                     // which date does it represent
    range           : number;                   // # of days
    rangeMins       : number;
    imageObj        : IImageObj | null;         // image/data information
    loaded          : boolean;                  // is data available
    visualized      : boolean;                  // has it appeared in the menu
    width           : number;                   // width of the image (may or may not match the video size)
    height          : number;                   // height of the image
    duration        : number;                   // miliseconds
    transition      : VIDEO_TRANSITION;         // how does frame execute
}

export interface IVideo {
    width           : number;
    height          : number;
    frames          : Array<IVideoFrame>;
    label           : string;
    speed           : number;
    step            : string;
    orig_time       : MapTime;
    timerCounter    : number;
    ignoreCounter   : boolean;
}

export class AnimationProps {
    public loadTimer                : Function | null = null;
    public playTimer                : Function | null = null;
    public videoPlaying             : boolean = false;
    public defaultFrames            : number = 1;
    public maxFrames                : number = 50;
    public intervalDelay            : number = 50;      // miliseconds for frame loading timer
    public videoDelay               : number = 10;      // miliseconds for video play timer
    public maxWait                  : number = 50;      // # of times counter gets updated before it is done
    public frameLoaderCounter       : number = 0;
    public framePlayCounter         : number = 0;
    public framePlayDurationCounter : number = 0;
    public transitionSoftDelay      : number = 450;     // ms for transitioning image
}

export class animation extends baseComponent {
	public static id		            : string = 'animation';
	public static label		            : string = 'Animate';
	public static draggable             : boolean = true;
	public static className             : string = 'transparentWindow';
    public static showHeader            : boolean = false;
    public static calendarFrom          : any;
    public static calendarTo            : any;
    public static readonly df           : string = 'M d Y';

    private static video                : IVideo | null = null;
    private static isActive             : boolean = false;
    private static videoProps           : AnimationProps = new AnimationProps();
    private static videoModal           : Modal | null = null;
    private static defaultDuration      : number = 2500;
    private static defaultTransition    : VIDEO_TRANSITION = VIDEO_TRANSITION.SOFT;
    private static defaultVideoReload   : boolean = true;
    
    
    public static init () {
        super.init();
        document.addEventListener(events.EVENT_RENDER_COMPLETE, (evt) => this.updateImage());
    }

	public static createWindow () {
		super.createWindow();

		let el = document.getElementById(`lmvControls_${this.id}_Content`) as HTMLDivElement;
		if (! el) { return; }
		el.innerHTML = `
			<div id="lmvDragLbl_${this.id}" class="transparentWindowLabel">
				<span id="lmvControls_${this.id}_Layer" class="opacityTitleLbl">Animate</span>
			</div>
			<div style="width:100%;" class="lmvAnimation">
                <table>
                    <tr>
                        <td>From:</td>
                        <td>
                            <span id="animationCalendarFrom" class="mdsCalendar"><i class="fa fa-calendar-alt fa-lg"></i></span>
                            <input type="text" id="animation_dateFrom" readonly>
                        </td>
                    </tr>
                    <tr>
                        <td>Step:</td>
                        <td>
                            <select id="lmvControls_${this.id}_step">
                                <option value="1d" selected>1 Day</option>
                                <option value="2d">2 Days</option>
                                <option value="3d">3 Days</option>
                                <option value="4d">4 Days</option>
                                <option value="5d">5 Days</option>
                                <option value="6d">6 Days</option>
                                <option value="7d">7 Days</option>
                                <option value="10d">10 Days</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td>To:</td>
                        <td>
                            <span id="animationCalendarTo" class="mdsCalendar"><i class="fa fa-calendar-alt fa-lg"></i></span>
                            <input type="text" id="animation_dateTo" readonly>
                        </td>
                    </tr>
                </table>
                <div>
                    <div id="anim_btn_load_video" class="anim_btn_load_video">Load Video</div>
                </div>
			</div>	
		`;
        super.setDraggable(`lmvDragLbl_${this.id}`);
        let d1 = utils.addDay(props.time.date, -this.videoProps.defaultFrames+1);
        this.initDatePicker(d1, "From");
        this.initDatePicker(props.time.date, "To");
        utils.setClick('anim_btn_load_video', ()=>this.loadFrames());
    }

	public static open() {
		super.open();
		let mh = (document.getElementById('map') as HTMLDivElement).clientHeight;
		let mw = (document.getElementById('map') as HTMLDivElement).clientWidth;
		let posy = 0;
		let posx = 0;
		if (mh > 500) {
			posy = mh - 300;
		}
		if (mw > 400 && mw < 800) {
			posx = 50;
		} else if (mw > 600) {
			posx = mw / 2 - 150;
		}		
		this.position(posx, posy);
    }

    public static close() {
        super.close();
        this.isActive = false;
    }

    public static loadFrames() {
        this.videoModal = new Modal({id: 'video', style : 'modalVideo'});
        let el = this.videoModal.getContent();
        this.videoModal.open();
        let cont = document.getElementById(el) as HTMLDivElement;
        if (! cont) { return; }
        cont.innerHTML = `
            <div id="videoBack"></div>
            <div id="videoLibrary">
                <div id="videoLibraryTitle">Animation Data Control</div>
                <div id="videoLibraryList"></div>
                <div id="videoLaunch">Play</div>
                <div id="videLibraryClose" class="modalCloseIcon">
                    <i class="fa fa-times" aria-hidden="true"></i>
                </div>
            </div>
            <div id="videoStage">
                <canvas class="video_canvas" id="video_canvas_bottom"></canvas>
                <canvas class="video_canvas" id="video_canvas_top"></canvas>
                <div id="videoControlsWrap">
                    <div id="videoControls">
                        <div class="vcBtn" id="vcPlay"><i class="fa fa-play"></i></div>
                        <div class="vcBtn" id="vcPause"><i class="fa fa-pause"></i></div>
                        <div class="vcBtn" id="vcStop"><i class="fa fa-stop"></i></div>
                        <div class="vcBtn" id="vcReload"><i class="fa fa-sync"></i></div>
                    </div>
                </div>
            </div>
        `;
        utils.setClick('videoLaunch', ()=> this.controlVideo('play'));
        utils.hide('videoLaunch');
        utils.hide('videoStage');
        utils.setClick('vcPlay', ()=>this.controlVideo('play'));
        utils.setClick('vcPause', ()=>this.controlVideo('pause'));
        utils.setClick('vcStop', ()=>this.controlVideo('stop'));
        utils.setClick('vcReload', ()=>this.controlVideo('reload'));
        utils.setClick('videLibraryClose', ()=>this.videoModal.close());
        utils.hide('vcPause');
        this.setVideoReload();

        let sd = utils.sanitizeDate(this.calendarFrom.selectedDates[0]);
        let ed = utils.sanitizeDate(this.calendarTo.selectedDates[0]);
        let _step = utils.getSelectValue(`lmvControls_${this.id}_step`);
        let step = 1;
        if (_step.indexOf('d')>=0) {
            step = Number(_step.replace('d', ''));
        }
        if (sd > ed) { return; }
        let size = props.map.getSize();
        if (!size) {
            return;
        }
        let time = new MapTime();
        time.date = props.time.date;
        time.imageryDate = props.time.imageryDate;
        time.quickTime = props.time.quickTime;
        time.range = props.time.range;
        time.rangeMins = props.time.rangeMins;
        this.video = { 
            width : size[0], 
            height : size[1], 
            step : _step, 
            frames : [], 
            label : 'Test video', 
            speed : 5,
            timerCounter : 0,
            ignoreCounter : false,
            orig_time : time 
        };
        let date = sd;
        let frame = 0;
        let run = true;
        while (run) {
            frame ++;
            this.video.frames.push({
                date: date, 
                range : props.time.range,
                rangeMins : props.time.rangeMins,
                imageObj : null, 
                loaded : false, 
                visualized : false, 
                width : this.video.width, 
                height : this.video.height,
                duration : this.defaultDuration,
                transition : VIDEO_TRANSITION.SOFT
            });
            date = utils.addDay(date, step);
            // quit when over max frames or time reaches end point
            if (frame == this.videoProps.maxFrames || flatpickr.formatDate(date, 'Y-m-d') > flatpickr.formatDate(ed, 'Y-m-d')) {
                run = false;
            }
        }
        console.log(this.video);
        this.videoProps.frameLoaderCounter = 0;
        this.isActive = true;
        if ( ! this.videoProps.loadTimer) {
            this.videoProps.loadTimer = ()=> this.updateTimer();
            setInterval(this.videoProps.loadTimer, this.videoProps.intervalDelay);
        }
        this.renderPopup();
        this.processFrames();
    }

    private static renderPopup() {
        let par = document.getElementById('videoLibraryList') as HTMLDivElement;
        this.renderControlOptions(par);
        let id = 'videoFramesList';

        GroupContent.create({ id: id, label : 'Animation Frames', parent: par, opened : true});
        let base = GroupContent.getContainer(id);
		let ul = document.createElement('ul');
		ul.id = id + '_content';
		ul.className = 'vidFrmList';
        base.appendChild(ul);
        let h = this.video.height;
        let w = this.video.width;

        for (let i=0; i<this.video.frames.length; i++) {
            let frame = this.video.frames[i];
            let li = document.createElement('li');
            li.id = ul.id + '_f_' + i.toString();
            ul.appendChild(li);
            let fid = ul.id + '_c_' + i.toString();
            let date = flatpickr.formatDate(frame.date, 'Y-m-d');
            let date2 = flatpickr.formatDate(frame.date, 'Y-m-d');
            let range = frame.range;
            if (frame.rangeMins == 0) {
                date2 = flatpickr.formatDate(utils.addDay(frame.date, -range), 'Y-m-d');
            }
            if (date == date2) {
                date2 = '';
            } else {
                date2 = ' - ' + date2;
            }
            
            li.innerHTML = `
                <canvas id="${fid}"></canvas>
                <div class="vfl_info">
                    <div class="vfl_info_date">${date}${date2}</div>
                    <div class="vfl_info_state" id="vfl_state_${i.toString()}"></div>
                </div>
            `;
            let can = document.getElementById(fid) as HTMLCanvasElement;
            can.width = w;
            can.height = h;
        }
        this.updateVideoImages();
    }

    private static renderControlOptions (base : HTMLDivElement) {
        let el = document.createElement("div");
        el.id = "vidFrameCtrl";
        base.appendChild(el);
        el.innerHTML = `
            <span>Frame duration: </span>
            <select id="vidFrameDuration">
                <option value="500">500ms</option>
                <option value="750">750ms</option>
                <option value="1000">1s</option>
                <option value="1250">1.25s</option>
                <option value="1500">1.5s</option>
                <option value="2000">2s</option>
                <option value="2500">2.5s</option>
                <option value="3000">3s</option>
                <option value="4000">4s</option>
                <option value="5000">5s</option>
                <option value="7000">7s</option>
                <option value="10000">10s</option>
            </select>
            <span>Transition: </span>
            <select id="vidFrameTransition">
                <option value="${VIDEO_TRANSITION.SOFT}">Soft</option>
                <option value="${VIDEO_TRANSITION.HARD}">Hard</option>
                <option value="${VIDEO_TRANSITION.CONTINUOUS}">Continuous</option>
            </select>
        `;
        utils.setSelectValue('vidFrameDuration', this.defaultDuration.toString());
        utils.setChange('vidFrameDuration', ()=>this.updateDuration());
        utils.setSelectValue('vidFrameTransition', this.defaultTransition);
        utils.setChange('vidFrameTransition', ()=>this.updateTransition());
    }

    private static updateDuration() {
        let val = utils.getSelectValue('vidFrameDuration');
        this.defaultDuration = Number(val);
        for (let i=0; i< this.video.frames.length; i++) {
            this.video.frames[i].duration = this.defaultDuration;
        }
    }
    private static updateTransition() {
        let val = utils.getSelectValue('vidFrameTransition') as VIDEO_TRANSITION;
        this.defaultTransition = val;
        for (let i=0; i< this.video.frames.length; i++) {
            this.video.frames[i].transition = this.defaultTransition;
        }
    }

    private static updateImage() {
//        console.log('updateImage', this.isActive);
        if (! this.isActive) { return; }
        if (this.video) {
            // reset counter when image is updated so it waits until another potential update or timeout
            this.video.timerCounter = 0;  
            this.video.ignoreCounter = false;    
        }
    }

    private static processFrames() {
        if (!this.video || !this.video.frames) { return; }
        if (this.videoProps.frameLoaderCounter >= this.video.frames.length) {
            // DONE
            return;
        }
        props.time.date = this.video.frames[this.videoProps.frameLoaderCounter].date;
		props.time.imageryDate = this.video.frames[this.videoProps.frameLoaderCounter].date;
        this.videoProps.frameLoaderCounter++;
        this.video.ignoreCounter = false;
        this.setTimelineController();
		timelineController.refreshTimelineDate();
		events.dispatch(events.EVENT_SYSTEM_DATE_UPDATE);
    }

    public static setTimelineController() {
		timelineController.time.imageryDate = props.time.imageryDate;
		timelineController.time.date = props.time.date;
		timelineController.time.range = props.time.range;
        timelineController.time.rangeMins = props.time.rangeMins;
        console.log(flatpickr.formatDate(timelineController.time.date,'Y-m-d'), timelineController.time.range);
	}

    public static initDatePicker (d : Date, type : string) {
        let option = this;
        let calendar = this.calendarFrom;
        let minDate =  new Date(2000,11-1, 11);
        let maxDate = utils.getGMTTime(new Date());
        if (type == "To") {
            calendar = this.calendarTo;
            minDate = this.calendarFrom.selectedDates[0];
            d = utils.addDay(minDate, this.videoProps.defaultFrames-1);
            let maxDate2 = utils.addDay(minDate, this.videoProps.maxFrames-1);
            if (maxDate2 < maxDate) {
                maxDate = maxDate2;
            }
            if (d > maxDate) {
                d = maxDate;
            }
        } 
        if (calendar) {
            calendar.destroy();
        }
        console.log(type, 'start, end', minDate, maxDate);
        calendar = flatpickr("#animation_date" + type, {
            dateFormat : this.df,
            defaultDate : d,
            minDate : minDate,
            maxDate : maxDate,
            onChange : function () {
                option.setDates(type);
            }
        }) as Instance;

        if (type == "From") {
            this.calendarFrom = calendar;
        } else {
            this.calendarTo = calendar;
        }
//        this.setDates();
    }

    private static setDates(type : string) {
        if (type == 'From') {
            let minDate = this.calendarFrom.selectedDates[0];
            let maxDate = utils.getGMTTime(new Date());
            let maxDate2 = utils.addDay(minDate, this.videoProps.maxFrames-1);
            let date = this.calendarTo.selectedDates[0];
            if (maxDate2 < maxDate) {
                maxDate = maxDate2;
            }
            if (date > maxDate) {
                date = maxDate;
            }

            this.calendarTo.set("minDate",minDate);
            this.calendarTo.set("maxDate",maxDate);
            this.calendarTo.setDate(date);
        }
    }
    private static updateTimer() {
        if (! this.video || this.video.ignoreCounter) { return; }
        if (this.video.timerCounter < this.videoProps.maxWait) {
            this.video.timerCounter ++;
        }
        if (this.video.timerCounter >= this.videoProps.maxWait) {
            this.video.ignoreCounter = true;    // block counter until new frame is loaded
            this.video.timerCounter = 0;
            // load new frame
            this.processImage();
        }
    }
    private static processImage() {
        if (! this.video) { return;}
        let frame = this.video.frames[this.videoProps.frameLoaderCounter-1];
        frame.imageObj = imageUtils.renderScreenshot();
        frame.loaded = true;
        frame.visualized = false;
        this.updateVideoImages();
        this.processFrames();
    }
    private static updateVideoImages() {
        let allLoaded = true;
        if (! this.video) { return; }
        let frames = this.video.frames;
        if (frames.length == 0) {
            allLoaded = false;
        }
        for (let i=0; i<frames.length; i++) {
            let state = 'waiting';
            let id = `vfl_state_${i.toString()}`;
            if (frames[i].loaded) {
                state = 'ready';
                utils.addClass(id,'vfl_info_ready');
                utils.removeClass(id,'vfl_info_loading');
            } else {
                if (i == this.videoProps.frameLoaderCounter) {
                    state = 'loading';
                    utils.addClass(id,'vfl_info_loading');
                }
            }
            utils.html(id, state);
            // visualize new frame
            if (frames[i].loaded && ! frames[i].visualized) {
                frames[i].visualized = true;
                this.drawVideoImage(i);
            }
            if (!frames[i].loaded || !frames[i].visualized) {
                allLoaded = false;
            }
        }
        if (allLoaded) {
            utils.show('videoLaunch');
        } else {
            utils.hide('videoLaunch');
        }
    }

    private static drawVideoImage(index : number) {
        let i = index;
        let id = "videoFramesList_content_c_" + i.toString();
        let canvas = document.getElementById(id) as HTMLCanvasElement;
        if (canvas) {
            let context = canvas.getContext('2d');
            let frame = this.getVideoFrame(index);
            if (context && frame && frame.imageObj) {
                context.drawImage(frame.imageObj.image, 0, 0);
            }
        }
    }
    private static getVideoFrame(i : number) : IVideoFrame | null {
        if (this.video && this.video.frames.length > i && this.video.frames[i].imageObj) {
            return this.video.frames[i];
        }
        return null;
    }
    private static controlVideo (btn : string) {
        if (btn == "stop") {
            utils.hide('videoStage');
            utils.show('videoLibrary');
            utils.removeClass('mapMaxLabel', 'vidTopLabel');
            this.videoProps.videoPlaying = false;
            this.videoProps.framePlayCounter = 0;           // reset frames to 0 so they start from beginning
            this.videoProps.framePlayDurationCounter = 0;      // reset duration counter
        } else if (btn == "play") {
            utils.showCustom('vcPause', "inline-block");
            utils.hide('vcPlay');
            utils.show('videoStage');
            utils.addClass('mapMaxLabel', 'vidTopLabel');
            utils.hide('videoLibrary');    
            this.videoProps.videoPlaying = true;
            this.playAnimation();
        } else if (btn == "pause") {
            this.videoProps.videoPlaying = false;
            utils.hide('vcPause');
            utils.showCustom('vcPlay', "inline-block");
        } else if (btn == 'reload') {
            this.defaultVideoReload = ! this.defaultVideoReload;
            this.setVideoReload();
        }
    }
    private static playAnimation() {
        if ( ! this.videoProps.playTimer) {
            this.videoProps.playTimer = ()=> this.renderAnimation();
            setInterval(this.videoProps.playTimer, this.videoProps.videoDelay);
        }
    }

    private static renderAnimation () {
        if (! this.videoProps.videoPlaying || this.video.frames.length == 0) { return; }     // video is paused / or no frames
        // if video is at the end
        if (this.videoProps.framePlayCounter >= this.video.frames.length) { 
            this.videoProps.framePlayCounter = 0;
            this.videoProps.framePlayDurationCounter = 0;
            if (!this.defaultVideoReload) {
                // hit pause btn so play btn appears and resets
                this.controlVideo('pause');
            }
            return; 
        }
        if (this.videoProps.framePlayDurationCounter == 0) {
            // load images
            this.loadAnimationFrame(this.videoProps.framePlayCounter, "top");
            this.loadAnimationFrame(this.videoProps.framePlayCounter + 1, "bottom");
            if (this.video.frames.length == 1) {
                this.videoProps.videoPlaying = false;
            }
        }
        this.videoProps.framePlayDurationCounter += this.videoProps.videoDelay;
        let transition = this.video.frames[this.videoProps.framePlayCounter].transition;
        let duration = this.video.frames[this.videoProps.framePlayCounter].duration;
        let opacity = 1;
        if (transition == VIDEO_TRANSITION.SOFT) {
            if (this.videoProps.framePlayDurationCounter >= duration - this.videoProps.transitionSoftDelay) {
                opacity = Math.round((duration - this.videoProps.framePlayDurationCounter) / this.videoProps.transitionSoftDelay * 100) / 100.0;
            }
        } else if (transition == VIDEO_TRANSITION.CONTINUOUS) {
            opacity = 1.0 - Math.round(this.videoProps.framePlayDurationCounter / duration * 100) / 100;
        }
        if (opacity > 1) { opacity = 1.0;}
        if (opacity < 0) { opacity = 0;}
        let canvas = document.getElementById(`video_canvas_top`) as HTMLCanvasElement;
        if (canvas) {
            canvas.style.opacity = opacity.toString();
        }

        // at last reset counter if over duration and prep for next frame
        if (this.videoProps.framePlayDurationCounter > this.video.frames[this.videoProps.framePlayCounter].duration) {
            this.videoProps.framePlayDurationCounter = 0;
            this.videoProps.framePlayCounter ++;
        }
    }

    private static loadAnimationFrame(pos:number, type : string) {
        let frame = this.getVideoFrame(pos);
        if (! frame) { return; }
        let canvas = document.getElementById(`video_canvas_${type}`) as HTMLCanvasElement;
        canvas.width = frame.width;
        canvas.height = frame.height;
        canvas.style.opacity = "1";
        if (canvas) {
            let context = canvas.getContext('2d');
            if (context) {
                context.drawImage(frame.imageObj.image, 0, 0);
            }
        }
    }

    public static setVideoReload() {
        if (this.defaultVideoReload) {
            utils.addClass('vcReload', 'vcBtnSelected');
        } else {
            utils.removeClass('vcReload', 'vcBtnSelected');
        }
    }
}
