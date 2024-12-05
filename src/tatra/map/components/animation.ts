import { baseComponent } from "./BaseComponent";;
import flatpickr from 'flatpickr';
import { utils } from "../../utils";
import { props } from "../props";
import { events } from "../events";
import { Modal } from "../../aux/Modal";
import { imageUtils } from "../imageUtils";
import { animationUtils } from "../animation/utils";
import { animationFrames } from "../animation/frames";
import { videoProps, VIDEO_TRANSITION, VIDEO_FRAME_TYPE, IVideoFrame, RENDER_MODE } from "../animation/props";

export class animation extends baseComponent {
	public static id		            : string = 'animation';
	public static label		            : string = 'Animate';
	public static draggable             : boolean = true;
	public static className             : string = 'transparentWindow';
    public static showHeader            : boolean = false;

    private static isActive             : boolean = false;
    private static videoModal           : Modal | null = null;
    
    public static init () {
        super.init();
        document.addEventListener(events.EVENT_RENDER_COMPLETE, (evt) => this.updateImage());
        document.addEventListener(events.EVENT_VIDEO_FRAME_LOADED, (evt) => this.playVideo());
        document.addEventListener(events.EVENT_MENU_OPEN, (evt) => animationUtils.menuChange());
    }

	public static createWindow () {
		super.createWindow();
        animationUtils.renderToolWindow(this.id);
        super.setDraggable(`lmvDragLbl_${this.id}`);
        animationUtils.enableRenderMode();
        animationUtils.setRenderMode();
        utils.setClick('anim_btn_load_video', ()=>this.loadFrames(true));
        utils.setClick('anim_btn_view_video', ()=>this.loadFrames(false));
        utils.setClick('anim_btn-daily', ()=>animationUtils.updateRenderMode(RENDER_MODE.DAILY));
        utils.setClick('anim_btn-sub-daily', ()=>animationUtils.updateRenderMode(RENDER_MODE.SUBDAILY));
    }

	public static open() {
        super.open();
        let [mw, mh] = this.getSpaceSize();
		let posy = 0;
		let posx = 0;
		if (mh > 500) {
			posy = mh - 400;
		}
		if (mw > 400 && mw < 800) {
			posx = 50;
		} else if (mw > 600) {
			posx = mw / 2 - 200;
		}		
        this.position(posx, posy);
    }

    public static loadFrames(addNew : boolean) {
        this.videoModal = new Modal({id: 'video', style : 'modalVideo'});
        let el = this.videoModal.getContent();
        this.videoModal.open();

        animationUtils.prepareStage();

        let map = document.getElementById('map') as HTMLDivElement;
        let [w,h,z] = animationUtils.getResolutionSize();

        map.style.width = w.toString() + 'px';
        map.style.height = h.toString() + 'px';
        props.map.updateSize();
        let isWorld = false;
        if (z != -1) {
            props.map.getView().setCenter([0,0]);
            props.map.getView().setZoom(z);
            isWorld = true;
        }

        let cont = document.getElementById(el) as HTMLDivElement;
        if (! cont) { return; }
        cont.innerHTML = `
            <div id="videoBack"></div>
            <div id="videoLibrary">
                <div id="videoLibraryTitle">Animation Data Control</div>
                <div id="videoLibraryList"></div>
                <div id="videoAddons">
                    <table>
                        <tr>
                            <td id="td_vaIntro"><div id="videoAddonsIntro" class="layerOnOffButton"><i class="fa fa-check" aria-hidden="true"></i></div><span>Intro</span></td>
                            <td id="td_vaTopBanner"><div id="videoAddonsTopBanner" class="layerOnOffButton"><i class="fa fa-check" aria-hidden="true"></i></div><span>Top Label</span></td>
                        </tr>
                        <tr>
                            <td id="td_vaCredits"><div id="videoAddonsCredits" class="layerOnOffButton"><i class="fa fa-check" aria-hidden="true"></i></div><span>Credits</span></td>
                            <td id="td_vaLogo"><div id="videoAddonsLogo" class="layerOnOffButton"><i class="fa fa-check" aria-hidden="true"></i></div><span>Bottom Logo</span></td>
                        </tr>
                        <tr>
                            <td id="td_vaInfo"><div id="videoAddonsInfo" class="layerOnOffButton"><i class="fa fa-check" aria-hidden="true"></i></div><span>Data Info</span></td>
                            <td>&nbsp;</td>
                        </tr>
                    </table>
                </div>
                <div id="videoLoading">loading</div>
                <div id="videoLoadFrames" class="videoLaunch"><span><i class="fa fa-plus"></i></span>&nbsp;&nbsp;Add Frames</div>
                <div id="videoLaunch" class="videoLaunch"><span><i class="fa fa-play"></i></span>&nbsp;&nbsp;Play</div>
                <div id="videoLaunch3d" class="videoLaunch"><span><i class="fa fa-globe"></i></span>&nbsp;&nbsp;Play 3D</div>
                <div id="videoLibraryClose" class="modalCloseIcon">
                    <i class="fa fa-times" aria-hidden="true"></i>
                </div>
            </div>
            <div id="videoStage">
                <div id="videoCanvas">
                    <canvas class="video_canvas" id="video_canvas_bottom"></canvas>
                    <canvas class="video_canvas" id="video_canvas_top"></canvas>
                    <div id="videoStageInfo"></div>
                    <div id="videoStageLogo"></div>
                </div>
                <div id="videoControlsWrap">
                    <div id="videoControls">
                        <div class="vcBtn" id="vcPlay"><i class="fa fa-play"></i></div>
                        <div class="vcBtn" id="vcPause"><i class="fa fa-pause"></i></div>
                        <div class="vcBtn" id="vcStop"><i class="fa fa-stop"></i></div>
                        <div class="vcBtn" id="vcReload"><i class="fa fa-sync"></i></div>
                    </div>
                </div>
                <div id="videoControlsClose">
                    <span><i class="fa fa-times"></i></span>
                </div>
            </div>
        </div>
        `;
        
        if (videoProps.video.logoDiv) {
            utils.html('videoStageLogo', videoProps.video.logoDiv);
        }
        utils.setClick('videoLoadFrames', ()=> this.addNewFrames());
        utils.setClick('videoLaunch', ()=> this.preparePlayVideo());
        utils.setClick('videoLaunch3d', ()=> this.preparePlayVideo3d());
        utils.hide('videoLoadFrames');
        utils.hide('videoLaunch');
        utils.hide('videoLaunch3d');
        utils.hide('videoStage');
        utils.setClick('vcPlay', ()=>this.controlVideo('play'));
        utils.setClick('vcPause', ()=>this.controlVideo('pause'));
        utils.setClick('vcStop', ()=>this.controlVideo('stop'));
        utils.setClick('videoControlsClose', ()=>this.controlVideo('stop'));
        utils.setClick('vcReload', ()=>this.controlVideo('reload'));
        utils.setClick('videoCanvas', ()=>this.controlVideo('pause'));
        utils.setClick('videoLibraryClose', ()=>this.closeModal());
        utils.setClick('td_vaIntro', ()=>animationUtils.setVideoAddons('intro'));
        utils.setClick('td_vaCredits', ()=>animationUtils.setVideoAddons('credits'));
        utils.setClick('td_vaInfo', ()=>animationUtils.setVideoAddons('info'));
        utils.setClick('td_vaTopBanner', ()=>animationUtils.setVideoAddons('topBanner'));
        utils.setClick('td_vaLogo', ()=>animationUtils.setVideoAddons('logo'));
        animationUtils.setVideoAddons(null);
        utils.hide('vcPause');
        this.setVideoReload();


        if (addNew) {
            let sd = videoProps.calendarFrom.selectedDates[0];
            let ed = videoProps.calendarTo.selectedDates[0];
            let _step = utils.getSelectValue(`lmvControls_anim_step`);
            let step = 1;
            if (videoProps.renderMode == RENDER_MODE.DAILY) {
                if (_step.indexOf('d')>=0) {
                    step = Number(_step.replace('d', ''));
                }
                // clear time values
                sd = utils.sanitizeDate(sd);
                ed = utils.sanitizeDate(ed);
            } else if (videoProps.renderMode == RENDER_MODE.SUBDAILY) {
                step = 60;
                if (_step.indexOf('m')>=0) {
                    step = Number(_step.replace('m', ''));
                }

            }
            if (sd > ed) { return; }
            let size = props.map.getSize();
            if (!size) {
                return;
            }
            videoProps.video.step = _step;
            videoProps.video.timerCounter = 0;
            videoProps.video.ignoreCounter = false;
            let credits = [];
            let layers = [];
            for (let i=0; i<props.layers.length; i++) {
                if (props.layers[i].visible) {
                    if (props.layers[i].credit && props.layers[i].credit != '') {
                        credits.push(props.layers[i].credit as string);
                    }
                    layers.push(props.layers[i].id);
                }
            }
            let date = sd;
            let frame = 0;
            let run = true;
            while (run) {
                frame ++;
                console.log("Running" , date);
                let fr = {
                    date: date, 
                    range : props.time.range,
                    rangeMins : props.time.rangeMins,
                    imageObj : null, 
                    loaded : false, 
                    credits : credits,
                    layers : layers,
                    width : w, 
                    height : h,
                    isWorld : isWorld,
                    duration : videoProps.defaultDuration,
                    transition : VIDEO_TRANSITION.SOFT,
                    type : VIDEO_FRAME_TYPE.DATA,
                    waitCycles : 50,
                    checked : false
                };
                if (videoProps.videoLoaderIndex >= videoProps.video.frames.length) {
                    videoProps.video.frames.push(fr);
                    videoProps.videoLoaderIndex = videoProps.video.frames.length;
                } else {
                    videoProps.video.frames.splice(videoProps.videoLoaderIndex, 0, fr);
                    videoProps.videoLoaderIndex++;
                }
                let validationFormat = 'Y-m-d';
                if (videoProps.renderMode == RENDER_MODE.SUBDAILY) {
                    date = utils.addMinutes(date, step);
                    validationFormat += '-H-i';
                } else {
                    date = utils.addDay(date, step);
                }
                // quit when over max frames or time reaches end point
                if (frame == videoProps.props.maxFrames || flatpickr.formatDate(date, validationFormat) > flatpickr.formatDate(ed, validationFormat)) {
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
        }
        this.renderPopup();
        if (addNew) {
            animationUtils.processFrames();
        }
    }

    public static closeModal() {
        this.isActive = false;
        animationUtils.restoreStage();
        if (this.videoModal) {
            this.videoModal.close();
        }
    }

    private static addNewFrames() {
        videoProps.videoLoaderIndex = videoProps.video.frames.length;
        this.closeModal();
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
        utils.setClick('vidFrame-reload-all', ()=> animationUtils.reloadFrames());
        
        animationFrames.populateVideoFramesList(ul.id, videoProps.video);

        animationUtils.updateVideoImages();
        utils.setClick(ul.id, (evt:MouseEvent)=> animationUtils.frameListMouseClickHandler(evt));
    }

    private static updateImage() {
        if (! this.isActive) { return; }
        // reset counter when image is updated so it waits until another potential update or timeout
        videoProps.video.timerCounter = 0;  
        videoProps.video.ignoreCounter = false;    
    }

    private static preparePlayVideo() {
        animationFrames.addIntroCreditsFrame();
        videoProps.props.framePlayDurationCounter = 0;
        videoProps.props.framePlayCounter = 0;
        videoProps.readyToPlay = true;
        events.dispatch(events.EVENT_VIDEO_FRAME_LOADED);
    }
    private static preparePlayVideo3d() {
        videoProps.props.framePlayDurationCounter = 0;
        videoProps.props.framePlayCounter = 0;
        this.controlVideo('play');
    }

    private static playVideo() {
        if (videoProps.readyToPlay) {
            for (let i=0; i<videoProps.video.frames.length; i++) {
                if (! videoProps.video.frames[i].loaded) { return; }
            }
            this.controlVideo('play');
        }
    }

    private static updateTimer() {
        if (videoProps.video.ignoreCounter) { return; }
        if (videoProps.video.timerCounter < videoProps.video.frames[videoProps.props.frameLoaderCounter-1].waitCycles) {
            videoProps.video.timerCounter ++;
        }
        if (videoProps.video.timerCounter >= videoProps.video.frames[videoProps.props.frameLoaderCounter-1].waitCycles) {
            videoProps.video.ignoreCounter = true;    // block counter until new frame is loaded
            videoProps.video.timerCounter = 0;
            // load new frame
            this.processImage();
        }
    }
    private static processImage() {
        let frame = videoProps.video.frames[videoProps.props.frameLoaderCounter-1];
        frame.imageObj = imageUtils.renderScreenshot();
        frame.loaded = true;
        animationUtils.updateVideoImages();
        animationUtils.processFrames();
    }
    
    private static controlVideo (btn : string) {
        utils.show('videoControlsWrap');
        utils.show('videoControlsClose');
        if (btn == "stop") {
            utils.hide('videoStage');
            utils.show('videoLibrary');
            utils.removeClass('mapMaxLabel', 'vidTopLabel');
            videoProps.props.videoPlaying = false;
            videoProps.props.framePlayCounter = 0;           // reset frames to 0 so they start from beginning
            videoProps.props.framePlayDurationCounter = 0;      // reset duration counter
            animationFrames.removeIntroCreditsFrame();
            videoProps.readyToPlay = false;
        } else if (btn == "play") {
            utils.showCustom('vcPause', "inline-block");
            utils.hide('videoControlsWrap');        // hide control bar while playing
            utils.hide('videoControlsClose');
            utils.hide('vcPlay');
            utils.show('videoStage');
            if (videoProps.video.showTopBanner) {
                utils.addClass('mapMaxLabel', 'vidTopLabel');
            }
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
        let v = videoProps.video;
        let p = videoProps.props;
        if (! p.videoPlaying || v.frames.length == 0) { return; }     // video is paused / or no frames
        // if video is at the end
        let counter = p.framePlayCounter;
        if ( counter >= v.frames.length) { 
            p.framePlayCounter = 0;
            p.framePlayDurationCounter = 0;
            if (!videoProps.defaultVideoReload) {
                // hit pause btn so play btn appears and resets
                this.controlVideo('pause');
            }
            return; 
        }
        if (p.framePlayDurationCounter == 0) {
            // load images
            this.loadAnimationFrame(counter, "top");
            this.loadAnimationFrame(counter + 1, "bottom");
            if (v.frames.length == 1) {
                p.videoPlaying = false;
                // set background frame to the same as top
                this.loadAnimationFrame(counter, "bottom");
            }
        }
        utils.removeClass('mapMaxLabel', 'vidTopLabel');
        utils.hide('videoStageLogo');
        utils.hide('videoStageInfo');
        if (v.frames[p.framePlayCounter].type == VIDEO_FRAME_TYPE.DATA) {
            if (v.showTopBanner) { utils.addClass('mapMaxLabel', 'vidTopLabel'); }
            if (v.showLogo) { utils.show('videoStageLogo'); }
            if (v.showInfo) { utils.show('videoStageInfo'); }
        }
        p.framePlayDurationCounter += p.videoDelay;
        let transition = v.frames[counter].transition;
        let duration = v.frames[counter].duration;
        let opacity = 1;
        if (transition == VIDEO_TRANSITION.SOFT) {
            if (p.framePlayDurationCounter >= duration - p.transitionSoftDelay) {
                opacity = Math.round((duration - p.framePlayDurationCounter) / p.transitionSoftDelay * 100) / 100.0;
            }
        } else if (transition == VIDEO_TRANSITION.CONTINUOUS) {
            opacity = 1.0 - Math.round(p.framePlayDurationCounter / duration * 100) / 100;
        }
        if (opacity > 1) { opacity = 1.0;}
        if (opacity < 0) { opacity = 0;}
        let canvas = document.getElementById(`video_canvas_top`) as HTMLCanvasElement;
        if (canvas) {
            canvas.style.opacity = opacity.toString();
        }

        // position logo and info
        let w = v.frames[p.framePlayCounter].width;
        let h = v.frames[p.framePlayCounter].height;
        let el = document.getElementById('videoStageLogo') as HTMLDivElement;
        if (el && el.clientHeight > 0) {
            el.style.left =  ( w - el.clientWidth - 5).toString() + "px";
            el.style.top = ( h - el.clientHeight - 5).toString() + "px";
        }
        el = document.getElementById('videoStageInfo') as HTMLDivElement;
        if (el && el.clientHeight > 0) {
            el.style.left =  "10px";
            el.style.top = ( h - el.clientHeight - 10).toString() + "px";
        }
        

        // at last reset counter if over duration and prep for next frame
        if (p.framePlayDurationCounter > v.frames[counter].duration) {
            p.framePlayDurationCounter = 0;
            p.framePlayCounter ++;
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
            if (context && frame.imageObj && frame.imageObj.image) {
                context.drawImage(frame.imageObj.image, 0, 0);
            }
        }
        if (type == "top") {
            let lbl = flatpickr.formatDate(frame.date,' Y-m-d');
            if (frame.range > 0) {
                lbl += ` (${frame.range+1}days)`;
            }
            utils.html('videoStageInfo', lbl);
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
