import { baseComponent } from "./BaseComponent";

export class help extends baseComponent {
    public static id		: string = 'help';
	public static label		: string = 'Help';
    public static draggable : boolean = true;

    public static open () {
	    super.open();
        this.defaultPosition();
	}
}