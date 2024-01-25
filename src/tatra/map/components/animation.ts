import { baseComponent } from "./BaseComponent";;
import flatpickr from 'flatpickr';
import { utils } from "../../utils";
import { props } from "../props";

export class animation extends baseComponent {
	public static id		            : string = 'animation';
	public static label		            : string = 'Animate';
	public static draggable             : boolean = true;
	public static className             : string = 'transparentWindow';
    public static showHeader            : boolean = false;
    public static calendarFrom          : any;
    public static calendarTo            : any;
    public static readonly df           : string = 'M d Y';
    

	public static createWindow () {
		super.createWindow();

		let el = document.getElementById(`lmvControls_${this.id}_Content`) as HTMLDivElement;
		if (! el) { return; }
		el.innerHTML = `
			<div id="lmvDragLbl_${this.id}" class="transparentWindowLabel">
				<span id="lmvControls_${this.id}_Layer" class="opacityTitleLbl">Animate</span>
			</div>
			<div style="width:100%;" class="lmvAnimation">
                <table>
                    <tr>
                        <td>From:</td>
                        <td>
                            <span id="animationCalendarFrom" class="mdsCalendar"><i class="fa fa-calendar-alt fa-lg"></i></span>
                            <input type="text" id="animation_dateFrom" readonly>
                        </td>
                    </tr>
                    <tr>
                        <td>Step:</td>
                        <td>
                            <select id="lmvControls_${this.id}_step">
                                <option value="1d" selected>1 Day</option>
                                <option value="2d">2 Days</option>
                                <option value="3d">3 Days</option>
                                <option value="4d">4 Days</option>
                                <option value="5d">5 Days</option>
                                <option value="6d">6 Days</option>
                                <option value="7d">7 Days</option>
                                <option value="10d">10 Days</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td>To:</td>
                        <td>
                            <span id="animationCalendarTo" class="mdsCalendar"><i class="fa fa-calendar-alt fa-lg"></i></span>
                            <input type="text" id="animation_dateTo" readonly>
                        </td>
                    </tr>
                </table>
			</div>	
		`;
        super.setDraggable(`lmvDragLbl_${this.id}`);
        this.initDatePicker(props.time.date, "From");
        this.initDatePicker(props.time.date, "To");
    }

	public static open() {
		super.open();
		let mh = (document.getElementById('map') as HTMLDivElement).clientHeight;
		let mw = (document.getElementById('map') as HTMLDivElement).clientWidth;
		let posy = 0;
		let posx = 0;
		if (mh > 500) {
			posy = mh - 300;
		}
		if (mw > 400 && mw < 800) {
			posx = 50;
		} else if (mw > 600) {
			posx = mw / 2 - 150;
		}		
		this.position(posx, posy);
    }

    public static initDatePicker (d : Date, type : string) {
        let option = this;
        if (type == "From") {
            if (this.calendarFrom) {
                this.calendarFrom.destroy();
            }    
        } else {
            if (this.calendarTo) {
                this.calendarTo.destroy();
            }    
        }
        this.calendarFrom = flatpickr("#animation_date" + type, {
            dateFormat : this.df,
            defaultDate : d,
            minDate : new Date(2000,11-1, 11),
            maxDate : utils.getGMTTime(new Date()),
            onChange : function () {
//                option.setDates();
            }
        }) as Instance;
//        this.setDates();
	}
}
