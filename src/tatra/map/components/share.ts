import { events } from "../events";
import { mapUtils } from "../mapUtils";
import { utils } from "../../utils";
import { baseComponent } from "./BaseComponent";
import { props } from "../props";
import { IConfigDef } from "../defs/ConfigDef";

/**
 * @param url       http address that is used for your application. If empty, this will copy the window.url value; Needed for twitter ex. https://go.nasa.gov/2OHML5k
 * @param refUrl    address that holds the url for facebook/twitter ... to be used
 * @param subject   replace auto generated subject which combines props.applicationName with lat lon coordinates
 */
export class ShareObject {

    public url      : string = '';
    public refUrl   : string = '';
    public subject  : string = '';
}
/**
 * supported keys: facebook, twitter, mail, reddit
 */
export interface IShareObject {
    [key:string]    : ShareObject;
}

export class share extends baseComponent {

	public static id		: string = 'share';
	public static label		: string = 'Share URL';
    public static draggable : boolean = true;

    public static list      : IShareObject = {};

    public static init() {
        super.init();
        this.list['mail'] = { url : '', refUrl: 'mailto:?', subject: '' };
        this.list['twitter'] = { url : '', refUrl: 'https://twitter.com/intent/tweet?', subject: '' };
        this.list['facebook'] = { url : '', refUrl: 'https://www.facebook.com/dialog/share?app_id=121285908450463&display=popup&', subject: '' };
        this.list['reddit'] = { url : '', refUrl: 'https://www.reddit.com/login?redirect=https://www.reddit.com/r/nasa/submit?', subject: ''};
    }
        
    public static open () {
        share.setValue();
        super.open();
        this.defaultPosition();
    }

	public static onClick (evt:Event) {
		if (! this.initialized) {
            document.addEventListener(events.EVENT_HASH_UPDATE, share.updateHash);
		}
        super.onClick(evt as CustomEvent);
    }
    
    public static createWindow () {
		super.createWindow();

		let el = document.getElementById(`lmvControls_${this.id}_Content`) as HTMLDivElement;
        if (! el) { return; }
        el.innerHTML = `
            <input type="text" readonly id="lmvControls_shareLink">
            <div id="lmvControls_shareCopy">Copy</div>
            <div id="lmvControls_shareContent">
                <div id="lmvCtrlShare_facebook" class="lmvControls_shareContentBtn">
                    <i title="Facebook" class="fab fa-facebook" aria-hidden="true"></i>
                </div>
                <div id="lmvCtrlShare_twitter" class="lmvControls_shareContentBtn">
                    <i title="Twitter" class="fab fa-twitter" aria-hidden="true"></i>
                </div>
                <div id="lmvCtrlShare_reddit" class="lmvControls_shareContentBtn">
                    <i title="Reddit" class="fab fa-reddit-alien" aria-hidden="true"></i>
                </div>
                <div id="lmvCtrlShare_email" class="lmvControls_shareContentBtn">
                    <i title="E-mail" class="fa fa-envelope" aria-hidden="true"></i>
                </div>
            </div>
        `;
        utils.setClick('lmvControls_shareCopy', () => this.copy());
        utils.setClick('lmvCtrlShare_facebook', () => this.facebook());
        utils.setClick('lmvCtrlShare_twitter', () => this.twitter());
        utils.setClick('lmvCtrlShare_reddit', () => this.reddit());
        utils.setClick('lmvCtrlShare_email', () => this.email());

    }
        
	public static copy () {
		let text = (document.getElementById('lmvControls_shareLink') as HTMLInputElement);
		text.select();
		document.execCommand("copy");
	}
    
    public static setValue () {
		(document.getElementById('lmvControls_shareLink') as HTMLInputElement).value = window.location.href;
    }
    
	public static shorten () {
		if ((document.getElementById('lmvControls_shareShortenChk') as HTMLInputElement).checked) {
		}
    }
    
	public static getTitle (type : string) {
        if (share.list[type] && share.list[type].subject) {
            return share.list[type].subject;
        }
		return encodeURIComponent((props.config as IConfigDef).properties.applicationName + ': ' + document.getElementById('lmvFeatureInfo1').textContent);
    }
    
	public static getUrl (type : string) {
        if (share.list[type] && share.list[type].url) {
            return encodeURIComponent(share.list[type].url);
        }

		return encodeURIComponent((document.getElementById('lmvControls_shareLink') as HTMLInputElement).value);
    }
    
	public static send (type : string) {
		let title = share.getTitle(type);
		let url = share.getUrl(type);
		switch (type) {
			case 'email':
				window.open('mailto:?subject='+title+'&body=' + url);
				break;
			case 'twitter':
				url = encodeURIComponent('https://go.nasa.gov/2OHML5k');
				window.open('https://twitter.com/intent/tweet?url='+url+'&text=' + (props.config as IConfigDef).properties.applicationName);
				break;
			case 'reddit':
				window.open('https://www.reddit.com/login?redirect=https://www.reddit.com/r/nasa/submit?url=' + url + '&title=' + title);
				break;
			case 'facebook':
				window.open('https://www.facebook.com/dialog/share?app_id=121285908450463&href=' + url + '&display=popup');
				break;
			case 'tumbler':
				//url = encodeURIComponent('https://go.nasa.gov/2OHML5k');
//				url = 'http://firms.modaps.eosdis.nasa.gov/map/#z:6;c:97.2,33.5;d:2018-10-04..2018-10-05;l:firms_viirs,firms_modis_t,fire_viirs_crtc';
//				window.open('https://www.tumblr.com/widgets/share/tool/preview?posttype=link&canonicalUrl='+url+'k&title=' + title);
				break;
        }
        mapUtils.analyticsTrack('share-' + type);
    }
    
	public static email () {
		share.send('email');
    }
    
	public static reddit () {
		share.send('reddit');
    }
    
	public static facebook () {
		share.send('facebook');
    }
    
	public static twitter () {
		share.send('twitter');
    }
    
	public static tumbler () {
		share.send('tumbler');
    }
    
	public static updateHash () {
        let input = document.getElementById('lmvControls_shareLink') as HTMLInputElement;
        if (input) {
            (document.getElementById('lmvControls_shareLink') as HTMLInputElement).value = window.location.href;
        }
    }
    
}