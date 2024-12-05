import { baseComponent } from "../../components/baseComponent";
import { utils } from "../../../utils";
import { hash } from "../../hash";
import { BasicMenuDates } from "../../defs/Times";

export class bookmark extends baseComponent {
	public static id		: string = 'bookmark';
	public static label		: string = 'BOOKMARK';
	public static draggable : boolean = true;
	public static className : string = 'transparentWindow';
    public static showHeader : boolean = false;
    public static descriptionText : string | null = null;

    public static createWindow () {
		super.createWindow();

		let el = document.getElementById(`lmvControls_${this.id}_Content`) as HTMLDivElement;
        if (! el) { return; }
        
        let desc = (this.descriptionText) ? `<p>${this.descriptionText}</p>` : '';

		el.innerHTML = `
			<div id="lmvDragLbl_${this.id}" class="transparentWindowLabel">
				<b>BOOKMARK RELATIVE DATE</b>
			</div>
            <div style="width:100%;" class="fmmExplanation">
                ${desc}
                <p>
                    STEPS:<br/>
                    <ul>
                        <li>Zoom to area of interest</li>
                        <li>Show / hide layers of preference</li>
                        <li>
                            Select relative date:
                            <select id="lmvControls_${this.id}_Selection">
                                <option value="${BasicMenuDates.TODAY}">${BasicMenuDates.TODAY}</option>
                                <option value="${BasicMenuDates.HRS_24}" selected>${BasicMenuDates.HRS_24}</option>
                                <option value="${BasicMenuDates.DAY_7}">${BasicMenuDates.DAY_7}</option>
                            </select>
                        </li>
                    </ul>
                    <div id="lmvControls_${this.id}_url">Update browser URL</div>
                    <ul>
                        <li>Bookmark the url in your browser.</li>
                    </ul>
                </p>
			</div>	
		`;
        super.setDraggable(`lmvDragLbl_${this.id}`);
        utils.setClick(`lmvControls_${this.id}_url`, ()=> this.updateUrl());
//        utils.setChange(`lmvControls_${this.id}_Selection`, ()=> this.updateUrl());
    }

    public static setDescriptionText(txt:string) {
        this.descriptionText = txt;
    }
    
    private static updateUrl() {
        let val = utils.getSelectValue(`lmvControls_${this.id}_Selection`);
        hash.dates({start: val});
    }

    public static open() {
        super.open();
        this.basicPosition(550, 50);
	}
}