import { baseComponent } from "./BaseComponent";
import { utils } from "../../utils";
import { props } from "../props";

export class toggle extends baseComponent {
    public static id		    : string = 'toggle';
    public static clandestine   : boolean = true;
    public static ignoreResize  : boolean = true;

    public static open() {
        super.open();
        utils.show('bottomMenuClosed');
        //utils.hide('mapControlBar');
        utils.removeClass('mapControlBar','mapControlBarAnimationOPEN');
        utils.addClass('mapControlBar','mapControlBarAnimationCLOSE');
//        utils.addClass('body', 'resize', false);
    }

    public static close() {
        super.close();
        utils.hide('bottomMenuClosed');
        utils.show('mapControlBar');
        utils.removeClass('mapControlBar','mapControlBarAnimationCLOSE');
        utils.addClass('mapControlBar','mapControlBarAnimationOPEN');
//        utils.removeClass('body', 'resize', false);
    }

}