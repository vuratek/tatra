import { utils } from "../utils";
import { animation } from "../map/components/animation";
import { controls } from "../map/components/controls";
import { events } from "../map/events";

export class videoOption {
    private static _allowVideo          : boolean = false;
    private static videoWindow          : boolean = false;
    private static video                : HTMLDivElement;
    private static id                   : string = '';
    private static windowUpdateHandler  : (evt: Event) => void;
    private static isInit               : boolean = false;

    public static render(id:string) {
        this.id = id;
        this.videoWindow = false;
        this.video = utils.ae("timeline_video", "timeline_video", this.id) as HTMLDivElement;
        this.video.innerHTML = `<div id="${this.id}VideoWrap" class="timelineCtrlBtn"><i class="fa fa-video fa-lg"></i><br/><span>animate</span></div>`;
        controls.createControlItem('animation', animation);
        utils.setClick(`${this.id}VideoWrap`, ()=> this.updateVideoWindow());
        if (!this.isInit) {
            this.isInit = true;
            this.windowUpdateHandler = (evt) => this.updateMenu(evt as CustomEvent);
            document.addEventListener(events.EVENT_SET_CONTROL_ITEM, this.windowUpdateHandler);
        }
        this.updateVideo();

    }

    private static displayVideo (show : boolean) {
        this._allowVideo = show;
        this.updateVideo();
    }

    private static updateMenu(evt : CustomEvent) {
        if (evt.detail && evt.detail.id == 'animation') {
            if (!evt.detail.visible) {
                this.closeWindow(false);
            }
        }
    }

    // let other modules enable / disable video icon in timeline
    public static allowVideo(allow : boolean) {
        videoOption._allowVideo = allow;
        this.videoWindow = false;
        if (! videoOption._allowVideo) { 
            this.closeWindow(true); 
        }
    }

    // set video icon in timeline
    private static updateVideo() {
        if (this._allowVideo) {
            utils.addClass('html', 'hasVideo', false);
            utils.show('timeline_video');
        } else {
            utils.removeClass('html', 'hasVideo', false);
            utils.hide('timeline_video');
        }
    }

    private static closeWindow(force : boolean) {
        if (force) {
            animation.close();
        }
        utils.removeClass('timelineVideoWrap', 'timelineCtrlBtnSelected');
        this.videoWindow = false;
    }

    private static setVideoWindow() {
        if (! this._allowVideo) { return; }
        if (this.videoWindow) {
            controls.activateControlItem('animation');
            animation.open();
            utils.addClass('timelineVideoWrap', 'timelineCtrlBtnSelected');
        } else {
            this.closeWindow(true);
        }
    }

    private static updateVideoWindow() {
        this.videoWindow = ! this.videoWindow;
        this.setVideoWindow();
    }
}