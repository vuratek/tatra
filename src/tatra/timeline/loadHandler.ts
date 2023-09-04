import { library } from "../library";
import { Timeline } from "./Timeline";
import { navProps } from "../page/navProps";

export class loadHandler {
    private static loaded : boolean = false;
    private static loading : boolean = false;
    private static readonly EVENT_LOAD_TIMELINE_LIBRARY : string = "load_timeline_library";

    public static load () {
        if (this.loaded) {
            this.callBack();
            return;
        } else {
            if (! this.loading) {
                this.loading = true;
                document.addEventListener(this.EVENT_LOAD_TIMELINE_LIBRARY, ()=>this.loadLibrary());
                document.dispatchEvent(new CustomEvent(this.EVENT_LOAD_TIMELINE_LIBRARY));      
            }
        }
    }

    private static callBack () {
        this.loaded = true;
        Timeline.eventTimelineLoaded();
    }

    private static loadLibrary() {
        if (navProps.settings.app.timelineURL) {
            library.load(navProps.settings.app.timelineURL, () => this.callBack());
        }
    }
}