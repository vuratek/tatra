import { Navigation } from "../page/Navigation";
import { library } from "../library";
import { Timeline } from "./Timeline";

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
                if (Navigation.settings.app.timelineURL) {
                    library.load(Navigation.settings.app.timelineURL, () => this.callBack());
                }
            }
        }
    }

    private static callBack () {
        this.loaded = true;
        Timeline.eventTimelineLoaded();
    }
}