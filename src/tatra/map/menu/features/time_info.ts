import { baseComponent } from "../../components/baseComponent";
import { utils } from "../../../utils";

// TimeInfoOption
export enum tio {
    TODAY = "today",
    DAY2 = "day2",
    DAY3 = "day3",
    DAY7 = "day7",
    HOUR1 = "hour1",
    HOUR2 = "hour2",
    HOUR4 = "hour4",
    HOUR6 = "hour6"
}

export class time_info extends baseComponent {
	public static id		: string = 'time_info';
	public static label		: string = 'TIME INFO';
	public static draggable : boolean = true;
	public static className : string = 'transparentWindow';
    public static showHeader : boolean = false;
    private static options : Array <string> = [tio.TODAY, tio.DAY2, tio.DAY3, tio.DAY7];

    public static createWindow () {
		super.createWindow();

        this.populateTypes();

        super.setDraggable(`lmvDragLbl_${this.id}`);
//        utils.setChange(`lmvControls_${this.id}_Selection`, ()=> this.updateUrl());
    }

    private static populateTypes () {
        let el = document.getElementById(`lmvControls_${this.id}_Content`) as HTMLDivElement;
        if (! el) { return; }
        let str = `
            <div id="lmvDragLbl_${this.id}" class="transparentWindowLabel">
                <b>TIME INFORMATION</b>
            </div>
            <div style="width:100%;" class="fmmExplanation fmmExplanation2">
        `;
        let _date = new Date();
        for (let i = 0; i < this.options.length; i++) {
            let option = this.options[i];
            let days = 0;
            let lblTitle = '';
            let lblDesc = '';
            let mins = 0;
            switch (option) {
                case tio.TODAY:
                    lblTitle = 'Today';
                    lblDesc = 'today';
                    break;
                case tio.DAY2:
                    days = 1;
                    lblTitle = '24 hours';
                    lblDesc = 'yesterday';
                    break;
                case tio.DAY3:
                    days = 2;
                    lblTitle = '3 days';
                    lblDesc = '3 days ago';
                    break;
                case tio.DAY7:
                    days = 6;
                    lblTitle = '7 days';
                    lblDesc = '7 days ago';
                    break;
                case tio.HOUR1:
                    mins = 60;
                    lblTitle = '1 hour';
                    lblDesc = '1 hour ago';
                    break;
                case tio.HOUR2:
                    mins = 120;
                    lblTitle = '2 hours';
                    lblDesc = '2 hours ago';
                    break;
                case tio.HOUR4:
                    mins = 240;
                    lblTitle = '4 hours';
                    lblDesc = '4 hours ago';
                    break;
                case tio.HOUR6:
                    mins = 360;
                    lblTitle = '6 hours';
                    lblDesc = '6 hours ago';
                    break;
                default:
                    days = -2;                
            }
            if (days == -2) { continue;}
            
            let date = _date;
            if (days > 0) {
                date = utils.addDay(date, - days);   
            }
            // if showing days, reset hrs and mins
            if (mins == 0) {
                date.setUTCHours(0);
                date.setUTCMinutes(0);
                lblDesc = `00:00 UTC ${lblDesc}`;
            } else {
                date = utils.addMinutes(date, - mins);
            }
            date.setUTCSeconds(0);
            str += `
                <br/>
                <table>
                    <tr>
                        <td>${lblTitle}</td>
                        <td>from ${lblDesc} to present</td>
                    </tr>
                    <tr>
                        <td>UTC</td>
                        <td>${date.toUTCString().replace('GMT','UTC')} to present</td>
                    </tr>
                    <tr>
                        <td>Local</td>
                        <td>${date.toString().replace('GMT','UTC')} to present</td>
                    </tr>
                </table>
            `;
        }

        str += `</div>`;
        el.innerHTML = str;
    }

    public static setDisplayOptions(options : Array<string>) {
        this.options = options;
        console.log(options);
        this.populateTypes();
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