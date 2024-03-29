import { mainMenu } from "./mainMenu";
import { Timeline } from "../../timeline/Timeline";
import { props } from "../props";
import { mapUtils } from "../mapUtils";
import { IConfigDef } from "../defs/ConfigDef";

export class MenuOption {

    public id : string;
    public topContainer : HTMLDivElement | null = null;
    public container : HTMLDivElement | null = null;
    public timelineHandler : (evt: Event) => void;

    public constructor(id:string) {
        this.id = id;
        this.timelineHandler = () => this.timelineUpdate();
        document.addEventListener(Timeline.EVENT_TIMELINE_UPDATED, this.timelineHandler);   
    }

    public close() {
        let divId = mainMenu.getId();
        let mainDiv = document.getElementById(`${divId}_content`) as HTMLDivElement;
        mainDiv.innerHTML = '';
        let topDiv = document.getElementById(`${divId}TopContent`) as HTMLDivElement;
        topDiv.innerHTML = '';
        document.removeEventListener(Timeline.EVENT_TIMELINE_UPDATED, this.timelineHandler);
        Timeline.delete();
    }

    public open() {
        this.render();
    }

    public render() {
        let divId = mainMenu.getId();
        let mainDiv = document.getElementById(`${divId}_content`) as HTMLDivElement;
        mainDiv.innerHTML = '';
        this.topContainer = document.getElementById(`${divId}TopContent`) as HTMLDivElement;
        this.container = document.createElement("div")
        this.container.setAttribute("id", `${divId}_content_${this.id}`);
        mainDiv.appendChild(this.container);
        this.populateMenu();
    }

    public timelineUpdate () {
        let obj = Timeline.getDates();
        if (! obj) { return; }
        if (props.imageryDate == obj["single"].start) { return; }
        props.imageryDate = obj["single"].start;
        mapUtils.updateImageryLayers(props.imageryDate);
        mapUtils.setImageryInfo();
    }

    public populateMenu() {
        // populate menu with components. Check they are defined first
        let cfg = (props.config as IConfigDef);
        if (! cfg || !cfg.menuOptions ) { return; }
        for (let i=0; i<cfg.menuOptions.length; i++) {
            let obj = cfg.menuOptions[i];
            if (obj.id == this.id) {
                if (obj.modules) {
                    for (let j=0; j<obj.modules.length; j++) {
                        let mod = obj.modules[j];
                        if (obj._moduleHandlers[mod]) {
                            obj._moduleHandlers[mod].render();
                        }
                    }
                }
            }
        }
    }

}