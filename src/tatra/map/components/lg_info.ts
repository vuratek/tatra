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
		this.basicPosition(675, 30);
	}
}