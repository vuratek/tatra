import { baseComponent } from "./baseComponent";
import { utils } from "../../utils";

export class timeline extends baseComponent {

    public static id		    : string = 'timeline';
    public static label		    : string = 'TIMELINE';
    public static clandestine   : boolean = true;


    public static open () {
        super.open();
        utils.show('timeline');
        utils.addClass("html", "isTimeline", false);
    }

    public static close () {
        super.close();
        utils.hide('timeline');
        utils.removeClass("html", "isTimeline", false);
    }
    public static resize() {
    }
	
}