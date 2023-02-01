import '../css/multiDaySelector.scss';
import { Module } from "./Module";
import { utils } from "../../../utils";
import { controls } from "../../components/controls";
import { mapUtils } from '../../mapUtils';
import { bookmark } from "../features/bookmark";
import { time_info } from "../features/time_info";
import { BasicMenuDates, BasicMenuDateValues } from '../../defs/Times';
import { hash } from '../../hash';
import { props } from '../../props';
import flatpickr from 'flatpickr';

export class MultiDaySelector extends Module {

	public render(par : HTMLDivElement) {
		super.render(par);
		if (this.props.descriptionText) {
			bookmark.setDescriptionText(this.props.descriptionText);
		}
		controls.createControlItem('bookmark', bookmark);
		controls.createControlItem('time_info', time_info);
		let el = document.getElementById(`mmm_${this.props.id}`) as HTMLDivElement;
		let th = document.createElement("div");
        th.setAttribute("class", "mds");
        el.appendChild(th);
        th.innerHTML = `
            <div class="mds_content">
                <div id="${this.props.id}_mds_btn_1" class="mds_time_btn">
                    <div>${BasicMenuDates.TODAY}</div>
                </div> 
                <div id="${this.props.id}_mds_btn_24" class="mds_time_btn">
                    <div>${BasicMenuDates.HRS_24}</div>
				</div> 
				<div id="${this.props.id}_mds_btn_7d" class="mds_time_btn">
					<div>${BasicMenuDates.DAY_7}</div>
				</div> 
				<div id="${this.props.id}_mds_btn_bookmark" class="mds_bookmark_btn">
					<i class="far fa-bookmark" aria-hidden="true"></i>
				</div>
            </div>
            <div id="mdsTimePeriodStatement">
            </div>
		`;
		utils.setClick(`${this.props.id}_mds_btn_1`, () => this.setTime(BasicMenuDateValues.TODAY));
		utils.setClick(`${this.props.id}_mds_btn_24`, () => this.setTime(BasicMenuDateValues.HRS_24));
		utils.setClick(`${this.props.id}_mds_btn_7d`, () => this.setTime(BasicMenuDateValues.DAY_7));
		utils.setClick(`${this.props.id}_mds_btn_bookmark`, () => this.bookmark());
	}
	public setTime ( time : number ) {
		console.log("TIME", time);
		props.time.quickTime = time;
		if (time == BasicMenuDateValues.DAY_7) {
			props.time.date = utils.getGMTTime(new Date());
			props.time.imageryDate = props.time.date;
			props.time.range = 6;
			//localUtils.analyticsTab(`tab-${this.menuId}-${time}`);
			
//			model.cacheObj.date = CacheLayerDate.DAY_7;
//			menuCommon.tab(TabType.HISTORICAL);
			return;
		}
//            model.quickTimeOption = time;
            utils.removeClass(`${this.props.id}_mds_btn_1`, "mmTimeBtnSelected");
            utils.removeClass(`${this.props.id}_mds_btn_24`, "mmTimeBtnSelected");
			utils.addClass(`${this.props.id}_mds_btn_${time}`, "mmTimeBtnSelected");
//			if (time == '24') { model.cacheObj.date = CacheLayerDate.HRS_24;}
//			else { model.cacheObj.date = CacheLayerDate.TODAY; }
			this.setTimeInfoLabel();
//			this.validateLayers();
//			this.forceRefreshLayers();
//			menuCommon.updateImageryDate();
			let txt = document.getElementById('lmvFeatureInfo1');
			if (txt) { 
				let info = (time == 24) ? 'Last 24hrs' : 'Today';
				txt.innerHTML = 'Fires: ' + info;
			}
			let date = utils.sanitizeDate(new Date(), true);
			let end = flatpickr.formatDate(date, 'Y-m-d');
		
			let start = (time == 24) ? flatpickr.formatDate(utils.addDay(date,-1), 'Y-m-d') : end;
/*			for (let group in model.data[TabType.CURRENT]) {
				if (group == GroupType.NONE) {
					for (let layer in model.data[TabType.CURRENT][group].layers) {
						let lo = mapUtils.getLayerById(layer);
						if (!lo) {continue;}
						let refresh = false;
						if (lo.data.start != start) { lo.data.start = start; }
						if (lo.data.end != end) { lo.data.end = end; }
						if (refresh && lo._layer) {
							lo.refresh();	
						}
					}
				}
			}*/
			for (let i=0; i< props.layers.length;i ++) {
				let lo = props.layers[i];
				if (lo.handler == "timeBased") {
					lo.data.start = start;
					lo.data.end = end;
					if (lo._layer && lo.visible) {
						lo.refresh();	
					}
				}
			}
			//hash.dates({start :start, end : end}); ** not needed?
//			hash.dates({start: model.cacheObj.date});
//			localUtils.analyticsTab(`tab-${this.menuId}-${time}`);
		mapUtils.setImageryInfo();
    }
    private bookmark() {
		controls.activateControlItem('bookmark');
	}

	private setTimeInfoLabel () {
		let txt = (props.time.quickTime == 1)  ? BasicMenuDates.TODAY : BasicMenuDates.HRS_24;
		let label = `<span class="mds_btn_timeInfoTitle">${txt}</span><br/>`;
		label += (props.time.quickTime == 1) ? "From [Today 00:00:00 GMT] to present" : "From [Yesterday 00:00:00 GMT] to present";
		label += `<span id="mds_btn_timeInfo" class="colorBlue"> <i class="fa fa-info-circle" aria-hidden="true"></i></span>`;
//        label += '<br><a target="_blank" rel="noopener" href="https://greenwichmeantime.com/uk/time/">Current Date/Time in GMT</a>';
        let el = document.getElementById('mdsTimePeriodStatement');
        if (el) {
			el.innerHTML = label;
			utils.setClick('mds_btn_timeInfo', () => this.displayTimeInfoDetail());
        }
	}
	private displayTimeInfoDetail() {
		controls.activateControlItem('time_info');
        time_info.open();
	}
}