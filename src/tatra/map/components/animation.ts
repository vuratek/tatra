import { baseComponent } from "./BaseComponent";;
import flatpickr from 'flatpickr';
import { utils } from "../../utils";
import { props } from "../props";
import { events } from "../events";
import { Modal } from "../../aux/Modal";
import { imageUtils } from "../imageUtils";
import { animationUtils } from "../support/animationUtils";
import { videoProps, VIDEO_TRANSITION } from "../support/animationProps";

export class animation extends baseComponent {
	public static id		            : string = 'animation';
	public static label		            : string = 'Animate';
	public static draggable             : boolean = true;
	public static className             : string = 'transparentWindow';
    public static showHeader            : boolean = false;
    public static calendarFrom          : any;
    public static calendarTo            : any;
    public static readonly df           : string = 'M d Y';

    private static isActive             : boolean = false;
    private static videoModal           : Modal | null = null;
    
    public static init () {
        super.init();
        document.addEventListener(events.EVENT_RENDER_COMPLETE, (evt) => this.updateImage());
    }

	public static createWindow () {
		super.createWindow();
		animationUtils.renderToolWindow(this.id);
        super.setDraggable(`lmvDragLbl_${this.id}`);
        let d1 = utils.addDay(props.time.date, -videoProps.props.defaultFrames+1);
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
			posx = mw / 2 - 200;
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

        animationUtils.prepareStage();

        let map = document.getElementById('map') as HTMLDivElement;
        let [w,h,z] = animationUtils.getResolutionSize();

        map.style.width = w.toString() + 'px';
        map.style.height = h.toString() + 'px';
        props.map.updateSize();
        if (z != -1) {
            props.map.getView().setCenter([0,0]);
            props.map.getView().setZoom(z);
        }

        let cont = document.getElementById(el) as HTMLDivElement;
        if (! cont) { return; }
        cont.innerHTML = `
            <div id="videoBack"></div>
            <div id="videoLibrary">
                <div id="videoLibraryTitle">Animation Data Control</div>
                <div id="videoLibraryList"></div>
                <div id="videoLaunch">Play</div>
                <div id="videoLibraryClose" class="modalCloseIcon">
                    <i class="fa fa-times" aria-hidden="true"></i>
                </div>
            </div>
            <div id="videoStage">
                <div id="videoCanvas">
                    <canvas class="video_canvas" id="video_canvas_bottom"></canvas>
                    <canvas class="video_canvas" id="video_canvas_top"></canvas>
                    <div id="videoStageDateTime"></div>
                    <div id="videoStageLogo"><img src="/images/NASA_logo.svg"></div>
                </div>
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
        utils.setClick('videoCanvas', ()=>this.controlVideo('pausePlay'));
        utils.setClick('videoLibraryClose', ()=>this.closeModal());
        utils.hide('vcPause');
        this.setVideoReload();

        let sd = utils.sanitizeDate(this.calendarFrom.selectedDates[0]);
        let ed = utils.sanitizeDate(this.calendarTo.selectedDates[0]);
        let _step = utils.getSelectValue(`lmvControls_anim_step`);
        let step = 1;
        if (_step.indexOf('d')>=0) {
            step = Number(_step.replace('d', ''));
        }
        if (sd > ed) { return; }
        let size = props.map.getSize();
        if (!size) {
            return;
        }
        videoProps.video = { 
            step : _step, 
            frames : [], 
            speed : 5,
            timerCounter : 0,
            ignoreCounter : false
        };
        let date = sd;
        let frame = 0;
        let run = true;
        while (run) {
            frame ++;
            videoProps.video.frames.push({
                date: date, 
                range : props.time.range,
                rangeMins : props.time.rangeMins,
                imageObj : null, 
                loaded : false, 
                width : w, 
                height : h,
                duration : videoProps.defaultDuration,
                transition : VIDEO_TRANSITION.SOFT,
                checked : false
            });
            date = utils.addDay(date, step);
            // quit when over max frames or time reaches end point
            if (frame == videoProps.props.maxFrames || flatpickr.formatDate(date, 'Y-m-d') > flatpickr.formatDate(ed, 'Y-m-d')) {
                run = false;
            }
        }
        console.log(videoProps.video);
        videoProps.props.frameLoaderCounter = 0;
        this.isActive = true;
        if ( ! videoProps.props.loadTimer) {
            videoProps.props.loadTimer = ()=> this.updateTimer();
            setInterval(videoProps.props.loadTimer, videoProps.props.intervalDelay);
        }
        this.renderPopup();
        this.processFrames();
    }

    private static closeModal() {
        animationUtils.restoreStage();
        this.videoModal.close();
    }

    private static renderPopup() {
        let par = document.getElementById('videoLibraryList') as HTMLDivElement;
        animationUtils.renderControlOptions(par);
        let id = 'videoFramesList';

        let base = utils.ae(id, id, 'videoLibraryList');
		let ul = document.createElement('ul');
		ul.id = id + '_content';
		ul.className = 'vidFrmList';
        base.appendChild(ul);
        utils.setClick('vidFrameChkAll', ()=> animationUtils.setAllFrames());

        utils.setClick('vidFrame-remove-all', ()=> animationUtils.deleteFrames());
        
        animationUtils.populateVideoFramesList(ul.id, videoProps.video);

        animationUtils.updateVideoImages();
        utils.setClick(ul.id, (evt)=> animationUtils.frameListMouseClickHandler(evt));
    }

    private static updateImage() {
//        console.log('updateImage', this.isActive);
        if (! this.isActive) { return; }
        if (videoProps.video) {
            // reset counter when image is updated so it waits until another potential update or timeout
            videoProps.video.timerCounter = 0;  
            videoProps.video.ignoreCounter = false;    
        }
    }

    private static processFrames() {
        if (!videoProps.video || !videoProps.video.frames) { return; }
        if (videoProps.props.frameLoaderCounter >= videoProps.video.frames.length) {
            // DONE
            return;
        }
        props.time.date = videoProps.video.frames[videoProps.props.frameLoaderCounter].date;
		props.time.imageryDate = videoProps.video.frames[videoProps.props.frameLoaderCounter].date;
        videoProps.props.frameLoaderCounter++;
        videoProps.video.ignoreCounter = false;
        animationUtils.setDateTime();
    }


    public static initDatePicker (d : Date, type : string) {
        let option = this;
        let calendar = this.calendarFrom;
        let [minDate, maxDate] = utils.getTimelineDateRange();
        if (type == "To") {
            calendar = this.calendarTo;
            minDate = this.calendarFrom.selectedDates[0];
            d = utils.addDay(minDate, videoProps.props.defaultFrames-1);
            let maxDate2 = utils.addDay(minDate, videoProps.props.maxFrames-1);
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
            let maxDate2 = utils.addDay(minDate, videoProps.props.maxFrames-1);
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
        if (! videoProps.video || videoProps.video.ignoreCounter) { return; }
        if (videoProps.video.timerCounter < videoProps.props.maxWait) {
            videoProps.video.timerCounter ++;
        }
        if (videoProps.video.timerCounter >= videoProps.props.maxWait) {
            videoProps.video.ignoreCounter = true;    // block counter until new frame is loaded
            videoProps.video.timerCounter = 0;
            // load new frame
            this.processImage();
        }
    }
    private static processImage() {
        if (! videoProps.video) { return;}
        let frame = videoProps.video.frames[videoProps.props.frameLoaderCounter-1];
        frame.imageObj = imageUtils.renderScreenshot();
        frame.loaded = true;
        animationUtils.updateVideoImages();
        this.processFrames();
    }
    
    private static controlVideo (btn : string) {
        console.log("btn", btn);
        if (btn == "pausePlay") {
            if (videoProps.props.videoPlaying) {
                btn = "pause";
            } else {
                btn = "play"
            }
        }
        if (btn == "stop") {
            utils.hide('videoStage');
            utils.show('videoLibrary');
            utils.removeClass('mapMaxLabel', 'vidTopLabel');
            videoProps.props.videoPlaying = false;
            videoProps.props.framePlayCounter = 0;           // reset frames to 0 so they start from beginning
            videoProps.props.framePlayDurationCounter = 0;      // reset duration counter
        } else if (btn == "play") {
            utils.showCustom('vcPause', "inline-block");
            utils.hide('vcPlay');
            utils.show('videoStage');
            utils.addClass('mapMaxLabel', 'vidTopLabel');
            utils.hide('videoLibrary');    
            videoProps.props.videoPlaying = true;
            this.playAnimation();
        } else if (btn == "pause") {
            videoProps.props.videoPlaying = false;
            utils.hide('vcPause');
            utils.showCustom('vcPlay', "inline-block");
        } else if (btn == 'reload') {
            videoProps.defaultVideoReload = ! videoProps.defaultVideoReload;
            this.setVideoReload();
        }
    }
    private static playAnimation() {
        if ( ! videoProps.props.playTimer) {
            videoProps.props.playTimer = ()=> this.renderAnimation();
            setInterval(videoProps.props.playTimer, videoProps.props.videoDelay);
        }
    }

    private static renderAnimation () {
        if (! videoProps.props.videoPlaying || videoProps.video.frames.length == 0) { return; }     // video is paused / or no frames
        // if video is at the end
        if (videoProps.props.framePlayCounter >= videoProps.video.frames.length) { 
            videoProps.props.framePlayCounter = 0;
            videoProps.props.framePlayDurationCounter = 0;
            if (!videoProps.defaultVideoReload) {
                // hit pause btn so play btn appears and resets
                this.controlVideo('pause');
            }
            return; 
        }
        if (videoProps.props.framePlayDurationCounter == 0) {
            // load images
            this.loadAnimationFrame(videoProps.props.framePlayCounter, "top");
            this.loadAnimationFrame(videoProps.props.framePlayCounter + 1, "bottom");
            if (videoProps.video.frames.length == 1) {
                videoProps.props.videoPlaying = false;
                // set background frame to the same as top
                this.loadAnimationFrame(videoProps.props.framePlayCounter, "bottom");
            }
        }
        videoProps.props.framePlayDurationCounter += videoProps.props.videoDelay;
        let transition = videoProps.video.frames[videoProps.props.framePlayCounter].transition;
        let duration = videoProps.video.frames[videoProps.props.framePlayCounter].duration;
        let opacity = 1;
        if (transition == VIDEO_TRANSITION.SOFT) {
            if (videoProps.props.framePlayDurationCounter >= duration - videoProps.props.transitionSoftDelay) {
                opacity = Math.round((duration - videoProps.props.framePlayDurationCounter) / videoProps.props.transitionSoftDelay * 100) / 100.0;
            }
        } else if (transition == VIDEO_TRANSITION.CONTINUOUS) {
            opacity = 1.0 - Math.round(videoProps.props.framePlayDurationCounter / duration * 100) / 100;
        }
        if (opacity > 1) { opacity = 1.0;}
        if (opacity < 0) { opacity = 0;}
        let canvas = document.getElementById(`video_canvas_top`) as HTMLCanvasElement;
        if (canvas) {
            canvas.style.opacity = opacity.toString();
        }

        // at last reset counter if over duration and prep for next frame
        if (videoProps.props.framePlayDurationCounter > videoProps.video.frames[videoProps.props.framePlayCounter].duration) {
            videoProps.props.framePlayDurationCounter = 0;
            videoProps.props.framePlayCounter ++;
        }
    }

    private static loadAnimationFrame(pos:number, type : string) {
        let frame = animationUtils.getVideoFrame(pos);
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
        if (type == "top") {
            let lbl = flatpickr.formatDate(frame.date,' Y-m-d');
            if (frame.range > 0) {
                lbl += ` (${frame.range+1}days)`;
            }
            utils.html('videoStageDateTime', lbl);
        }
    }

    public static setVideoReload() {
        if (videoProps.defaultVideoReload) {
            utils.addClass('vcReload', 'vcBtnSelected');
        } else {
            utils.removeClass('vcReload', 'vcBtnSelected');
        }
    }
}
