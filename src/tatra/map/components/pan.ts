import { baseComponent } from "./BaseComponent";
import { tools } from "../tools";
import { Pan as PanTool } from "../mapTools/Pan";

export class pan extends baseComponent {
    public static id		    : string = 'pan';
    public static clandestine   : boolean = true;
    public static tool          : PanTool = new PanTool(pan.id);

    public static init() {
        tools.register(this.tool);
        super.init();
    }

    public static open() {
        super.open();
        tools.activate(this.id);
    }

}