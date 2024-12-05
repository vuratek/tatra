import { baseComponent } from "./baseComponent";
import { utils } from "../../utils";
import { hash } from "../../map/hash";

export enum BookmarkDates {
    TODAY   = "today",
    HRS_24  = "24hrs",
    DAY_7   = "7days"
}

export class bookmark extends baseComponent {
	public static id		: string = 'bookmark';
	public static label		: string = 'BOOKMARK';
	public static draggable : boolean = true;
	public static className : string = 'transparentWindow';
    public static showHeader : boolean = false;

    public static createWindow () {
		super.createWindow();

		let el = document.getElementById(`lmvControls_${this.id}_Content`) as HTMLDivElement;
		if (! el) { return; }
		el.innerHTML = `
			<div id="lmvDragLbl_${this.id}" class="transparentWindowLabel">
				<b>BOOKMARK RELATIVE DATE</b>
			</div>
            <div style="width:100%;" class="fmmExplanation">
                <p>
                    Use for administrative purpose only.<br/>
                    NOT recommended for saving hotspot detections as historical reference.
                </p>
                <p>
                    STEPS:<br/>
                    <ul>
                        <li>Zoom to area of interest</li>
                        <li>Show / hide layers of preference</li>
                        <li>
                            Select relative date:
                            <select id="lmvControls_${this.id}_Selection">
                                <option value="${BookmarkDates.TODAY}">TODAY</option>
                                <option value="${BookmarkDates.HRS_24}" selected>24 hrs</option>
                                <option value="${BookmarkDates.DAY_7}" selected>7 days</option>
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
    
    private static updateUrl() {
        let val = utils.getSelectValue(`lmvControls_${this.id}_Selection`);
        hash.dates({start: val});
    }

    public static open() {
        super.open();
        this.basicPosition(550, 50);
	}
}