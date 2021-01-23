import { baseComponent } from "./baseComponent";
import { utils } from "../../utils";
import { controls } from "./controls";
import { props } from "../props";

export class resize extends baseComponent {
    public static id		    : string = 'resize';
    public static clandestine   : boolean = true;
    private static fullScreen   : boolean = false;
    private static fullScreenHandler : (evt: Event) => void;   

    public static open () {
        this.requestFullScreen();
        super.open();

        utils.addClass('header', 'noDisplay', false);
        utils.addClass('footer', 'noDisplay', false);
        utils.addClass('map', 'mapMax');
        utils.addClass('lmvInfoBar', 'noDisplay');
        utils.addClass('lmvControls', 'lmvControlsMax');
        utils.addClass('leftNavBarShell', 'noDisplay');
        (document.getElementById('lmvMaxLabel') as HTMLDivElement).style.display = "block";
        utils.addClass('.ol-zoom', 'ol-zoomMax');
        utils.addClass('.ol-scale-line', 'ol-scale-lineMax');
        props.map.updateSize();
                
        //utils.analyticsTrack('tool-maximize');

    }
    public static close () {
        super.close();
        this.cancelFullScreen();
    }
    
    private static requestFullScreen () {
        let el = document.documentElement;
        // Supports most browsers and their versions.
        let requestMethod = el.requestFullScreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullScreen;
        this.fullScreen = true;

        if (requestMethod) { // Native full screen.
            requestMethod.call(el);
        } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
            let wscript = new ActiveXObject("WScript.Shell");
            if (wscript !== null) {
                wscript.SendKeys("{F11}");
            }
        }
        // send resize event, and then register. prevents closing the full screen on init
        window.dispatchEvent(new Event('resize'));

        this.fullScreenHandler = (e) => this.fullScreenListener(e);
        window.addEventListener("resize", this.fullScreenHandler);
    }

    private static cancelFullScreen () {
        if ( ! this.fullScreen) { return; }
        this.fullScreen = false;
        window.removeEventListener("resize"  , this.fullScreenHandler);
        let el = document;
        let requestMethod = el.cancelFullScreen || el.webkitCancelFullScreen || el.webkitExitFullscreen || el.msExitFullscreen ||
                            el.mozCancelFullScreen || el.exitFullscreen;
        if (requestMethod) { // cancel full screen.
            requestMethod.call(el);
        } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
            let wscript = new ActiveXObject("WScript.Shell");
            if (wscript !== null) {
                wscript.SendKeys("{F11}");
            }
        }

        (document.getElementById('lmvMaxLabel') as HTMLDivElement).style.display = "none";
        utils.removeClass('header', 'noDisplay', false);
        utils.removeClass('footer', 'noDisplay', false);
        utils.removeClass('map', 'mapMax');
        utils.removeClass('lmvInfoBar', 'noDisplay');
        utils.removeClass('lmvControls', 'lmvControlsMax');
        utils.removeClass('leftNavBarShell', 'noDisplay');     
        utils.removeClass('.ol-zoom', 'ol-zoomMax');
        utils.removeClass('.ol-scale-line', 'ol-scale-lineMax');
        window.dispatchEvent(new Event('resize'));
        props.map.updateSize();
    }

    private static fullScreenListener (e : Event) {
        if (!(window.outerWidth === screen.width && window.outerHeight === screen.height)) {
            if (this.fullScreen) {
                controls.onClick("resize");
            }
        }
    }

    public static resize() {
        // super class closes the object, so ignore that        
    }

/*
    public static maximize () {
        if (controls.currentState == "normal") {

            controls.currentState = "max";
            
            let elem = document.body; // Make the body go full screen.
            controls.requestFullScreen(elem);
            window.addEventListener("resize", controls.fullScreenListener);
        } else {
            controls.currentState = "normal";
            window.removeEventListener("resize"  , controls.fullScreenListener);
            controls.cancelFullScreen(document);
        }
    
        props.map.updateSize();
    }


    */
}