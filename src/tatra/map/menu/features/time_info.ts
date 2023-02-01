import { baseComponent } from "../../components/baseComponent";
import { utils } from "../../../utils";

export class time_info extends baseComponent {
	public static id		: string = 'time_info';
	public static label		: string = 'TIME INFO';
	public static draggable : boolean = true;
	public static className : string = 'transparentWindow';
    public static showHeader : boolean = false;

    public static createWindow () {
		super.createWindow();

		let el = document.getElementById(`lmvControls_${this.id}_Content`) as HTMLDivElement;
        if (! el) { return; }
        let today = utils.getGMTTime(new Date());
        today.setUTCHours(0);
        today.setUTCMinutes(0);
        today.setUTCSeconds(0);
        let yesterday = utils.addDay(utils.getGMTTime(new Date()), -1);
        yesterday.setUTCHours(0);
        yesterday.setUTCMinutes(0);
        yesterday.setUTCSeconds(0);
        
		el.innerHTML = `
			<div id="lmvDragLbl_${this.id}" class="transparentWindowLabel">
				<b>TIME INFORMATION</b>
			</div>
            <div style="width:100%;" class="fmmExplanation fmmExplanation2">
                <br/>
                <table>
                    <tr>
                        <td>Today</td>
                        <td>from 0000 GMT today to present</td>
                    </tr>
                    <tr>
                        <td>GMT</td>
                        <td>${today.toUTCString()} to present</td>
                    </tr>
                    <tr>
                        <td>Local</td>
                        <td>${today.toString()} to present</td>
                    </tr>
                </table>
                <br/>
                <table>
                    <tr>
                        <td>24 hours</td>
                        <td>from 0000 GMT yesterday to present</td>
                    </tr>
                    <tr>
                        <td>GMT</td>
                        <td>${yesterday.toUTCString()} to present</td>
                    </tr>
                    <tr>
                        <td>Local</td>
                        <td>${yesterday.toString()} to present</td>
                    </tr>
                </table>
			</div>	
		`;
        super.setDraggable(`lmvDragLbl_${this.id}`);
//        utils.setChange(`lmvControls_${this.id}_Selection`, ()=> this.updateUrl());
    }

    public static open() {
        super.open();
		let mh = (document.getElementById('map') as HTMLDivElement).clientHeight;
		let mw = (document.getElementById('map') as HTMLDivElement).clientWidth;
		let posy = 0;
		let posx = 0;
		if (mh > 500) {
			posy = 70;
		}
		if (mw > 600) {
			posx = mw - 570;
		}		
        this.position(posx, posy);
	}
}