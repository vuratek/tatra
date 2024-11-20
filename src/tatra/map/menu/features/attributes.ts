import { baseComponent } from "../../components/baseComponent";
import { utils } from "../../../utils";

export class attributes extends baseComponent {
	public static id		: string = 'attributes';
	public static label		: string = 'ATTRIBUTES';
	public static draggable : boolean = true;
	public static className : string = 'transparentWindow';
    public static showHeader : boolean = false;
    public static descriptionText : string  = '';

    public static createWindow () {
		super.createWindow();

		let el = document.getElementById(`lmvControls_${this.id}_Content`) as HTMLDivElement;
        if (! el) { return; }
        
		el.innerHTML = `
			<div id="lmvDragLbl_${this.id}" class="transparentWindowLabel">
				<b>${this.label}</b>
			</div>
            <div style="width:100%;" class="identifyJSONLabel" id="lmvControls_${this.id}_Desc">
                ${this.descriptionText}
			</div>	
		`;
        super.setDraggable(`lmvDragLbl_${this.id}`);
    }

    public static setDescriptionText(txt:string) {
		this.descriptionText = txt;
		utils.html(`lmvControls_${this.id}_Desc`, this.descriptionText);
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