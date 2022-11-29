import { navProps } from "../page/navProps";

export class feedback {
    
    public static submit() {
        let str = " -- " + window.location.pathname;
        if (window.location.hash) {
            str += window.location.hash;
        }
        if (window.feedback) {
            let feed = (navProps.settings.app.feedbackHeader) ? navProps.settings.app.feedbackHeader : 'Feedback';
            window.feedback.showForm({subject:feed + str});
        }
    }
}
