import flatpickr from "flatpickr";
import { IVideo, IVideoFrame, VIDEO_TRANSITION, VIDEO_FRAME_TYPE, RENDER_MODE, videoProps } from "./props";
import { events } from "../events";
import { navProps } from "../../page/navProps";
import { animationUtils } from "./utils";

export class animationFrames {
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
                <div id="vfl_chk-${i.toString()}" class="layerOnOffButton"><i class="fa fa-check" aria-hidden="true"></i></div>
            `;
            let can = document.getElementById(fid) as HTMLCanvasElement;
            can.width = w;
            can.height = h;
        }
    }
    public static generatePartition(index : number) {
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
    // create intro, credits or partition frame
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
        if (ctx) {
            ctx.drawImage(logo, 0, 0, w, h);
        }
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
        let txtLoc = '35';
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
            txtLoc = '25';
            style = videoProps.auxFrameSettings.creditsStyle;
            // generate credits table
            let credits = animationUtils.aggregateCredits();
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
                            <div style="margin: 0 auto;margin-top:${txtLoc}vh;">
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
                animationUtils.refreshVideoFramesList();
            }
        }         
    }
}