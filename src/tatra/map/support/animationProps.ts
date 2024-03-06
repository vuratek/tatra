import { IImageObj } from "../imageUtils";


export enum VIDEO_TRANSITION {
    HARD            = "hard",
    SOFT            = "soft",
    CONTINUOUS      = "continuous"
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
    imageObj        : IImageObj | null;         // image/data information
    loaded          : boolean;                  // is data available
    width           : number;                   // width of the image (may or may not match the video size)
    height          : number;                   // height of the image
    duration        : number;                   // miliseconds
    transition      : VIDEO_TRANSITION;         // how does frame execute
    type            : VIDEO_FRAME_TYPE;         // type of frame; data is from the mapviewer
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
    showTopBanner   : boolean;
    showLogo        : boolean;
    showIntro       : boolean;
    showInfo        : boolean;
}

export class AnimationProps {
    public loadTimer                : Function | null = null;
    public playTimer                : Function | null = null;
    public videoPlaying             : boolean = false;
    public defaultFrames            : number = 1;
    public maxFrames                : number = 50;
    public intervalDelay            : number = 50;      // miliseconds for frame loading timer
    public videoDelay               : number = 10;      // miliseconds for video play timer
    public frameLoaderCounter       : number = 0;
    public framePlayCounter         : number = 0;
    public framePlayDurationCounter : number = 0;
    public transitionSoftDelay      : number = 450;     // ms for transitioning image
}

export class videoProps {
    public static video                 : IVideo = { step : "1", frames : [], speed : 5, timerCounter : 0, ignoreCounter : false, showTopBanner : true, showInfo : true, showLogo : true, showIntro : true };
    public static props                 : AnimationProps = new AnimationProps();
    public static defaultDuration       : number = 2500;
    public static defaultTransition     : VIDEO_TRANSITION = VIDEO_TRANSITION.SOFT;
    public static defaultVideoReload    : boolean = true;   
    public static chkAllFrames          : boolean = false;
}