import { baseComponent } from "./BaseComponent";
import { utils } from "../../utils";

export class timeline extends baseComponent {

    public static id		    : string = 'timeline';
    public static label		    : string = 'TIMELINE';
    public static clandestine   : boolean = true;


    public static open () {
        super.open();
        utils.show('timeline');
        utils.addClass("html", "isTimeline", false);
        utils.removeClass('lmvControls','mapControlBartimelineAnimationCLOSE');
        utils.addClass('lmvControls','mapControlBartimelineAnimationOPEN');
//        utils.removeClass('mapControlBar','mapControlBartimelineAnimationCLOSE');
//        utils.addClass('mapControlBar','mapControlBartimelineAnimationOPEN');

        utils.removeClass('timeline','timelineAnimationCLOSE');
        utils.addClass('timeline','timelineAnimationOPEN'); 
    }

    public static close () {
        super.close();
        //utils.hide('timeline');
        utils.removeClass('lmvControls','mapControlBartimelineAnimationOPEN');
        utils.addClass('lmvControls','mapControlBartimelineAnimationCLOSE');
//        utils.removeClass('mapControlBar','mapControlBartimelineAnimationOPEN');
//        utils.addClass('mapControlBar','mapControlBartimelineAnimationCLOSE');

        utils.removeClass('timeline','timelineAnimationOPEN');
        utils.addClass('timeline','timelineAnimationCLOSE');  
        //utils.removeClass('body', 'resize', false);
        utils.removeClass("html", "isTimeline", false);

    }
    public static resize() {
    }
	
}