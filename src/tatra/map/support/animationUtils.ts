import { timelineController } from "../../timeline/timelineController";
import { props } from "../props";
import { MapTime } from "../obj/MapTime";
import { utils } from "../../utils";
import { configProps } from "./configProps";
import { events } from "../events";
import { IVideo, IVideoFrame, VIDEO_TRANSITION } from "./animationProps";
import flatpickr from "flatpickr";
import { videoProps } from "./animationProps";

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
            center = view.getCenter();
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
                    <tr>
                        <td>Resolution:</td>
                        <td>
                            ${this.renderResolutionsSelect()}
                        </td>
                    </tr>
                </table>
                <div>
                    <div id="anim_btn_load_video" class="anim_btn_load_video">Load Video</div>
                </div>
			</div>	
		`;
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
                <div>
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
                        <option value="7500">7.5s</option>
                        <option value="10000">10s</option>
                    </select>
                    <span>Transition: </span>
                    <select id="vidFrameTransition">
                        <option value="${VIDEO_TRANSITION.SOFT}">Soft</option>
                        <option value="${VIDEO_TRANSITION.HARD}">Hard</option>
                        <option value="${VIDEO_TRANSITION.CONTINUOUS}">Continuous</option>
                    </select>
                </div>
            </div>
        `;
        utils.setSelectValue('vidFrameDuration', videoProps.defaultDuration.toString());
        utils.setChange('vidFrameDuration', ()=>this.updateDuration());
        utils.setSelectValue('vidFrameTransition', videoProps.defaultTransition);
        utils.setChange('vidFrameTransition', ()=>this.updateTransition());
    }

    // set default duration from select box
    private static updateDuration() {
        let val = utils.getSelectValue('vidFrameDuration');
        videoProps.defaultDuration = Number(val);
        for (let i=0; i< videoProps.video.frames.length; i++) {
            videoProps.video.frames[i].duration = videoProps.defaultDuration;
        }
    }
    // update transition type
    private static updateTransition() {
        let val = utils.getSelectValue('vidFrameTransition') as VIDEO_TRANSITION;
        videoProps.defaultTransition = val;
        for (let i=0; i< videoProps.video.frames.length; i++) {
            videoProps.video.frames[i].transition = videoProps.defaultTransition;
        }
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
            let dur = Math.round(frame.duration / 100) / 10;
            
            li.innerHTML = `
                <canvas id="${fid}"></canvas>
                <div class="vfl_info">
                    <div class="vfl_info_date">${date}${date2}</div>
                    <div class="vfl_info_date">Size: ${frame.width}px x ${frame.height}px</div>
                    <div class="vfl_info_date">Duration: ${dur} sec</div>
                    <div class="vfl_info_date">Transition: ${frame.transition}</div>
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
        if (! videoProps.video) { return; }
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
        if (allLoaded) {
            utils.show('videoLaunch');
        } else {
            utils.hide('videoLaunch');
        }
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
        if (videoProps.video && videoProps.video.frames.length > i && videoProps.video.frames[i].imageObj) {
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
        this.populateVideoFramesList('videoFramesList_content', videoProps.video);
        this.updateVideoImages();
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
                }
            } 
        }
        if (id) {
            if (type == 'checkbox') {
                videoProps.video.frames[Number(id)].checked = ! videoProps.video.frames[Number(id)].checked;
                this.updateInfoCheckboxes();
            }
        }
    }
}