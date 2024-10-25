import { timelineController } from "../../timeline/timelineController";
import { props } from "../props";
import { MapTime } from "../obj/MapTime";
import { utils } from "../../utils";
import { configProps } from "../support/configProps";
import { events } from "../events";
import { IVideoFrame, VIDEO_TRANSITION, VIDEO_FRAME_TYPE, RENDER_MODE } from "./props";
import { videoProps } from "./props";
import { Instance } from "flatpickr/dist/types/instance";
import flatpickr from 'flatpickr';
import { animation } from "../components/animation";
import { animationFrames } from "./frames";
import { IImageObj } from "../imageUtils";
import { mainMenu } from "../menu/mainMenu";

export interface ISavedMapParams {
    zoom            : number;
    center          : Array<number>;
    time            : MapTime;
}

export interface IMapResolution {
    id              : string;
    label           : string;
    width           : number;
    height          : number;
    isWorld         : boolean;
    worldZoom?      : number;
}

export class animationUtils {

    private static savedSettings        : ISavedMapParams | null = null; 
    public static resolutions : Array<IMapResolution> = [
        { id : 'full', label : 'Full Screen', width: 0, height: 0, isWorld : false},
        { id : 'sd', label : 'SD (640x480)', width: 640, height: 480, isWorld : false},
        { id : 'hd', label : 'HD (1280x720)', width: 1280, height: 720, isWorld : false},
        { id : 'full_hd', label : 'Full HD (1920x1080)', width: 1920, height: 1080, isWorld : false},
        { id : '4k', label : '4k Ultra HD (3840x2160)', width: 3840, height: 2160, isWorld : false},
        { id : 'world_sd', label : 'World small (1024x512)', width: 1024, height: 512, isWorld : true, worldZoom : 1},
        { id : 'world_hd', label : 'World medium (2048x1024)', width: 2048, height: 1024, isWorld : true, worldZoom : 2},
        { id : 'world_uhd', label : 'World large (4096x2048)', width: 4096, height: 2048, isWorld : true, worldZoom : 3}
    ];

    // set date time for mapviewer
    public static setDateTime() {
		timelineController.time.imageryDate = props.time.imageryDate;
		timelineController.time.date = props.time.date;
		timelineController.time.range = props.time.range;
        timelineController.time.rangeMins = props.time.rangeMins;
        timelineController.refreshTimelineDate();
		events.dispatch(events.EVENT_SYSTEM_DATE_UPDATE);
    }
    
    // save current mapviewer settings
    public static prepareStage() {
        let time = new MapTime();
        time.date = props.time.date;
        time.imageryDate = props.time.imageryDate;
        time.quickTime = props.time.quickTime;
        time.range = props.time.range;
        time.rangeMins = props.time.rangeMins;
        let view = props.map.getView(); 
        let zoom = view.getZoom();
        let center = [0,0];
        if (zoom) {
            let _center = view.getCenter();
            if (_center != undefined) {
                center = _center;
            }
        } else {
            zoom = 4;
        }
        this.savedSettings = {center : center, time : time, zoom : zoom};
        //console.log("Saved", this.savedSettings);
    }

    // restore map viewer to original state
    public static restoreStage() {
        let sett = this.savedSettings;
        if (sett) {
            let map = document.getElementById('map') as HTMLDivElement;
            map.style.width = '';
            map.style.height = '';
            props.map.updateSize();

            let view = props.map.getView();
            view.setCenter(sett.center);
            view.setZoom(sett.zoom);
            props.time.date = sett.time.date;
            props.time.imageryDate = sett.time.imageryDate;
            this.setDateTime();
        }
    }

    // create <select> for resolution
    private static renderResolutionsSelect() : string {
        let str = '<select id="lmvControls_anim_resolution">';
        for (let i=0; i < this.resolutions.length; i++) {
            let res = this.resolutions[i];
            // check if world can be generated; extent can't be set in config
            if (!res.isWorld || (res.isWorld && ! configProps.extent)) {
                str += `<option value="${i.toString()}">${res.label}</value>`;
            }
        }
        str += '</select>';
        return str;
    }   

    // render window when user clicks on camera icon in timeline
    public static renderToolWindow(id:string) {
        let el = document.getElementById(`lmvControls_${id}_Content`) as HTMLDivElement;
        if (! el) { return; }
        
		el.innerHTML = `
			<div id="lmvDragLbl_${id}" class="transparentWindowLabel">
				<span id="lmvControls_${id}_Layer" class="opacityTitleLbl">Animate</span>
			</div>
            <div style="width:100%;" class="lmvAnimation">
                <div>
                    <div id="anim_btn_view_video" class="anim_btn_load_video">View Frames</div> 
                </div>
                <div id="anim_wrap_daily" class="fmmModeWrap" style="display:none;">
                    <div id="anim_btn-daily" class="fmmModeBtn active">
                        DAILY
                    </div>
                    <div id="anim_btn-sub-daily" class="fmmModeBtn">
                        SUB-DAILY
                    </div>
                </div>
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
                            <select id="lmvControls_anim_step">
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
                    <tr>
                        <td>Resolution:</td>
                        <td>
                            ${this.renderResolutionsSelect()}
                        </td>
                    </tr>
                </table>
                <div>
                    <div id="anim_btn_load_video" class="anim_btn_load_video">Add Frames</div>
                </div>
			</div>	
        `;
    }
    public static menuChange() {
        this.enableRenderMode();
    }

    public static updateRenderMode(mode : RENDER_MODE) {
        if (mode == videoProps.renderMode) { return; }
        videoProps.renderMode = mode;
        this.setRenderMode();
    }
    public static enableRenderMode() {
        videoProps.isSubDaily = mainMenu.isSubDaily();
        if (videoProps.isSubDaily) {
            utils.show('anim_wrap_daily');
        } else {
            utils.hide('anim_wrap_daily');
            this.updateRenderMode(RENDER_MODE.DAILY); // force switch to daily mode
        }
    }
    public static setRenderMode() {
        if (videoProps.renderMode == RENDER_MODE.DAILY) {
            let selStr = `
                <option value="1d">1 Day</option>
                <option value="2d">2 Days</option>
                <option value="3d">3 Days</option>
                <option value="4d">4 Days</option>
                <option value="5d">5 Days</option>
                <option value="6d">6 Days</option>
                <option value="7d">7 Days</option>
                <option value="10d">10 Days</option>
            `;
            utils.html('lmvControls_anim_step', selStr);
            utils.setSelectValue('lmvControls_anim_step', "1d");
            utils.addClass('anim_btn-daily', 'active');
            utils.removeClass('anim_btn-sub-daily', 'active');
        } else {
            let selStr = `
                <option value="10m">10 mins</option>
                <option value="30m">30 mins</option>
                <option value="60m">1 hour</option>
                <option value="120m">2 hours</option>
                <option value="240m">4 hours</option>
                <option value="360m">6 hours</option>
                <option value="720m">12 hours</option>
            `;
            utils.html('lmvControls_anim_step', selStr);
            utils.setSelectValue('lmvControls_anim_step', "60m");
            utils.addClass('anim_btn-sub-daily', 'active');
            utils.removeClass('anim_btn-daily', 'active');
        }
        //console.log(this.getStartDate(props.time.date,"From"), props.time.date);
        this.initDatePicker(this.getStartDate(props.time.date, "From"), "From");
        this.initDatePicker(props.time.date, "To");
    }
    // compute start date from provided date
    private static getStartDate(date : Date, type : string) : Date {
        let val = 0;
        if (videoProps.renderMode == RENDER_MODE.DAILY) {
            if (type == "From") {
                val = -videoProps.props.defaultFrames+1;
            } else {
                val = videoProps.props.defaultFrames-1;
            }
            return utils.addDay(utils.sanitizeDate(date), val);
        } else {
            if (type == "From") {
                val = -(videoProps.props.defaultFrames+1) * 10;
            } else {
                val = (videoProps.props.defaultFrames-1) * 10;
            }
            return utils.addMinutes(date, val);   
        }
    }
    public static initDatePicker (d : Date, type : string) {
        let option = this;
        let calendar = videoProps.calendarFrom;
        let [minDate, maxDate] = utils.getTimelineDateRange();
        if (type == "To") {
            calendar = videoProps.calendarTo;
            minDate = videoProps.calendarFrom.selectedDates[0];
//            d = utils.addDay(minDate, videoProps.props.defaultFrames-1);
            d = this.getStartDate(props.time.date, "To")
            //console.log("TO:", minDate, d);
            let maxDate2 = utils.addDay(minDate, videoProps.props.maxFrames-1);
            if (videoProps.renderMode == RENDER_MODE.SUBDAILY) {
                maxDate = utils.addMinutes(minDate, (videoProps.props.maxFrames-1)*10);
            }
            
            if (maxDate2 < maxDate) {
                maxDate = maxDate2;
            }
            if (d > maxDate) {
                d = maxDate;
            }
        }
        let hasTime = false;
        let df = videoProps.df;
        if (videoProps.renderMode == RENDER_MODE.SUBDAILY) {
            hasTime = true;
            df = videoProps.df_sub;
        } 
        if (calendar) {
            calendar.destroy();
        }
        //console.log("default", d);
        calendar = flatpickr("#animation_date" + type, {
            dateFormat : df,
            enableTime : hasTime,
            defaultDate : d,
            minDate : minDate,
            maxDate : maxDate,
            onChange : function () {
                option.setDates(type);
            }
        }) as Instance;

        if (type == "From") {
            videoProps.calendarFrom = calendar;
        } else {
            videoProps.calendarTo = calendar;
        }
//        this.setDates();
    }

    private static setDates(type : string) {
        if (type == 'From') {
            let minDate = videoProps.calendarFrom.selectedDates[0];
            let maxDate = utils.getGMTTime(new Date());
            let maxDate2 = utils.addDay(minDate, videoProps.props.maxFrames-1);
            let date = videoProps.calendarTo.selectedDates[0];
            if (maxDate2 < maxDate) {
                maxDate = maxDate2;
            }
            if (date > maxDate) {
                date = maxDate;
            }

            videoProps.calendarTo.set("minDate",minDate);
            videoProps.calendarTo.set("maxDate",maxDate);
            videoProps.calendarTo.setDate(date);
        }
    }

    // render video settings options
    public static renderControlOptions (base : HTMLDivElement) {
        let el = document.createElement("div");
        el.id = "vidFrameCtrl";
        base.appendChild(el);
        el.innerHTML = `
            <div id="videoFramesList_cmd_ctrl" class="vidFrameCtrlPanel">
                <div id="vidFrameChkAll" class="layerOnOffButton"><i class="fa fa-check" aria-hidden="true"></i></div>
                <div class="vidFrameChkAll-lbl">Select All</div>
                <div id="vidFrame-reload-all" class="vidFrameCtlrPanelBtn"><span><i class="fa fa-redo"></i></span> Reload</div>
                <div id="vidFrame-remove-all" class="vidFrameCtlrPanelBtn"><span><i class="fa fa-trash"></i></span> Delete</div>
                <div id="vidFrameCtrlSubPanel" class="vidFrameCtrlSubPanel">
                    <span>Frame duration: </span>
                    <select id="vidFrameDuration">
                        <option disabled selected value="-1"> --- </option>
                        <option value="500">500ms</option>
                        <option value="750">750ms</option>
                        <option value="1000">1s</option>
                        <option value="1300">1.3s</option>
                        <option value="1500">1.5s</option>
                        <option value="2000">2s</option>
                        <option value="2500">2.5s</option>
                        <option value="3000">3s</option>
                        <option value="4000">4s</option>
                        <option value="5000">5s</option>
                        <option value="7500">7.5s</option>
                        <option value="10000">10s</option>
                    </select>
                    <span>Transition: </span>
                    <select id="vidFrameTransition">
                        <option disabled selected value="-1"> --- </option>
                        <option value="${VIDEO_TRANSITION.SOFT}">Soft</option>
                        <option value="${VIDEO_TRANSITION.HARD}">Hard</option>
                        <option value="${VIDEO_TRANSITION.CONTINUOUS}">Continuous</option>
                    </select>
                </div>
            </div>
            <div id="videoFramesList_cmd_none" class="vidFrameCtrlPanelNone">
                No active frames.
            </div>
            <div id="videoBackgroundLogoHolder">
            </div>
        `;
//        utils.setSelectValue('vidFrameDuration', videoProps.defaultDuration.toString());
        utils.setChange('vidFrameDuration', ()=>this.updateDuration());
        utils.setChange('vidFrameTransition', ()=>this.updateTransition());
        this.updateInfoCheckboxes();
        let el2 = document.getElementById('videoBackgroundLogoHolder') as HTMLDivElement;
        if (el2) {
            el2.innerHTML = videoProps.auxFrameSettings.backgroundLogo;
        }
    }

    // set default duration from select box
    private static updateDuration() {
        let val = utils.getSelectValue('vidFrameDuration');
        videoProps.defaultDuration = Number(val);
        for (let i=0; i< videoProps.video.frames.length; i++) {
            if (videoProps.video.frames[i].checked) {
                videoProps.video.frames[i].duration = videoProps.defaultDuration;
            }
        }
        this.refreshVideoFramesList();
    }
    // update transition type
    private static updateTransition() {
        let val = utils.getSelectValue('vidFrameTransition') as VIDEO_TRANSITION;
        videoProps.defaultTransition = val;
        for (let i=0; i< videoProps.video.frames.length; i++) {
            if (videoProps.video.frames[i].checked) {
                videoProps.video.frames[i].transition = videoProps.defaultTransition;
            }
        }
        this.refreshVideoFramesList();
    }
    public static refreshVideoFramesList() {
        animationFrames.populateVideoFramesList('videoFramesList_content', videoProps.video);
        this.updateVideoImages();
    }
    // determine resolution size. If world, it requires zoom changes
    public static getResolutionSize () : Array<number> {
        let index = Number(utils.getSelectValue(`lmvControls_anim_resolution`));
        let res = this.resolutions[index];
        if (res.id != 'full') {
            let zoom = (res.worldZoom) ? res.worldZoom : -1;
            return [res.width, res.height, zoom];
        } else {
            let body = document.querySelector('body') as HTMLBodyElement;
            return [body.clientWidth, body.clientHeight, -1];
        }
    }
    // update video frame list <ul> with status for each frame
    public static updateVideoImages() {
        let allLoaded = true;
        let frames = videoProps.video.frames;
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
                if (i == videoProps.props.frameLoaderCounter) {
                    state = 'loading';
                    utils.addClass(id,'vfl_info_loading');
                }
            }
            utils.html(id, state);
            // visualize new frame
            if (frames[i].loaded) {
                this.drawVideoImage(i);
            } else {
                allLoaded = false;
            }
        }
        utils.hide('videoLoading');
        utils.hide('videoLaunch3d');
        let partDisplay = 'none';
        if (allLoaded) {
            utils.show('videoLaunch');
            utils.show('videoLoadFrames');
            partDisplay = 'block';
            let fc = 0;
            let fw = 0;
            for (let i=0; i<frames.length; i++) {
                if (frames[i].type == VIDEO_FRAME_TYPE.DATA) {
                    fc++;
                    if (frames[i].isWorld) {
                        fw++;
                    }
                }
            }
            if (fc == fw) {
//                utils.show('videoLaunch3d');
            }
        } else {
            utils.hide('videoLaunch');
            utils.hide('videoLoadFrames');
            if (frames.length > 0) {
                utils.show('videoLoading');
            }
        }
        // show/hide all partition buttons
        document.querySelectorAll('.vfl_partition_btn').forEach(function(el) {
            (el as HTMLDivElement).style.display = partDisplay;
        });
        this.updateInfoCheckboxes();
    }
    // draw canvas for the video list
    private static drawVideoImage(index : number) {
        let i = index;
        let id = "videoFramesList_content_c_" + i.toString();
        let canvas = document.getElementById(id) as HTMLCanvasElement;
        if (canvas) {
            let context = canvas.getContext('2d');
            let frame = this.getVideoFrame(index);
            if (context && frame && frame.imageObj && frame.imageObj.image) {
                context.drawImage(frame.imageObj.image, 0, 0);
            }
        }
    }
    public static getVideoFrame(i : number) : IVideoFrame | null {
        if (videoProps.video.frames.length > i && videoProps.video.frames[i].imageObj) {
            return videoProps.video.frames[i];
        }
        return null;
    }
    // remove checked frames
    public static deleteFrames() {
        for (let i=videoProps.video.frames.length-1; i>=0; i--) {
            if (videoProps.video.frames[i].checked === true) {
                videoProps.video.frames.splice(i,1);
            }
        }
        this.refreshVideoFramesList();
    }

    // reload frames
    public static reloadFrames() {
        let f = videoProps.video.frames;
        for (let i= f.length-1; i>=0; i--) {
            if (f[i].checked === true) {
                f[i].loaded = false;
                f[i].checked = false;
                if (f[i].imageObj) {
                    (f[i].imageObj as IImageObj).image = null;
                    (f[i].imageObj as IImageObj).context = null;
                }
                if (f[i].waitCycles < 200) {
                    f[i].waitCycles += 50;
                }
                videoProps.props.frameLoaderCounter = i;
            }
        }
        
        videoProps.video.ignoreCounter = false;
        this.refreshVideoFramesList();
        this.processFrames();
    }

    // execute each frame
    public static processFrames() {
        if (videoProps.props.frameLoaderCounter >= videoProps.video.frames.length) {
            // DONE
            return;
        }
        let f = videoProps.video.frames[videoProps.props.frameLoaderCounter];
        videoProps.props.frameLoaderCounter++;
        if (f.type == VIDEO_FRAME_TYPE.DATA && ! f.loaded) {
            props.time.date = f.date;
            props.time.imageryDate = f.date;
            videoProps.video.ignoreCounter = false;
            animationUtils.setDateTime();
        } else {
            // this is non-data frame
            this.processFrames();
        }
    }

    // set checkbox for all based on how many frame checkboxes are checked
    public static setAllFrames() {
        videoProps.chkAllFrames = !videoProps.chkAllFrames;

        for (let i=0; i<videoProps.video.frames.length; i++) {
            videoProps.video.frames[i].checked = videoProps.chkAllFrames;
        }
        this.updateInfoCheckboxes();
    }

    // update checkbox graphics
    private static updateInfoCheckboxes() {
        let counter = 0;
        for (let i=0; i<videoProps.video.frames.length; i++) {
            if (videoProps.video.frames[i].checked) {
                counter ++;
                utils.addClass(`vfl_chk-${i.toString()}`, 'layerOnOffButtonActive');
            } else {
                utils.removeClass(`vfl_chk-${i.toString()}`, 'layerOnOffButtonActive');
            }
        }
        if (counter == videoProps.video.frames.length) {
            videoProps.chkAllFrames = true;
            utils.addClass('vidFrameChkAll', 'layerOnOffButtonActive');
        } else {
            videoProps.chkAllFrames = false;
            utils.removeClass('vidFrameChkAll', 'layerOnOffButtonActive');
        }
        let dis = 'vidFrameCtlrPanelBtnDisabled';
        if (counter == 0) {
            utils.addClass('vidFrame-reload-all', dis);
            utils.addClass('vidFrame-remove-all', dis);
            utils.hide('vidFrameCtrlSubPanel');
            utils.setSelectValue('vidFrameDuration', '-1');
            utils.setSelectValue('vidFrameTransition', '-1');
        } else {
            utils.removeClass('vidFrame-reload-all', dis);
            utils.removeClass('vidFrame-remove-all', dis);
            utils.show('vidFrameCtrlSubPanel');
        }
        if (videoProps.video.frames.length == 0) {
            utils.show('videoFramesList_cmd_none');
            utils.hide('videoFramesList_cmd_ctrl');
            utils.hide('videoAddons');
            utils.hide('videoFramesList');
        } else {
            utils.hide('videoFramesList_cmd_none');
            utils.show('videoFramesList_cmd_ctrl');
            utils.show('videoAddons');
            utils.show('videoFramesList');
        }
    }

    // handle mouse click on frame list
    public static frameListMouseClickHandler(evt:MouseEvent) {
        let path = evt.composedPath();
        let max = (path.length > 5) ? 5 : path.length;
        let type = '';
        let id = null;
        for (let i=0; i<max; i++) {
            let el = path[i] as HTMLElement;
            if (el.tagName) {
                let tag = el.tagName.toLowerCase();
                if (tag == 'canvas') {
                    type = 'canvas';
                    let arr = el.id.split('_c_');
                    id = arr[1];
                    break;
                } else if (tag == 'div') {
                    if (el.id.indexOf('vfl_chk-') >=0) {
                        type = 'checkbox';
                        id = el.id.replace('vfl_chk-', '');
                        break;
                    }
                    else if (el.id.indexOf('vfl_part_option_above') >=0 || el.id.indexOf('vfl_part_option_below') >=0) {
                        let arr = el.id.split('-');
                        if (arr.length == 2) {
                            videoProps.videoLoaderIndex = Number(arr[1]);
                            if (el.id.indexOf('below')>=0) {
                                videoProps.videoLoaderIndex++;
                            }
                            animation.closeModal();
                        }
                        break;
                    } 
                    else if (el.id.indexOf('vfl_part_option_partition') >=0) {
                        type = 'add-partition';
                        id = el.id.replace('vfl_part_option_partition-', '');
                        break;
                    } 
                    else if (el.id.indexOf('vfl_part') >=0) {
                        type = 'partition';
                        id = el.id.replace('vfl_part-', '');
                        break;
                    } 
                }
            } 
        }
        if (id) {
            if (type == 'partition') {
                this.setPartitionBtns(Number(id));
            } else {
                this.setPartitionBtns(-1);
            }
            if (type == 'checkbox') {
                videoProps.video.frames[Number(id)].checked = ! videoProps.video.frames[Number(id)].checked;
                this.updateInfoCheckboxes();
            } else if (type == 'add-partition') {
                animationFrames.generatePartition(Number(id));
            }
        }
    }
    // controls for additional frames (adding partition or frames above / below current frame)
    private static setPartitionBtns (index : number) {
        let f = videoProps.video.frames;
        for (let i=0; i<f.length; i++) {
            if (f[i].type == VIDEO_FRAME_TYPE.DATA || f[i].type == VIDEO_FRAME_TYPE.PARTITION) {
                let _i = i.toString();
                let id = `vfl_part_btn-${_i}`;
                if (index != i) {
                    utils.hide(id);
                    utils.html(id, '');
                    utils.removeClass(`vfl_part-${_i}`, 'vfl_partition_btn_selected');
                } else {
                    
                    let pref = 'vfl_part_option';
                    let str = `
                        <div id="${pref}_above-${_i}" class="vfl_partition_option">above</div>
                        <div id="${pref}_partition-${_i}" class="vfl_partition_option">partition</div>
                        <div id="${pref}_below-${_i}" class="vfl_partition_option">below</div>
                        <div class="vfl_partition_close"><span><i class="fa fa-times" aria-hidden="true"></i></span></div>
                    `;
                    utils.show(id);
                    utils.addClass(`vfl_part-${_i}`, 'vfl_partition_btn_selected');
                    utils.html(id, str);
                }
            }
        }
    }
    // set video display options (banner, logo, date info, intro and credit frames)
    public static setVideoAddons(type:string | null) {
        let v = videoProps.video;
        let c = 'layerOnOffButtonActive';
        if (type) {
            if (type == 'intro') { v.showIntro = !v.showIntro; }
            else if (type == 'info') { v.showInfo = !v.showInfo; }
            else if (type == 'topBanner') { v.showTopBanner = !v.showTopBanner; }
            else if (type == 'logo') { v.showLogo = !v.showLogo; }
            else if (type == 'credits') { v.showCredits = !v.showCredits; }
        }
        if (v.showIntro) {utils.addClass('videoAddonsIntro', c);}
        else {utils.removeClass('videoAddonsIntro', c);}
        if (v.showCredits) {utils.addClass('videoAddonsCredits', c);}
        else {utils.removeClass('videoAddonsCredits', c);}
        if (v.showInfo) {
            utils.addClass('videoAddonsInfo', c);
            utils.show('videoStageInfo');
        } else {
            utils.removeClass('videoAddonsInfo', c);
            utils.hide('videoStageInfo');
        }
        if (v.showLogo) {
            utils.addClass('videoAddonsLogo', c);
            utils.show('videoStageLogo');
        }
        else {
            utils.removeClass('videoAddonsLogo', c);
            utils.hide('videoStageLogo');
        }
        // display controlled in animation.controlVideo()
        if (v.showTopBanner) {utils.addClass('videoAddonsTopBanner', c);}
        else {utils.removeClass('videoAddonsTopBanner', c);}
    }
    
    // go over all frames and aggregate layer credits
    public static aggregateCredits() : Array<string> {
        let fs = videoProps.video.frames;
        if (fs.length == 0 || !videoProps.video.showIntro) { return []; }
        let c : {[key: string]: string}  = {};
        for (let i=0; i<fs.length; i++) {
            let frame = fs[i];
            if (frame.credits) {
                for (let i=0; i<frame.credits.length; i++) {
                    let credit = frame.credits[i];
                    if (! c[credit]) {
                        c[credit] = credit;
                    }
                }
            }
        }
        let arr = [];
        for (let lbl in c) {
            arr.push(lbl);
        }
        return arr.sort();
    }
}