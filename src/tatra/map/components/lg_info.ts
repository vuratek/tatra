// layer group info window

import { baseComponent } from "./baseComponent";

export class lg_info extends baseComponent {
	public static id		: string = 'lg_info';
	public static label		: string = 'EXPLANATION';
	public static draggable : boolean = true;
	public static className : string = 'transparentWindow';

    
    public static createWindow () {
		super.createWindow();
		super.setDraggable(`lmvDragLbl_${this.id}`);
	}
    
    public static open() {
		super.open();
		let mh = (document.getElementById('map') as HTMLDivElement).clientHeight;
		let mw = (document.getElementById('map') as HTMLDivElement).clientWidth;
		let posy = 0;
		let posx = 0;
		if (mh > 500) {
			posy = 50;
		}
		if (mw > 600) {
			posx = mw - 550;
		}		
        this.position(posx, posy);
	}

}