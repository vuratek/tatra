import { IImageObj } from "../imageUtils";


export enum VIDEO_TRANSITION {
    HARD            = "hard",
    SOFT            = "soft",
    CONTINUOUS      = "continuous"
}
export enum RENDER_MODE {
    DAILY           = "daily",
    SUBDAILY        = "subdaily"
}

export enum VIDEO_FRAME_TYPE {
    CREDITS     = "credits",
    DATA        = "data",
    INTRO       = "intro",
    PARTITION   = "partition"    
}

export interface IVideoFrame {
    date            : Date;                     // which date does it represent
    range           : number;                   // # of days
    rangeMins       : number;
    credits         : Array<string>;            // list of agencies / org that are used on the map
    layers          : Array<string>;            // list of visible layers
    imageObj        : IImageObj | null;         // image/data information
    loaded          : boolean;                  // is data available
    width           : number;                   // width of the image (may or may not match the video size)
    height          : number;                   // height of the image
    duration        : number;                   // miliseconds
    transition      : VIDEO_TRANSITION;         // how does frame execute
    type            : VIDEO_FRAME_TYPE;         // type of frame; data is from the mapviewer
    isWorld         : boolean;
    waitCycles      : number;                   // how many cycles to wait for frame to load (increased when reload requested)
    checked         : boolean;
}

export interface IVideo {
    frames          : Array<IVideoFrame>;
    speed           : number;
    step            : string;
    timerCounter    : number;
    ignoreCounter   : boolean;
    logoDiv?        : string;
    showCredits     : boolean;
    showInfo        : boolean;
    showIntro       : boolean;
    showLogo        : boolean;
    showTopBanner   : boolean;
}

export interface IAuxVideoFrame {
    introStyle     : string,
    creditsStyle   : string,
    partitionStyle : string,
    backgroundLogo : string,
    label          : string | null,        // provide custom header
}

export class AnimationProps {
    public loadTimer                : Function | null = null;
    public playTimer                : Function | null = null;
    public videoPlaying             : boolean = false;
    public defaultFrames            : number = 7;
    public maxFrames                : number = 50;
    public intervalDelay            : number = 50;      // miliseconds for frame loading timer
    public videoDelay               : number = 10;      // miliseconds for video play timer
    public frameLoaderCounter       : number = 0;
    public framePlayCounter         : number = 0;
    public framePlayDurationCounter : number = 0;
    public transitionSoftDelay      : number = 450;     // ms for transitioning image
}

export class videoProps {
    public static video                 : IVideo = { 
                                            step : "1", 
                                            frames : [], 
                                            speed : 5, 
                                            timerCounter : 0, 
                                            ignoreCounter : false, 
                                            showCredits : true,
                                            showInfo : true, 
                                            showIntro : true, 
                                            showLogo : true, 
                                            showTopBanner : true
                                        };
    public static props                 : AnimationProps = new AnimationProps();
    public static defaultDuration       : number = 2500;
    public static videoLoaderIndex      : number = 0;
    public static defaultTransition     : VIDEO_TRANSITION = VIDEO_TRANSITION.SOFT;
    public static defaultVideoReload    : boolean = false;   
    public static chkAllFrames          : boolean = false;
    public static readyToPlay           : boolean = false;
    public static renderMode            : RENDER_MODE = RENDER_MODE.DAILY;
    public static isSubDaily            : boolean = false;
    public static auxFrameSettings      : IAuxVideoFrame = {
                                            introStyle : 'background:radial-gradient(circle at 90%, #222, #06274f 50%, #182a3f 75%, #babed4 76%, #111 76%);',
                                            creditsStyle : 'background:linear-gradient(0, #06274f, #182a3f); font-size: 18px;',
                                            partitionStyle : 'background:radial-gradient(farthest-corner at 40px 40px, #222 0%, #0a2431 100%);',
                                            backgroundLogo : '<img id="_videoLogo_1" src="/images/nasa_logo_white.png" style="width:432px;height:432px;">',
                                            label : null
                                        };

    public static calendarFrom          : any;
    public static calendarTo            : any;
    public static readonly df           : string = 'M d Y';
    public static readonly df_sub       : string = 'M d Y H:i';

    public static reset() {
        this.video.frames = [];
        this.video.timerCounter = 0;
        this.video.ignoreCounter = false;
        this.readyToPlay = false;
    }
}