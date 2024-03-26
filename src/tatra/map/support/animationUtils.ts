import { timelineController } from "../../timeline/timelineController";
import { props } from "../props";
import { MapTime } from "../obj/MapTime";
import { utils } from "../../utils";
import { configProps } from "./configProps";
import { events } from "../events";
import { IVideo, IVideoFrame, VIDEO_TRANSITION, VIDEO_FRAME_TYPE, RENDER_MODE } from "./animationProps";
import flatpickr from "flatpickr";
import { videoProps } from "./animationProps";
import { navProps } from "../../page/navProps";
import { animation } from "../components/animation";

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
        console.log("Saved", this.savedSettings);
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
                <div class="fmmModeWrap" style="display:none;">
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

    public static updateRenderMode(mode : RENDER_MODE) {
        if (mode == videoProps.renderMode) { return; }
        videoProps.renderMode = mode;
        this.setRenderMode();
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
    }

    // render video settings options
    public static renderControlOptions (base : HTMLDivElement) {
        let el = document.createElement("div");
        el.id = "vidFrameCtrl";
        base.appendChild(el);
        el.innerHTML = `
            <div id="videoFramesList_cmd_ctrl" class="vidFrameCtrlPanel">
                <div id="vidFrameChkAll" class="layerOnOffButton"><i class="fa fa-check aria-hidden="true"></i></div>
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
            el2.innerHTML = `
                <img id="_videoLogo_1" src="/images/nasa_logo_white.png" style="width:432px;height:432px;">
            `;
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
    private static refreshVideoFramesList() {
        this.populateVideoFramesList('videoFramesList_content', videoProps.video);
        this.updateVideoImages();
        this.updateInfoCheckboxes();
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

    // generate video frame list for <ul> as <li> elements
    public static populateVideoFramesList(div : string, video : IVideo) {
        let parentDiv = document.getElementById(div) as HTMLUListElement;
        if (! parentDiv) { return; }
        parentDiv.innerHTML = '';
        for (let i=0; i<video.frames.length; i++) {
            let frame = video.frames[i];
            let h = frame.height;
            let w = frame.width;
            let li = document.createElement('li');
            li.id = parentDiv.id + '_f_' + i.toString();
            parentDiv.appendChild(li);
            let fid = parentDiv.id + '_c_' + i.toString();
            let date = flatpickr.formatDate(frame.date, 'Y-m-d');
            let period = '';
            if (frame.rangeMins > 0) {

            } else if (frame.range > 0) {
                period = ` (${frame.range+1}days)`;
            }
/*            let date2 = flatpickr.formatDate(frame.date, 'Y-m-d');
            let range = frame.range;
            if (frame.rangeMins == 0) {
                date2 = flatpickr.formatDate(utils.addDay(frame.date, -range), 'Y-m-d');
            }
            if (date == date2) {
                date2 = '';
            } else {
                date2 = ' - ' + date2;
            }*/
            let dur = Math.round(frame.duration / 100) / 10;
            if (frame.type == VIDEO_FRAME_TYPE.PARTITION) {
                date = 'partition';
                period = '';
            }
            
            li.innerHTML = `
            <canvas id="${fid}"></canvas>
                <div class="vfl_info">
                    <div class="vfl_info_date">${date}${period}</div>
                    <div class="vfl_info_date">Size: ${frame.width}px x ${frame.height}px</div>
                    <div class="vfl_info_date">Duration: ${dur} sec</div>
                    <div class="vfl_info_date">Transition: ${frame.transition}</div>
                    <div id="vfl_part-${i.toString()}" class="vfl_partition_btn">
                        <div><span>+ frames</span></div>
                        <div id="vfl_part_btn-${i.toString()}"></div>
                    </div>
                </div>
                <div class="vfl_info_state" id="vfl_state_${i.toString()}"></div>
                <div id="vfl_chk-${i.toString()}" class="layerOnOffButton"><i class="fa fa-check aria-hidden="true"></i></div>
            `;
            let can = document.getElementById(fid) as HTMLCanvasElement;
            can.width = w;
            can.height = h;
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
        
    }
    // draw canvas for the video list
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
                    f[i].imageObj.image = null;
                    f[i].imageObj.context = null;
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
                this.generatePartition(Number(id));
            }
        }
    }
    private static generatePartition(index : number) {
        let f = videoProps.video.frames[index];

        let fr = {
            date: new Date(), 
            range : 0,
            rangeMins : 0,
            imageObj : null, 
            loaded : false, 
            credits : [],
            layers : [],
            width : f.width, 
            height : f.height,
            isWorld : f.isWorld,
            duration : 1300,
            transition : VIDEO_TRANSITION.SOFT,
            type : VIDEO_FRAME_TYPE.PARTITION,
            waitCycles : 0,
            checked : false
        };
        videoProps.video.frames.splice(index, 0, fr);
        this.createAuxFrame(fr);
        
    }
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
    public static addIntroCreditsFrame() {
        let fs = videoProps.video.frames;
        if (fs.length == 0 ) { return; }
        let w = fs[0].width;
        let h = fs[0].height;
        if (videoProps.video.showIntro && fs[0].type != VIDEO_FRAME_TYPE.INTRO) {
            let intro = this._setInfoCreditsFrame(w,h,VIDEO_FRAME_TYPE.INTRO);
            this.createAuxFrame(intro);
            fs.unshift(intro);
        }
        if (videoProps.video.showCredits  &&fs[fs.length-1].type != VIDEO_FRAME_TYPE.CREDITS) {
            let credits = this._setInfoCreditsFrame(w,h,VIDEO_FRAME_TYPE.CREDITS);
            this.createAuxFrame(credits);
            fs.push(credits);
        }
    }
    private static _setInfoCreditsFrame(w : number, h : number, type : VIDEO_FRAME_TYPE) : IVideoFrame {
        return {
            date            : new Date(),
            range           : -1,
            rangeMins       : -1,
            imageObj        : null,
            credits         : [],
            layers          : [],
            loaded          : false,
            width           : w,
            height          : h,
            duration        : 2500,
            isWorld         : false,
            transition      : VIDEO_TRANSITION.HARD,
            type            : type,
            waitCycles      : 0,
            checked         : false
        }
    }
    public static removeIntroCreditsFrame() {
        let fs = videoProps.video.frames;
        if (fs.length > 0 && fs[0].type == VIDEO_FRAME_TYPE.INTRO) {
            fs.shift();
        }
        if (fs.length > 0 && fs[fs.length-1].type == VIDEO_FRAME_TYPE.CREDITS) {
            fs.pop();
        }
    }

    public static createAuxFrame(frame : IVideoFrame) {
        // don't generate data frames
        if (frame.type == VIDEO_FRAME_TYPE.DATA) { return frame; }
        let image = document.createElement('canvas');
        image.width = frame.width;
        image.height = frame.height;
        let context = image.getContext('2d');

        // add background logo
        let logo = document.getElementById('_videoLogo_1') as HTMLCanvasElement;
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        // determine size of the background image
        let coef = logo.width / logo.height;
        let w = Math.floor(image.height * 0.8);
        let fx = image.width / 640;
        if (image.width < image.height) {
            w = Math.floor(image.width * 0.8);
            fx = image.height / 480;
        }
        let h = Math.floor(w / coef);

        canvas.height = h;
        canvas.width = w;
        ctx.drawImage(logo, 0, 0, w, h);
        var uri = canvas.toDataURL('image/png');
        let offx = Math.round((image.width / 2) * 0.15);
//        if (offx > 150) { offx = 120;}

        // compute font sizes
        let fs = Math.floor(26 + 4 * fx);
        let fs2 = Math.floor(12 + 4 * fx);
        let lh = Math.floor(fs * 1.25);
        let lh2 = Math.floor(fs2 * 1.2);
        console.log(fs, fs2, lh, lh2);

        let fontInfo = `text-transform: uppercase;line-height: ${lh}px;font-size: ${fs}px;`;
        let label = '';
        if (videoProps.auxFrameSettings.label) {
            label = videoProps.auxFrameSettings.label;
        } else if (navProps.settings.app.singleLabel) {
            label = navProps.settings.app.singleLabel;
        } else if (navProps.settings.app.doubleLongLabel) {
            label = navProps.settings.app.doubleLongLabel;
        }
        let style = '';
        if (frame.type == VIDEO_FRAME_TYPE.INTRO) {
            style = videoProps.auxFrameSettings.introStyle;
        } else if (frame.type == VIDEO_FRAME_TYPE.CREDITS) {
            fontInfo = `line-height: ${lh2}px;font-size: ${fs2}px;`;
            style = videoProps.auxFrameSettings.creditsStyle;
            // generate credits table
            let credits = this.aggregateCredits();
            label = `<span style="text-transform:uppercase;">${label}</span><br/>`;
            if (credits.length > 0) {
                label += 'Data credits:<br/>';
                for (let i=0; i < credits.length; i++) {
                    label += `${credits[i]}<br/>`;
                }
            }
        } else if (frame.type == VIDEO_FRAME_TYPE.PARTITION) {
            style = videoProps.auxFrameSettings.partitionStyle;
        }

        let data = '';
        if (frame.type == VIDEO_FRAME_TYPE.INTRO || frame.type == VIDEO_FRAME_TYPE.CREDITS) {
            data = `
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${image.width}" height="${image.height}">
                    <foreignObject width="100%" height="100%">
                        <div xmlns="http://www.w3.org/1999/xhtml" style="position:absolute;top:0;left:0;width:${image.width}px;height:${image.height}px;color:#eee;font-family: Titillium Web, sans-serif;font-size: 25px;">
                            <div style="position:absolute;top:0;left:0;width:100%;height:100%;${style}">
                            <img src="${uri}" style="position:absolute; top:10vh; right:5vw;opacity:0.45;"/>
                            <div style="margin: 0 auto;margin-top: 35vh;">
                                    <div style="margin:0 auto;text-align: center;font-family:Titillium Web, sans-serif;${fontInfo}max-width:700px;padding-right:${offx}">
                                        ${label}
                                    </div>                                
                                </div>
                            </div>
                        </div>
                    </foreignObject>
                </svg>
            `;
        } else {
            data = `
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${image.width}" height="${image.height}">
                    <foreignObject width="100%" height="100%">
                        <div xmlns="http://www.w3.org/1999/xhtml" style="position:absolute;top:0;left:0;width:${image.width}px;height:${image.height}px;color:#eee;font-family: Titillium Web, sans-serif;font-size: 25px;">
                            <div style="position:absolute;top:0;left:0;width:100%;height:100%;${style}">
                            </div>
                        </div>
                    </foreignObject>
                </svg>
            `;
        }

        let svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
        let img = new Image();
        var DOMURL = window.URL || window.webkitURL || window;

        var url = DOMURL.createObjectURL(svg);
        frame.imageObj = {image : image, context : context};

        img.onload = function () {
            if (context) {
                context.drawImage(img, 0, 0);
            }
            DOMURL.revokeObjectURL(url);
            frame.loaded = true;
            events.dispatch(events.EVENT_VIDEO_FRAME_LOADED);
            if (frame.type == VIDEO_FRAME_TYPE.PARTITION) {
                animationUtils.refreshVideoFramesList();
            }
        }
        img.src = url;   
        if (frame.loaded) {
            events.dispatch(events.EVENT_VIDEO_FRAME_LOADED);
            if (frame.type == VIDEO_FRAME_TYPE.PARTITION) {
                this.refreshVideoFramesList();
            }
        }         
    }
    
    // go over all frames and aggregate layer credits
    private static aggregateCredits() : Array<string> {
        let fs = videoProps.video.frames;
        if (fs.length == 0 || !videoProps.video.showIntro) { return []; }
        let c = {};
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