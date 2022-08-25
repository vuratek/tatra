import { baseComponent } from "./BaseComponent";
import { utils } from "../../utils";
import { props } from "../props";
import { menu } from "../menu";
import { controls } from "./controls";

export class resize extends baseComponent {
    public static id		    : string = 'resize';
    public static clandestine   : boolean = true;
    public static ignoreResize  : boolean = true;

    public static open() {
        super.open();
        utils.addClass('body', 'resize', false);
        props.map.updateSize();
        menu.close();
        if (! controls.items['toggle'].visible) {
            controls.onClick('toggle');
        }
    }

    public static close() {
        super.close();
        utils.removeClass('body', 'resize', false);
        props.map.updateSize();
    }

}