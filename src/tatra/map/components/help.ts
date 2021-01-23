import { baseComponent } from "./baseComponent";

export class help extends baseComponent {
    public static id		: string = 'help';
	public static label		: string = 'Help';
    public static draggable : boolean = true;

    public static open () {
	    super.open();
        let mh = (document.getElementById('map') as HTMLDivElement).clientHeight;
        let mw = (document.getElementById('map') as HTMLDivElement).clientWidth;
        let hh = (document.getElementById('lmvControls_help') as HTMLDivElement).clientHeight;
        let hw = (document.getElementById('lmvControls_help') as HTMLDivElement).clientWidth;
        let x = (mw - hw) / 2 - 10;
        let y = mh - hh - 150;
        if (x < 0) { x = 0;}
        if (y < 0) { y = 0;}
        this.position(x, y);

	}
}