import { Navigation } from "../page/Navigation";

export class feedback {
    
    public static submit() {
        let str = " -- " + window.location.pathname;
        if (window.location.hash) {
            str += window.location.hash;
        }
        if (window.feedback) {
            let feed = (Navigation.settings.app.feedbackHeader) ? Navigation.settings.app.feedbackHeader : 'Feedback';
            window.feedback.showForm({subject:feed + str});
        }
    }
}
