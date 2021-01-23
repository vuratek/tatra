import { Navigation } from './Navigation';
export class Header {
    
    public static init() {
        let header = Navigation.header;
        if (! header) { return; }
//        <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"> 
        let label = '';
        let beta = '';
        if (Navigation.settings.app.isBeta === true) {
            beta = ' <span class="isBETA">BETA</span>';
        }
        let urlHome = (Navigation.settings.app.alternateHome) ? Navigation.settings.app.alternateHome : '/';
        if (Navigation.settings.app.doubleShortLabel && Navigation.settings.app.doubleLongLabel) {
            label = `
                <a href="${urlHome}">
                    <div id="headerTxtLabel" class="headerTxtLabel">
                        <span id="headerLabelShort" class="headerLabel headerLabelShort font">${Navigation.settings.app.doubleShortLabel}${beta}</span><br/>
                        <span class="headerLabel font">${Navigation.settings.app.doubleLongLabel}</span>
                    </div>
                    <div id="headerTxtLabelSmall" class="headerTxtLabel font">${Navigation.settings.app.doubleShortLabel}${beta}</div>
                </a>
            `;
        } else {
            let short = ( Navigation.settings.app.singleShortLabel ) ? Navigation.settings.app.singleShortLabel : Navigation.settings.app.singleLabel;
            label = `
                <a href="${urlHome}">
                    <div id="headerTxtLabel" class="headerTxtLabel isSingle">
                        <span id="headerLabelShort" class="headerLabel font headerLabelShort isSingle">${Navigation.settings.app.singleLabel}${beta}</span>
                    </div>
                    <div id="headerTxtLabelSmall" class="headerTxtLabel font">${short}</div>
                </a>
            `;
        }
        let second = (Navigation.settings.app.mainIcon2) ? '<img id="headerLogo2" alt="Logo2">' : '';
        header.innerHTML = `
            <div id="earthdata-notification-banner"></div>
            <div class="header-wrap">
                <div id="headerTitle" class="topMenu-logo">
                    <a href="${urlHome}">
                        <div class="logoWrapper">
                            <img id="headerLogo" alt="Logo">
                            ${second}
                        </div>
                    </a>
                    ${label}                    
                </div>		
				<div id="cart" class="cart"></div>                 
            </div>
            <nav id="navBar" class="topNavBar"></nav>	   
            <div id="topMenuContentWrap"></div>
        `;
    }
    public static setLogo () {
        let url = Navigation.settings.app.mainIcon;
        let logo = document.getElementById('headerLogo') as HTMLImageElement;
        if (logo) {
            logo.src = url;
        }
        if (Navigation.settings.app.mainIcon2) {
            logo = document.getElementById('headerLogo2') as HTMLImageElement;
            url = Navigation.settings.app.mainIcon2;
            if (logo) {
                logo.src = url;
            }
        }
    }
}