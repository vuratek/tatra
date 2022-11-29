import { library } from "../library";
import { Timeline } from "./Timeline";
import { navProps } from "../page/navProps";

export class loadHandler {
    private static loaded : boolean = false;
    private static loading : boolean = false;

    public static load () {
        if (this.loaded) {
            this.callBack();
            return;
        } else {
            if (! this.loading) {
                this.loading = true;
                if (navProps.settings.app.timelineURL) {
                    library.load(navProps.settings.app.timelineURL, () => this.callBack());
                }
            }
        }
    }

    private static callBack () {
        this.loaded = true;
        Timeline.eventTimelineLoaded();
    }
}