import { Module } from "./Module";
export class MultiDaySelector extends Module {
}

/*import '../css/multiDaySelector.scss';
import { utils } from "../../../utils";
import { Module } from "./Module";
import { controls } from '../../components/controls';
import { bookmark } from '../../components/bookmark';
import { MenuModule } from '../../obj/MenuModule';

export class MultiDaySelector extends Module {

    public constructor(id : string, parentId:string, module : MenuModule) {
        super(id, parentId, module);
        controls.createControlItem('bookmark', bookmark);
    }
    
    public render () {
        let menu = document.getElementById(this.parentDivId) as HTMLDivElement;
        if (! menu) { return; }
        let th = document.createElement("div");
        th.setAttribute("class", "mds");
        menu.appendChild(th);
        th.innerHTML = `
            <div class="mds_content">
                <div id="${this.mainId}_mds_btn_1" class="mds_time_btn first">
                    <div>today</div>
                </div> 
                <div id="${this.mainId}_mds_btn_24" class="mds_time_btn">
                    <div>24<br>hrs</div>
				</div> 
				<div id="${this.mainId}_mds_btn_7d" class="mds_time_btn">
					<div>7<br>days</div>
				</div> 
				<div id="${this.mainId}_mds_btn_bookmark" class="mds_bookmark_btn">
					<i class="far fa-bookmark" aria-hidden="true"></i>
				</div>
            </div>
            <div id="mdsTimePeriodStatement">
            </div>
        `;

        utils.setClick(`${this.mainId}_mds_btn_1`, () => this.setTime('1'));
		utils.setClick(`${this.mainId}_mds_btn_24`, () => this.setTime('24'));
		utils.setClick(`${this.mainId}_mds_btn_7d`, () => this.setTime('7'));
		utils.setClick(`${this.mainId}_mds_btn_bookmark`, () => this.bookmark());
//		this.displayTimeInfo();

  /*      if (model.quickTimeOption == '') {
            model.quickTimeOption = '24';            
        }
        menuQuick.setTime(model.quickTimeOption);
    }
    public setTime ( time : string ) {
        console.log("TIME", time);
/		if (time == "7") {
			model.advancedDate = utils.getGMTTime(new Date());
			model.advancedImagery = model.advancedDate;
			model.advancedRange = 6;
			localUtils.analyticsTab(`tab-${this.menuId}-${time}`);
			model.cacheObj.date = CacheLayerDate.DAY_7;
			menuCommon.tab(TabType.HISTORICAL);
			return;
		}
        if (time != '') {
            model.quickTimeOption = time;
            utils.removeClass("fmm_btn_1", "fmmTimeBtnSelected");
            utils.removeClass("fmm_btn_24", "fmmTimeBtnSelected");
			utils.addClass("fmm_btn_" + time, "fmmTimeBtnSelected");
			if (time == '24') { model.cacheObj.date = CacheLayerDate.HRS_24;}
			else { model.cacheObj.date = CacheLayerDate.TODAY; }
			this.setTimeInfoLabel();
			this.validateLayers();
			this.forceRefreshLayers();
			menuCommon.updateImageryDate();
			let txt = document.getElementById('lmvFeatureInfo1');
			if (txt) { 
				let info = (time == '24') ? 'Last 24hrs' : 'Today';
				txt.innerHTML = 'Fires: ' + info;
			}
			let date = utils.sanitizeDate(new Date(), true);
			let end = flatpickr.formatDate(date, 'Y-m-d');
		
			let start = (time == '24') ? flatpickr.formatDate(utils.addDay(date,-1), 'Y-m-d') : end;
			for (let group in model.data[TabType.CURRENT]) {
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
			}
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
			//hash.dates({start :start, end : end});
			hash.dates({start: model.cacheObj.date});
			localUtils.analyticsTab(`tab-${this.menuId}-${time}`);
		}
		mapUtils.setImageryInfo();
    }
    private bookmark() {
		controls.activateControlItem('bookmark');
//        bookmark.open();
	}

}*/